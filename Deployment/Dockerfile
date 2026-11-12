# Production image for the TorusMC website.
# Build context is the project root:  docker compose -f Deployment/compose.yaml build

ARG NODE_VERSION=24-alpine

# ---- Dependencies ----
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
RUN npm install -g pnpm@12.18.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---- Build ----
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
RUN npm install -g pnpm@12.18.0
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ---- Runtime ----
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

# `output: "standalone"` bundles only the files the server needs.
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

USER node
EXPOSE 3000
CMD ["node", "server.js"]
