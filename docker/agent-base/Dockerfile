# OpenAgents base agent image
# Wraps the official OpenClaw image with marketplace defaults:
#   - Gateway on port 18789 (LAN-bound for Fly proxy)
#   - Persistent state at /data (volume mount)
#   - Config seeded from /opt/openclaw-defaults on first boot

FROM ghcr.io/openclaw/openclaw:latest

# ── Store defaults outside the volume mount point ───────────
USER root
RUN mkdir -p /opt/openclaw-defaults/workspace /data

COPY openclaw.json /opt/openclaw-defaults/openclaw.json
COPY workspace/ /opt/openclaw-defaults/workspace/

# Create entrypoint inline to avoid Windows line-ending issues
# Always overwrite config from image defaults (config is baked into image, not user-editable)
RUN printf '#!/bin/sh\ncp /opt/openclaw-defaults/openclaw.json /data/openclaw.json\nmkdir -p /data/workspace /data/memory /data/sessions\nif [ -z "$(ls -A /data/workspace 2>/dev/null)" ]; then\n  cp -r /opt/openclaw-defaults/workspace/* /data/workspace/ 2>/dev/null || true\nfi\nexec "$@"\n' > /opt/openclaw-defaults/entrypoint.sh && \
    chmod +x /opt/openclaw-defaults/entrypoint.sh && \
    chmod -R 777 /data

USER node

VOLUME /data

# ── Environment ───────────────────────────────────────────────
ENV OPENCLAW_STATE_DIR=/data
ENV NODE_OPTIONS="--max-old-space-size=1536"
ENV NODE_ENV=production

EXPOSE 18789

ENTRYPOINT ["/opt/openclaw-defaults/entrypoint.sh"]
CMD ["node", "dist/index.js", "gateway", "--bind", "lan", "--port", "18789", "--allow-unconfigured"]
