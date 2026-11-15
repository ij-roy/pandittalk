# syntax=docker/dockerfile:1
# Production image for both Nest services; data services remain managed outside Docker.
# Compose runs migrations before starting user-service; the image itself remains
# reusable for a one-off migration task or another process command.

FROM node:24-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json nest-cli.json tsconfig.json tsconfig.build.json ./
COPY apps/user-service ./apps/user-service
COPY apps/pandit-service ./apps/pandit-service
COPY libs/common ./libs/common
RUN npm run prisma:generate && npm run build

FROM base AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV USER_SERVICE_PORT=3001

RUN mkdir -p uploads/avatars && chown -R node:node /app

USER node

COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=node:node --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --chown=node:node --from=build /app/node_modules/prisma ./node_modules/prisma
COPY --chown=node:node apps/user-service/prisma ./apps/user-service/prisma
COPY --chown=node:node scripts/ensure-local-demo-data.cjs ./scripts/ensure-local-demo-data.cjs
COPY --chown=node:node package.json ./

EXPOSE 3001

CMD ["node", "dist/apps/user-service/main.js"]
