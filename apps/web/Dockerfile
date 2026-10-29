# Web app image. It holds only the build output: build first (on Linux, as CI
# does), then use the standalone folder as the build context:
#   pnpm turbo run build --filter=@formcanvas/web
#   docker build -f apps/web/Dockerfile -t formcanvas-web apps/web/.next/standalone
# The folder already has public/, .next/static and drizzle/ (scripts/standalone.mjs).
FROM node:24.13.0-bookworm-slim
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --chown=node:node . .
# never run as root
USER node
EXPOSE 3000
# /api/health answers 200 only when the database is reachable and migrated
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/web/server.js"]
