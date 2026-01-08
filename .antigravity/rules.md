# Project Rules: Patient Assistant System

## Технический стек (СТРОГО)
- Runtime: Node.js 20+
- Язык: TypeScript (strict mode)
- Backend Framework: Fastify
- ORM: Prisma
- База данных: PostgreSQL
- Очереди: BullMQ + Redis
- Валидация: Zod
- Логирование: Pino
- Тесты: Vitest

## Структура проекта
/src
  /modules - бизнес-модули (patients, periods, alerts и т.д.)
  /common - общие утилиты, middleware, ошибки
  /integrations - внешние сервисы (whatsapp, amocrm, ai)
  /config - конфигурация
  /jobs - фоновые задачи
  index.ts - точка входа

## Правила кода
- Каждый модуль в отдельной папке со структурой:
  - module.controller.ts
  - module.service.ts
  - module.router.ts
  - module.schema.ts (Zod)
  - module.types.ts
- Все ошибки через класс AppError
- API версионирование: /api/v1/
- Формат ответа: { success: boolean, data?: T, error?: string, meta?: object }
- Комментарии на русском языке
- README.md для каждого модуля

## База данных
- Все таблицы с полями: id mod, createdAt, updatedAt
- Мягкое удаление через поле deletedAt
- Индексы на часто используемые поля
- Связи через foreign keys

## Безопасность
- Пароли хешировать через bcrypt
- JWT для аутентификации
- Rate limiting на API
- Валидация всех входных данных
- Санитизация перед сохранением в БД

## Git
- Conventional commits: feat:, fix:, docs:, refactor:
- .gitignore включает: node_modules, .env, dist, logs