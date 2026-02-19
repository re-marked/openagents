# Security Model

## Threat Model

OpenAgents runs untrusted code (Agent configs, skills) in containers that have access to LLM APIs, file systems, and optionally user SSH credentials. The threat surface is:

1. **Malicious skills** — prompt injection, credential theft, malware
2. **Container escape** — Agent code breaks out of the sandbox
3. **Cross-tenant access** — One user's Agent accesses another user's data
4. **API key exfiltration** — Agent extracts the platform's Anthropic/OpenAI key
5. **SSH abuse** — Agent performs unauthorized actions on user's machine
6. **Prompt injection** — User input manipulates Agent behavior

---

## Defense Layers

### Layer 1: Container Isolation (Fly.io Firecracker)

Every Agent Machine is a Firecracker microVM with its own dedicated kernel. This is hardware-enforced isolation — stronger than Docker namespaces.

- Each Machine has its own: kernel, filesystem, network namespace, process tree
- No shared memory between Machines
- Custom 6PN per customer prevents cross-tenant network access
- Resource limits (CPU, RAM) enforced by the hypervisor

**This is the same isolation technology used by AWS Lambda.**

### Layer 2: Skill Signing Pipeline

Every Skill published on OpenAgents must be signed before it can run.

```
Submission → Static Analysis → Sandboxed Build → Behavioral Analysis → Signing
```

**Step 1: Static Analysis**
- Semgrep rules for common injection patterns
- SKILL.md parsed: suspicious tool declarations flagged (network, exec, filesystem)
- Any npm/pip dependencies: Snyk vulnerability scan
- Known malicious pattern database (derived from Snyk ToxicSkills research)

**Step 2: Sandboxed Build**
- Docker image built in network-restricted environment
- Resulting image scanned with Trivy for CVEs
- No outbound network during build

**Step 3: Behavioral Analysis (high-risk skills only)**
- Skill run with canary inputs in isolated sandbox
- Monitor: network connections, file writes, subprocess spawns
- Flag unexpected behavior for manual review

**Step 4: Manual Review Queue**
- Auto-approved: skills that pass all automated checks
- Flagged: skills that trigger any warning → human reviews
- Rejected: skills with confirmed malicious behavior → creator warned

**Step 5: Signing**
- Approved skills signed with platform Ed25519 key
- Signature covers: skill content hash + declared permissions hash
- Signature stored in Supabase (skills_signatures table)

**Runtime Enforcement:**
- OpenClaw container configured to verify signatures before loading any skill
- Unsigned or signature-mismatched skills are rejected
- Signature check happens at Machine boot time

### Layer 3: API Key Management

**Platform-managed keys (default):**
```
Platform holds: ANTHROPIC_API_KEY, OPENAI_API_KEY
Machine receives: key injected as env var at provision time
User never sees: the raw API key

Metering: usage tracked per-session, deducted from user credits
```

The API key is visible inside the container (it's an env var). A malicious Agent could theoretically extract it. Mitigations:
- API keys are scoped to the OpenAgents organization (not personal keys)
- Usage anomaly detection: if a Machine suddenly consumes 100x normal tokens, alert + suspend
- Rate limiting per Machine: max tokens/hour enforced at the platform level
- Key rotation: rotate keys monthly, push new keys to all Machines

**User-provided keys (future, power users only):**
- Stored encrypted in Supabase Vault (pgsodium)
- Decrypted only when injected into Machine env at boot time
- Never logged, never transmitted unencrypted

### Layer 4: SSH Access Security

When a user gives their Agent SSH access to their personal machine:

**Storage:**
- SSH private key encrypted with pgsodium, stored in Supabase Vault
- Decryptable only in the context of the user's authenticated session
- Never stored in the Fly.io Machine's filesystem — injected at runtime via env var

**Access Control:**
- SSH tool only available when user explicitly configures it
- Agent can only initiate SSH when the user requests it in conversation
- Rate limit: max 10 SSH commands per minute
- Command allowlist / denylist (configurable by user)

**Audit Trail:**
- Every SSH command logged: timestamp, command, exit code, output (truncated)
- Audit log visible to user on Agent status page
- Logs stored in Supabase, retained 90 days
- User can export audit logs

**Revocation:**
- User can revoke SSH access instantly from Agent settings
- Credentials immediately deleted from Vault
- Machine's SSH tool disabled on next request

### Layer 5: Prompt Injection Defense

Multiple layers, defense in depth:

1. **Structural separation:** System prompt and user content in separate API messages. Never concatenated.
2. **Input sanitization:** Strip control characters, truncate to 32K chars.
3. **Permission minimization:** Each skill declares required tools. Runtime enforces — skill can only use declared tools.
4. **Canary tokens:** Inject traceable strings into context. Alert if they appear in tool calls or outputs (detects exfiltration attempts).
5. **Output validation:** Tool call results validated against expected schema before use.
6. **Audit logging:** All tool invocations logged. Anomaly detection on patterns.
7. **Injection pattern detection:** Regex patterns for common injection attempts. Don't block — flag for audit.

### Layer 6: Multi-Tenant Data Isolation (Supabase RLS)

Every table has Row Level Security. Users can only access their own data.

```sql
-- Example: users can only see their own Agent instances
CREATE POLICY "instances_own" ON agent_instances
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

Service role (used by Trigger.dev for admin operations) bypasses RLS. This is secured by:
- Service role key stored only in server-side environment variables
- Never exposed to the browser
- Never sent to Fly.io Machines

---

## Security Comparison: OpenAgents vs. ClawHub

| Dimension | ClawHub | OpenAgents |
|-----------|---------|------------|
| Skill signing | None | Ed25519, mandatory |
| Publisher verification | 1-week GitHub account | Stripe Connect KYC |
| Security scanning | None | Semgrep + Snyk + Trivy |
| Malicious skill rate | 13.4% critical | Target: 0% (reject before publish) |
| Container isolation | User's machine (no isolation) | Firecracker microVM |
| API key exposure | User manages own keys | Platform-managed, rotated |
| Audit logging | None | Full tool + SSH audit trail |
| Prompt injection defense | None built-in | 7-layer defense |
