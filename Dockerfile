# broberg.ai — Stack B (Bun). Build the client assets, then run the Hono SSR
# server. Content is seeded from cms at boot (backfill) onto the mounted volume.
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install
COPY . .
RUN bun run build:client

FROM oven/bun:1 AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Hvilken commit ER dette image? /healthz svarer med den, saa Gate A kan vente
# paa at den NYE udgave faktisk er live i stedet for at sove et gaet. Uden det
# maalte porten den forrige udgave og meldte groent (31/8-2026).
ARG GIT_SHA=""
ENV GIT_SHA=$GIT_SHA
COPY --from=build /app /app
EXPOSE 3000
CMD ["bun", "run", "start"]
