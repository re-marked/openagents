#!/bin/sh
# Copy default config into the volume if missing
if [ ! -f /data/openclaw.json ]; then
  cp /opt/openclaw-defaults/openclaw.json /data/openclaw.json
fi

# Ensure workspace directory exists
mkdir -p /data/workspace /data/memory /data/sessions

# Copy default workspace files if workspace is empty
if [ -z "$(ls -A /data/workspace 2>/dev/null)" ]; then
  cp -r /opt/openclaw-defaults/workspace/* /data/workspace/ 2>/dev/null || true
fi

exec "$@"
