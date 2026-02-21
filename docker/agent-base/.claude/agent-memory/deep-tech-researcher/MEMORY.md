# Deep Tech Researcher Memory

## OpenClaw Gateway — Key Research Findings (2026-02-21)

See `openclaw-gateway.md` for full details.

### Critical facts:
- Official image: `ghcr.io/openclaw/openclaw:<version>` (e.g. `2026.2.19`)
- CMD for foreground gateway: `node dist/index.js gateway` (NOT `node openclaw.mjs gateway run`)
- `bind=lan` binds to `0.0.0.0` (all interfaces) — correct for Docker/Fly.io
- `bind=custom` requires `gateway.customBindHost` set to a valid IPv4 — was a Zod bug in early versions (fixed)
- HTTP endpoints (`/v1/chat/completions`, `/v1/responses`) are **disabled by default** — must enable in config
- Auth token passes via `Authorization: Bearer <token>` for HTTP; via WS upgrade params for WebSocket
- `OPENCLAW_GATEWAY_TOKEN` env var overrides config token (use this in Docker/Fly secrets)
- Default port: 18789; canvas file server: 18793
- `--allow-unconfigured` flag: allows gateway start without `gateway.mode=local` in config
- `gateway run` subcommand = foreground alias (but `gateway` alone also runs in foreground)
- Issue #19004: `bind=lan` causes CLI to use LAN IP for local calls — breaks same-host CLI commands

### Project-specific (docker/agent-base):
- Current CMD uses `node openclaw.mjs gateway run` — verify this entrypoint exists in the image
- `bind=auto` in openclaw.json — consider changing to `lan` for deterministic Fly.io behavior
- `OPENCLAW_STATE_DIR=/data` maps config to /data volume
- fly.toml uses `internal_port = 18789` with Fly HTTP service proxy
