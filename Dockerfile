# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

WORKDIR /app

# Установка необходимых пакетов для bcrypt
RUN apk add --no-cache python3 make g++

# Копируем package files
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN npm ci

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем зависимости из предыдущего stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./

# Копируем исходный код
COPY . .

# Генерируем Prisma Client
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

# Собираем TypeScript
RUN npm run build

# ============================================
# Stage 3: Runner (Production)
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# Создаём пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Копируем необходимые файлы
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.js ./

# Меняем владельца
RUN chown -R appuser:nodejs /app

USER appuser

# Переменные окружения по умолчанию
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Запуск приложения
CMD ["node", "dist/index.js"]
