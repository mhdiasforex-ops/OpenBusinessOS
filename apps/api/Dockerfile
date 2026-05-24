# ============================================================
# OpenBusinessOS — API Dockerfile (multi-stage)
# ============================================================
FROM node:20-alpine AS base
RUN apk add --no-cache python3 make g++ openssl
WORKDIR /app

# --- Dependencies ---
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/
RUN npm install --ignore-scripts

# --- Build ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build workspace packages (TypeScript -> JS)
RUN cd packages/event-definitions && npx tsc
RUN cd packages/shared-types && npx tsc
RUN cd packages/utils && npx tsc

# Fix package.json "main" to point to dist/ instead of src/
RUN for d in packages/*/; do \
  cd /app && node -e " \
    const p='$d'; \
    const fs=require('fs'); \
    const f=p+'package.json'; \
    const j=JSON.parse(fs.readFileSync(f,'utf8')); \
    if(j.main && j.main.includes('./src/')) { \
      j.main=j.main.replace('./src/','./dist/').replace('.ts','.js'); \
      fs.writeFileSync(f,JSON.stringify(j,null,2)+'\n'); \
    }"; \
  done

# Generate Prisma client + build API
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma
RUN cd apps/api && npx nest build

# --- Production ---
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production

# Node modules (production only)
COPY --from=builder /app/node_modules ./node_modules

# Workspace packages (with compiled dist/)
COPY --from=builder /app/packages ./packages

# API dist + prisma
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma

# Package jsons for module resolution
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

EXPOSE 3001
CMD ["sh", "-c", "npx prisma db push --schema prisma/schema.prisma --skip-generate && node dist/main.js"]
