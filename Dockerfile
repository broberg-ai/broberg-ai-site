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
COPY --from=build /app /app
EXPOSE 3000
CMD ["bun", "run", "start"]
