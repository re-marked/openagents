#!/bin/sh
# OpenAgents agent entrypoint
# Always overwrite config; seed workspace files once; write auth-profiles from env

# ── 1. Copy base config (always overwrite — provisioner may change model/overrides)
cp /opt/openclaw-defaults/openclaw.json /data/openclaw.json
mkdir -p /data/workspace /data/memory /data/sessions

# ── 2. Seed workspace files on first boot
if [ -z "$(ls -A /data/workspace 2>/dev/null)" ]; then
  cp -r /opt/openclaw-defaults/workspace/. /data/workspace/ 2>/dev/null || true
fi
# Always refresh tools + skills (may be updated in new image)
cp -r /opt/openclaw-defaults/workspace/tools /data/workspace/ 2>/dev/null || true
cp -r /opt/openclaw-defaults/workspace/skills /data/workspace/ 2>/dev/null || true

# ── 3. Role overrides (sub-agents)
if [ -n "$AGENT_SOUL_MD" ]; then printf '%s' "$AGENT_SOUL_MD" > /data/workspace/SOUL.md; fi
if [ -n "$AGENT_YAML" ]; then printf '%s' "$AGENT_YAML" > /data/workspace/AGENT.yaml; fi

# ── 4. Merge openclaw.json overrides (model, sandbox, etc.)
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

# ── 5. Normalize Google key name for OpenClaw compatibility
if [ -n "$GOOGLE_API_KEY" ] && [ -z "$GEMINI_API_KEY" ]; then
  export GEMINI_API_KEY="$GOOGLE_API_KEY"
fi

# ── 6. Write auth-profiles.json from env vars
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

exec "$@"
