# syntax=docker/dockerfile:1
# Production image for user-service (ECS Fargate).
# Default CMD starts the API only — migrations are NOT run on container start.
#
# One-off migration task (same image, command override):
#   npx prisma migrate deploy --schema apps/user-service/prisma/schema.prisma
# ECS example: set container command override to the above; provide DATABASE_URL via task env/secrets.

FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json nest-cli.json tsconfig.json tsconfig.build.json ./
COPY apps/user-service ./apps/user-service
COPY libs/common ./libs/common
RUN npm run prisma:generate && npm run build:user-service

FROM node:24-bookworm-slim AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:24-bookworm-slim AS runner
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
COPY --chown=node:node package.json ./

EXPOSE 3001

CMD ["node", "dist/apps/user-service/main.js"]
