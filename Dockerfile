# syntax=docker/dockerfile:1

# ---------- deps: устанавливаем зависимости отдельным слоем для кэша ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- builder: генерируем Prisma Client и собираем Next.js ----------
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Этот стейдж используется отдельно (target: builder) сервисом `migrate`
# в docker-compose.yml — у него есть полный node_modules с Prisma CLI,
# нужный для `prisma migrate deploy`, но нет собранного standalone-сервера.

# ---------- runner: минимальный production-образ ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Папка для загруженных из админки фото товаров — в docker-compose.yml сюда
# примонтирован именованный volume, чтобы фото переживали пересборку образа
# (пересборка = новый образ, а volume отдельно от образа не пересоздаётся).
RUN mkdir -p /app/public/uploads/products && chown -R nextjs:nodejs /app/public/uploads

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
