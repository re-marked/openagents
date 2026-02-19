FROM node:22-alpine AS base
RUN npm install -g pnpm@10

# Build stage
FROM base AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY apps/sse-gateway/package.json ./apps/sse-gateway/
COPY packages/config/package.json ./packages/config/
RUN pnpm install --frozen-lockfile

COPY apps/sse-gateway/ ./apps/sse-gateway/
COPY packages/config/ ./packages/config/

WORKDIR /app/apps/sse-gateway
RUN pnpm build

# Runtime stage
FROM node:22-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 gateway

COPY --from=builder --chown=gateway:nodejs /app/apps/sse-gateway/dist ./dist
COPY --from=builder --chown=gateway:nodejs /app/apps/sse-gateway/package.json ./

RUN npm install --omit=dev --ignore-scripts

USER gateway

EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
