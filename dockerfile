# syntax=docker/dockerfile:1.5

FROM node:20-slim AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ---- deps ----
FROM base AS deps
COPY pnpm-lock.yaml package.json ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ---- build ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# IMPORTANT: génère Prisma Client AVANT le build SvelteKit
RUN pnpm exec prisma generate
RUN pnpm run build

# ---- runtime ----
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080

# on copie le serveur SvelteKit compilé
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./package.json

# on copie les dépendances + Prisma Client généré
COPY --from=build /app/node_modules ./node_modules

EXPOSE 8080
CMD ["node", "build"]
