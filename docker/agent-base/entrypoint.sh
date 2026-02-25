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

# ── 5. Ensure OpenClaw picks up API keys via env vars
# OpenClaw reads GEMINI_API_KEY (not GOOGLE_API_KEY), OPENAI_API_KEY, ANTHROPIC_API_KEY
# Normalize Google key name for OpenClaw compatibility
if [ -n "$GOOGLE_API_KEY" ] && [ -z "$GEMINI_API_KEY" ]; then
  export GEMINI_API_KEY="$GOOGLE_API_KEY"
fi

exec "$@"
