#!/bin/sh
# AgentBay agent entrypoint
# Seed config + workspace on first boot only; always refresh auth-profiles from env

mkdir -p /data/workspace /data/memory /data/sessions

# ── 1. Seed workspace files on first boot
if [ -z "$(ls -A /data/workspace 2>/dev/null)" ]; then
  cp -r /opt/openclaw-defaults/workspace/. /data/workspace/ 2>/dev/null || true
fi

# ── 2. Role overrides (sub-agents) — only on first boot
if [ -n "$AGENT_SOUL_MD" ] && [ ! -f /data/.initialized ]; then
  printf '%s' "$AGENT_SOUL_MD" > /data/workspace/SOUL.md
fi
if [ -n "$AGENT_YAML" ] && [ ! -f /data/.initialized ]; then
  printf '%s' "$AGENT_YAML" > /data/workspace/agent.yaml
fi

# ── 3. Generate openclaw.json from agent.yaml (first boot only)
if [ ! -f /data/openclaw.json ]; then
  echo "[entrypoint] First boot — generating openclaw.json"

  # Start from the shipped defaults
  cp /opt/openclaw-defaults/openclaw.json /data/openclaw.json

  # If agent.yaml exists, parse it and merge into openclaw.json
  if [ -f /data/workspace/agent.yaml ]; then
    echo "[entrypoint] Parsing agent.yaml → merging into openclaw.json"
    node -e "
      const fs = require('fs');
      const YAML = require('/app/node_modules/yaml');

      const cfg = JSON.parse(fs.readFileSync('/data/openclaw.json', 'utf8'));
      const agent = YAML.parse(fs.readFileSync('/data/workspace/agent.yaml', 'utf8'));

      // Model
      if (agent.model?.primary) {
        cfg.agents = cfg.agents || {};
        cfg.agents.defaults = cfg.agents.defaults || {};
        cfg.agents.defaults.model = cfg.agents.defaults.model || {};
        cfg.agents.defaults.model.primary = agent.model.primary;
      }
      if (agent.model?.aliases) {
        cfg.agents.defaults.models = cfg.agents.defaults.models || {};
        for (const [alias, modelId] of Object.entries(agent.model.aliases)) {
          cfg.agents.defaults.models[modelId] = { alias };
        }
      }

      // Sandbox
      if (agent.sandbox) {
        cfg.agents.defaults.sandbox = { mode: agent.sandbox };
      }

      // Runtime
      if (agent.runtime) {
        if (agent.runtime.maxConcurrent) cfg.agents.defaults.maxConcurrent = agent.runtime.maxConcurrent;
        if (agent.runtime.subagents?.maxConcurrent) {
          cfg.agents.defaults.subagents = { maxConcurrent: agent.runtime.subagents.maxConcurrent };
        }
        if (agent.runtime.verbose) cfg.agents.defaults.verboseDefault = agent.runtime.verbose;
        if (agent.runtime.blockStreaming !== undefined) {
          cfg.agents.defaults.blockStreamingDefault = agent.runtime.blockStreaming ? 'on' : 'off';
        }
      }

      // Memory compaction
      if (agent.memory?.compaction) {
        cfg.agents.defaults.compaction = { mode: agent.memory.compaction };
      }

      // Tools
      if (agent.tools) {
        cfg.tools = cfg.tools || {};
        if (agent.tools.profile) cfg.tools.profile = agent.tools.profile;
        if (agent.tools.allow) cfg.tools.allow = agent.tools.allow;
        if (agent.tools.deny) cfg.tools.deny = agent.tools.deny;
        if (agent.tools.elevated !== undefined) {
          cfg.tools.elevated = { enabled: agent.tools.elevated };
        }
      }

      // Skills
      if (agent.skills) {
        cfg.skills = cfg.skills || {};
        if (agent.skills.bundled) cfg.skills.allowBundled = agent.skills.bundled;
        if (agent.skills.install?.nodeManager) {
          cfg.skills.install = { nodeManager: agent.skills.install.nodeManager };
        }
      }

      // Gateway
      if (agent.gateway) {
        cfg.gateway = cfg.gateway || {};
        if (agent.gateway.port) cfg.gateway.port = agent.gateway.port;
        if (agent.gateway.bind) cfg.gateway.bind = agent.gateway.bind;
        if (agent.gateway.auth) cfg.gateway.auth = { mode: agent.gateway.auth };
        if (agent.gateway.http) {
          cfg.gateway.http = cfg.gateway.http || {};
          cfg.gateway.http.endpoints = cfg.gateway.http.endpoints || {};
          if (agent.gateway.http.chatCompletions !== undefined) {
            cfg.gateway.http.endpoints.chatCompletions = { enabled: agent.gateway.http.chatCompletions };
          }
          if (agent.gateway.http.responses !== undefined) {
            cfg.gateway.http.endpoints.responses = { enabled: agent.gateway.http.responses };
          }
        }
        if (agent.gateway.trustedProxies) cfg.gateway.trustedProxies = agent.gateway.trustedProxies;
      }

      // Hooks
      if (agent.hooks) {
        cfg.hooks = cfg.hooks || {};
        cfg.hooks.internal = cfg.hooks.internal || { enabled: true, entries: {} };
        cfg.hooks.internal.entries = cfg.hooks.internal.entries || {};
        if (agent.hooks.bootMd !== undefined) cfg.hooks.internal.entries['boot-md'] = { enabled: agent.hooks.bootMd };
        if (agent.hooks.commandLogger !== undefined) cfg.hooks.internal.entries['command-logger'] = { enabled: agent.hooks.commandLogger };
        if (agent.hooks.sessionMemory !== undefined) cfg.hooks.internal.entries['session-memory'] = { enabled: agent.hooks.sessionMemory };
      }

      fs.writeFileSync('/data/openclaw.json', JSON.stringify(cfg, null, 2));
      console.log('[entrypoint] openclaw.json generated from agent.yaml');
    "
  fi

  # Apply provisioner overrides as final layer (env vars > agent.yaml > defaults)
  if [ -n "$AGENT_OPENCLAW_OVERRIDES" ]; then
    node -e "
      const fs = require('fs');
      const base = JSON.parse(fs.readFileSync('/data/openclaw.json'));
      const over = JSON.parse(process.env.AGENT_OPENCLAW_OVERRIDES);
      function merge(a, b) {
        for (const k in b) {
          if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) {
            a[k] = merge(a[k] || {}, b[k]);
          } else { a[k] = b[k]; }
        } return a;
      }
      fs.writeFileSync('/data/openclaw.json', JSON.stringify(merge(base, over), null, 2));
      console.log('[entrypoint] Applied AGENT_OPENCLAW_OVERRIDES');
    "
  fi
else
  echo "[entrypoint] Existing openclaw.json found — preserving user config"
fi

# ── 3b. Strip deprecated keys that crash newer OpenClaw versions
if [ -f /data/openclaw.json ]; then
  node -e "
    const fs = require('fs');
    const cfg = JSON.parse(fs.readFileSync('/data/openclaw.json', 'utf8'));
    let changed = false;
    if (cfg.tools?.elevated?.autoApprove !== undefined) {
      delete cfg.tools.elevated.autoApprove;
      changed = true;
    }
    if (changed) {
      fs.writeFileSync('/data/openclaw.json', JSON.stringify(cfg, null, 2));
      console.log('[entrypoint] Stripped deprecated config keys from openclaw.json');
    }
  "
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

node -e "
  const fs = require('fs');
  const profiles = {};
  if (process.env.GEMINI_API_KEY) profiles.google = { type: 'api-key', apiKey: process.env.GEMINI_API_KEY };
  if (process.env.ANTHROPIC_API_KEY) profiles.anthropic = { type: 'api-key', apiKey: process.env.ANTHROPIC_API_KEY };
  if (process.env.OPENAI_API_KEY) profiles.openai = { type: 'api-key', apiKey: process.env.OPENAI_API_KEY };
  if (Object.keys(profiles).length > 0) {
    fs.writeFileSync('$AUTH_FILE', JSON.stringify({ profiles }, null, 2));
    console.log('auth-profiles.json written with providers:', Object.keys(profiles).join(', '));
  } else {
    console.warn('WARNING: No API keys found in env vars — auth-profiles.json not written');
  }
"

# Mark first boot complete
touch /data/.initialized

exec "$@"
