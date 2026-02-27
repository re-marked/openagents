#!/bin/sh
# AgentBay agent entrypoint
# Seed config + workspace on first boot only; always refresh auth-profiles from env

mkdir -p /data/workspace /data/memory /data/sessions

# ── 1. Seed openclaw.json on first boot only (never overwrite user edits)
if [ ! -f /data/openclaw.json ]; then
  echo "[entrypoint] First boot — seeding openclaw.json"
  cp /opt/openclaw-defaults/openclaw.json /data/openclaw.json

  # Apply provisioner overrides (model, sandbox, etc.) on first boot
  if [ -n "$AGENT_OPENCLAW_OVERRIDES" ]; then
    node -e "\
      const fs = require('fs');\
      const base = JSON.parse(fs.readFileSync('/data/openclaw.json'));\
      const over = JSON.parse(process.env.AGENT_OPENCLAW_OVERRIDES);\
      function merge(a, b) {\
        for (const k in b) {\
          if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) {\
            a[k] = merge(a[k] || {}, b[k]);\
          } else { a[k] = b[k]; }\
        } return a;\
      }\
      fs.writeFileSync('/data/openclaw.json', JSON.stringify(merge(base, over), null, 2));\
    "
  fi
else
  echo "[entrypoint] Existing openclaw.json found — preserving user config"
fi

# ── 1b. Strip deprecated keys that crash newer OpenClaw versions
if [ -f /data/openclaw.json ]; then
  node -e "\
    const fs = require('fs');\
    const cfg = JSON.parse(fs.readFileSync('/data/openclaw.json', 'utf8'));\
    let changed = false;\
    if (cfg.tools?.elevated?.autoApprove !== undefined) {\
      delete cfg.tools.elevated.autoApprove;\
      changed = true;\
    }\
    if (changed) {\
      fs.writeFileSync('/data/openclaw.json', JSON.stringify(cfg, null, 2));\
      console.log('[entrypoint] Stripped deprecated config keys from openclaw.json');\
    }\
  "
fi

# ── 2. Seed workspace files on first boot
if [ -z "$(ls -A /data/workspace 2>/dev/null)" ]; then
  cp -r /opt/openclaw-defaults/workspace/. /data/workspace/ 2>/dev/null || true
fi

# ── 3. Role overrides (sub-agents) — only on first boot
if [ -n "$AGENT_SOUL_MD" ] && [ ! -f /data/.initialized ]; then
  printf '%s' "$AGENT_SOUL_MD" > /data/workspace/SOUL.md
fi
if [ -n "$AGENT_YAML" ] && [ ! -f /data/.initialized ]; then
  printf '%s' "$AGENT_YAML" > /data/workspace/AGENT.yaml
fi

# ── 4. Normalize Google key name for OpenClaw compatibility
if [ -n "$GOOGLE_API_KEY" ] && [ -z "$GEMINI_API_KEY" ]; then
  export GEMINI_API_KEY="$GOOGLE_API_KEY"
fi

# ── 5. Write auth-profiles.json from env vars (always refresh — keys may change)
# OpenClaw does NOT read API keys from env vars — it reads them from
# /data/agents/main/agent/auth-profiles.json. We must generate this file
# from the env vars that the provisioning task passes to the machine.
AUTH_DIR="/data/agents/main/agent"
AUTH_FILE="$AUTH_DIR/auth-profiles.json"
mkdir -p "$AUTH_DIR"

node -e "\
  const fs = require('fs');\
  const profiles = {};\
  if (process.env.GEMINI_API_KEY) profiles.google = { type: 'api-key', apiKey: process.env.GEMINI_API_KEY };\
  if (process.env.ANTHROPIC_API_KEY) profiles.anthropic = { type: 'api-key', apiKey: process.env.ANTHROPIC_API_KEY };\
  if (process.env.OPENAI_API_KEY) profiles.openai = { type: 'api-key', apiKey: process.env.OPENAI_API_KEY };\
  if (Object.keys(profiles).length > 0) {\
    fs.writeFileSync('$AUTH_FILE', JSON.stringify({ profiles }, null, 2));\
    console.log('auth-profiles.json written with providers:', Object.keys(profiles).join(', '));\
  } else {\
    console.warn('WARNING: No API keys found in env vars — auth-profiles.json not written');\
  }\
"

# Mark first boot complete
touch /data/.initialized

exec "$@"
