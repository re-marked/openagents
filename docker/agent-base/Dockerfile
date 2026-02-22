# OpenAgents base agent image
# Wraps the official OpenClaw image with marketplace defaults:
#   - Hardened sandbox config
#   - Gateway on port 18789 (LAN only)
#   - Persistent state at /data
#   - Health-check endpoint

FROM ghcr.io/openclaw/openclaw:latest

# ── Store defaults outside the volume mount point ────────────
# /data is a volume — anything COPY'd there gets overwritten at runtime.
# We store defaults in /opt and seed /data at boot via entrypoint.
USER root
RUN mkdir -p /opt/openclaw-defaults/workspace /data && \
    chmod -R 777 /data

COPY openclaw.json /opt/openclaw-defaults/openclaw.json
COPY workspace/ /opt/openclaw-defaults/workspace/

# Entrypoint: always overwrite config + system dirs, seed user files once
RUN printf '#!/bin/sh\ncp /opt/openclaw-defaults/openclaw.json /data/openclaw.json\nmkdir -p /data/workspace /data/memory /data/sessions\nif [ -z "$(ls -A /data/workspace 2>/dev/null)" ]; then\n  cp -r /opt/openclaw-defaults/workspace/. /data/workspace/ 2>/dev/null || true\nfi\ncp -r /opt/openclaw-defaults/workspace/tools /data/workspace/ 2>/dev/null || true\ncp -r /opt/openclaw-defaults/workspace/skills /data/workspace/ 2>/dev/null || true\nexec "$@"\n' > /opt/entrypoint.sh && \
    chmod +x /opt/entrypoint.sh

USER node
VOLUME /data

# ── Environment ───────────────────────────────────────────────
ENV OPENCLAW_STATE_DIR=/data
ENV NODE_OPTIONS="--max-old-space-size=1536"
ENV NODE_ENV=production

EXPOSE 18789

ENTRYPOINT ["/opt/entrypoint.sh"]
CMD ["node", "dist/index.js", "gateway", "--allow-unconfigured", "--port", "18789", "--bind", "lan"]
