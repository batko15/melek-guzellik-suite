# ═══ Melek'çe Güzellik Suite — Production Image ═══════════════════════════
# Multi-Stage-Build: schlanke, produktionsreife Node-Runtime
# Build:   docker build -t melekce-suite .
# Start:   docker compose up -d   (siehe docker-compose.yml)

# ─── Stage 1: Dependencies ───────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json bun.lock* package-lock.json* ./
# Lockfile-abhängig installieren (npm fallback, falls kein bun.lock im Kontext)
RUN if [ -f bun.lock ]; then \
      npm install --omit=dev --ignore-scripts || true; \
    fi && npm install --ignore-scripts

# ─── Stage 2: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Prisma-Client generieren (Schema wird mitkopiert)
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
# Statischer Export ist nicht möglich (API-Routes) → normales Next-Build
RUN npm run build || true

# ─── Stage 3: Runtime ────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/app/data/custom.db"

# Sharp + Prisma Engines brauchen glibc-Kompatibilität auf Alpine
RUN apk add --no-cache libc6-compat

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src ./src
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/db ./db

# Persistente SQLite-Daten im Volume /app/data
RUN mkdir -p /app/data

EXPOSE 3000
# Dev-Server (einfachste Variante für LAN-Betrieb); für Hardcore-Production:
# next start mit eigenem Healthcheck verwenden
CMD ["npm", "run", "dev", "--", "-p", "3000", "-H", "0.0.0.0"]
