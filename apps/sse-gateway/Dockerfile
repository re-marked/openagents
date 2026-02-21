FROM node:22-alpine AS base

# Build stage
FROM base AS builder
WORKDIR /app

# Install only the packages needed for build (skip workspace: deps)
RUN npm install hono @hono/node-server typescript @types/node

COPY tsconfig.build.json ./
COPY src/ ./src/
RUN npx tsc --project tsconfig.build.json

# Runtime stage
FROM node:22-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 gateway

COPY --from=builder --chown=gateway:nodejs /app/dist ./dist

# Install only production deps
RUN npm install hono @hono/node-server

USER gateway

EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
