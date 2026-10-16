FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json bun.lock bunfig.toml ./

RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=8080

EXPOSE 8080

CMD ["bun", "run", ".output/server/index.mjs"]
