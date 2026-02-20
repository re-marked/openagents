# OpenAgents base agent image
# Wraps the official OpenClaw image with marketplace defaults:
#   - Hardened sandbox config
#   - Gateway on port 18789 (LAN only)
#   - Persistent state at /data
#   - Health-check endpoint

FROM ghcr.io/openclaw/openclaw:latest

# ── Persistent volume mount point ────────────────────────────
USER root
RUN mkdir -p /data/workspace /data/memory /data/sessions && \
    chmod -R 777 /data
USER node
VOLUME /data

# ── Default openclaw.json (overridden per-agent at provision) ─
COPY openclaw.json /data/openclaw.json

# ── Default workspace files ───────────────────────────────────
COPY workspace/ /data/workspace/

# ── Environment ───────────────────────────────────────────────
ENV OPENCLAW_STATE_DIR=/data
ENV NODE_OPTIONS="--max-old-space-size=1536"
ENV NODE_ENV=production

EXPOSE 18789

# Run gateway in LAN mode with auth token
# GATEWAY_TOKEN is injected at provision time via Fly secrets
CMD ["gateway", "--allow-unconfigured", "--port", "18789", "--bind", "lan"]
