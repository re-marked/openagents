# OpenClaw Gateway — Deep Research Reference
Research date: 2026-02-21. Version researched: 2026.2.17 / 2026.2.19.

## Official Docker Image

```
ghcr.io/openclaw/openclaw:<tag>
```

Available tags follow the version date pattern: `2026.2.19`, `2026.2.19-arm64`, `main`, `main-amd64`, `main-arm64`.
Pull: `docker pull ghcr.io/openclaw/openclaw:2026.2.19`
Total downloads: 507K as of research date.
Base image is `node:22-bookworm`. Runs as non-root `node` user (uid 1000).

## Correct CMD / Entrypoint

The gateway is a Node.js process. The confirmed CMD from community docker-compose files:

```
node dist/index.js gateway
```

Alternative confirmed foreground patterns:
- `openclaw gateway` (if binary is in PATH)
- `node dist/index.js gateway --allow-unconfigured --bind lan --port 18789`

The `gateway` subcommand with no lifecycle suffix (`start`/`stop`) runs in **foreground mode** — no supervisor, process stays alive, logs to stdout. This is the correct pattern for Docker.

`gateway run` is documented as a foreground alias, but community issue #5739 showed the original Dockerfile was missing the `gateway` subcommand entirely (was just `node dist/index.js`), which printed help and exited. This was fixed by adding `gateway`.

WARNING: The project's current Dockerfile uses `node openclaw.mjs gateway run`. The `openclaw.mjs` entrypoint path may differ from `dist/index.js` depending on the image build. Verify against the actual image contents.

## openclaw.json Config Schema (gateway section)

```jsonc
{
  "gateway": {
    "mode": "local",           // "local" | "remote" — must be "local" for server
    "port": 18789,             // TCP port, default 18789
    "bind": "lan",             // see Bind Modes below
    "customBindHost": "...",   // only when bind="custom", valid IPv4

    "auth": {
      "mode": "token",         // "token" | "password"
      "token": "...",          // or use OPENCLAW_GATEWAY_TOKEN env var
      "password": "...",       // or use OPENCLAW_GATEWAY_PASSWORD env var
      "allowTailscale": false  // bypass auth for Tailscale connections
    },

    "http": {
      "endpoints": {
        "chatCompletions": { "enabled": false },  // /v1/chat/completions
        "responses":       { "enabled": false }   // /v1/responses
      }
    },

    "controlUi": {
      "enabled": true,
      "allowInsecureAuth": false,    // set true if behind a reverse proxy without TLS
      "allowedOrigins": [],
      "dangerouslyDisableDeviceAuth": false
    },

    "trustedProxies": [],           // proxy IPs for header forwarding

    "tls": {
      "enabled": false,
      "autoGenerate": true,
      "certPath": "",
      "keyPath": ""
    },

    "reload": {
      "mode": "hybrid",   // "off" | "restart" | "hot" | "hybrid"
      "debounceMs": 300
    }
  }
}
```

Zod validates this with `.strict()` — unknown keys cause a startup failure ("Config validation failed: gateway: Unrecognized key"). This was the bug in issue #5435 with `customBindHost`.

## Bind Modes — Exact Behavior

| bind value | Server listens on | Notes |
|------------|-------------------|-------|
| `loopback` | `127.0.0.1` | Default. Local access only. |
| `lan`      | `0.0.0.0`   | All interfaces. **Correct for Docker/Fly.io.** |
| `auto`     | `127.0.0.1` (prefers), `0.0.0.0` (fallback) | Inconsistent in containers |
| `custom`   | `gateway.customBindHost` value; falls back to `0.0.0.0` if IP unavailable | |
| `tailnet`  | Tailscale IP | Requires Tailscale installed |

**Important bug (issue #19004):** When `bind=lan`, the CLI's `buildGatewayConnectionDetails()` uses the LAN IP for local calls instead of `127.0.0.1`. This means same-container CLI commands (`openclaw status`, `openclaw cron list`) route through the LAN IP and fail the `isLocalDirectRequest()` check ("pairing required"). For Fly.io deployments where you only hit the gateway via HTTP (not CLI), this is not an issue. But if you exec into the container and use CLI commands, use `bind=loopback` or `bind=auto` instead of `bind=lan`.

**For Fly.io (HTTP-only access):** Use `bind=lan` so the gateway listens on `0.0.0.0:18789` and Fly's proxy can reach it.

## HTTP Endpoints

All HTTP endpoints are served on the **same port** as the WebSocket gateway (18789 by default). HTTP and WebSocket are multiplexed on the same listener.

| Endpoint | Method | Default | Config to enable |
|----------|--------|---------|-----------------|
| `/` | GET | enabled | Control UI (dashboard) |
| `/v1/chat/completions` | POST | **disabled** | `gateway.http.endpoints.chatCompletions.enabled: true` |
| `/v1/responses` | POST | **disabled** | `gateway.http.endpoints.responses.enabled: true` |
| `/tools/invoke` | POST | unknown | Direct tool invocation |
| `/health` | GET | enabled | Health check (returns HTML in some versions — see issue #19874) |

There is **no** `/v1/completions` endpoint. The OpenAI-compatible endpoint is `/v1/chat/completions` only.

## WebSocket Protocol

Native OpenClaw WebSocket RPC connects to `ws://host:18789`. This is the primary protocol for full agent streaming. The gateway fails closed — no auth = no connection.

## Authentication

### Token mode (recommended)
Config:
```json
{ "gateway": { "auth": { "mode": "token", "token": "..." } } }
```
Or env var: `OPENCLAW_GATEWAY_TOKEN=<token>`

HTTP requests: `Authorization: Bearer <token>`
WebSocket: credentials in WS upgrade params as `connect.params.auth.token`

Token generation: `openclaw doctor --generate-gateway-token` (openssl rand -hex 32 equivalent)

### Password mode
Config:
```json
{ "gateway": { "auth": { "mode": "password", "password": "..." } } }
```
Or env var: `OPENCLAW_GATEWAY_PASSWORD=<password>`

### Security requirement
Binding beyond loopback (lan, custom) **requires** auth configured. The gateway blocks non-loopback binds without auth as a safety guardrail. Auth failures return 429 with Retry-After after excessive attempts.

## Agent Selection (HTTP API)

When calling `/v1/chat/completions`:
- `model` field: `"openclaw:<agentId>"` or `"agent:<agentId>"` or just `"openclaw"` (uses `main`)
- Header: `x-openclaw-agent-id: <agentId>` (defaults to `main`)
- Session control: `x-openclaw-session-key: <sessionKey>`

## Environment Variables (Docker)

| Var | Purpose |
|-----|---------|
| `OPENCLAW_GATEWAY_TOKEN` | Overrides `gateway.auth.token` in config |
| `OPENCLAW_GATEWAY_PASSWORD` | Overrides `gateway.auth.password` in config |
| `OPENCLAW_STATE_DIR` | State/config directory (default `~/.openclaw`) |
| `OPENCLAW_CONFIG_DIR` | Config directory (default `$HOME/.openclaw`) |
| `OPENCLAW_WORKSPACE_DIR` | Workspace directory |
| `OPENCLAW_GATEWAY_PORT` | Port override (default 18789) |
| `NODE_OPTIONS` | Node.js options (e.g. `--max-old-space-size=1536`) |
| `PORT` | Platform port override (used by Render/Railway) |

## Verified docker-compose Pattern (from Sunwood-AI-OSS-Hub)

```yaml
services:
  openclaw-gateway:
    image: ghcr.io/openclaw/openclaw:latest
    container_name: openclaw-gateway
    ports:
      - "18789:18789"
    environment:
      HOME: /home/node
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
    volumes:
      - ./config:/home/node/.openclaw
      - ./workspace:/home/node/.openclaw/workspace
    command: "sh -c 'rm -f /home/node/.openclaw/*.lock && exec node dist/index.js gateway'"
    restart: unless-stopped
```

Key note: The `rm -f *.lock` step removes stale lock files before starting — important for restart scenarios.

## auth-profiles.json — Correct Format (VERIFIED 2026-02-28)

File path: `/data/agents/main/agent/auth-profiles.json`
(General pattern: `$OPENCLAW_STATE_DIR/agents/<agent-id>/agent/auth-profiles.json`)

**Breaking change in 2026.2.19 (Issue #21448)**: credential field changed from `"token"` → `"key"`.

Correct format as of 2026.2.19+:

```json
{
  "version": 1,
  "profiles": {
    "google:default": {
      "type": "api_key",
      "provider": "google",
      "key": "AIzaSy..."
    },
    "anthropic:default": {
      "type": "api_key",
      "provider": "anthropic",
      "key": "sk-ant-api03-..."
    },
    "openai:default": {
      "type": "api_key",
      "provider": "openai",
      "key": "sk-proj-..."
    }
  }
}
```

Three silent failure modes that produce "ignored invalid auth profile entries during store load":
1. `"apiKey"` or `"token"` instead of `"key"` — parser calls `cred.key?.trim()`, finds nothing, drops entry
2. Bare provider names (`"google"`) instead of `"provider:name"` format (`"google:default"`)
3. Missing `"version": 1` at top level
4. Missing `"provider"` field inside each profile entry

**Project fix**: `docker/agent-base/entrypoint.sh` was updated 2026-02-28 to use correct format.

## Issues / Gotchas

1. **bind=lan + CLI commands**: Issue #19004 — CLI routes to LAN IP, fails local auth check. Don't use `bind=lan` if you need CLI access from inside the container.
2. **customBindHost Zod bug**: Issue #5435 — fixed, but verify your version has the fix.
3. **bind invalid input restart loop**: Issue #8641 — invalid bind values cause infinite restart loop. Valid values: `loopback | lan | tailnet | auto | custom`.
4. **Health check returns HTML**: Issue #19874 — on v2026.2.17 with controlUi enabled, `/health` returns HTML. If your health check expects JSON, either disable controlUi or parse differently.
5. **Missing `gateway` subcommand**: PR #5739 — original Dockerfile CMD was `node dist/index.js` (no `gateway`), causing it to print help and exit. Fixed by adding `gateway` subcommand.
6. **Device pairing in cloud**: The controlUi device auth doesn't work well in Docker/reverse-proxy deployments. Set `gateway.controlUi.dangerouslyDisableDeviceAuth: true` for cloud deployments, or use `--allow-unconfigured` for initial setup.
