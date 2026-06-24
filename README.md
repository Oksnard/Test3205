# URL Checker

Асинхронный сервис проверки списка URL: NestJS backend + Vue 3 frontend.

## Быстрый старт (Docker)

```bash
docker compose up --build
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:3000/api

## Локальная разработка

```bash
npm install
npm run dev:backend   # :3000
npm run dev:frontend  # :5173 (proxy /api -> :3000)
```

## Тесты

```bash
npm test              # unit (backend + frontend)
npm run test:e2e      # Playwright (поднимает docker compose)
npm run typecheck
npm run lint
```

## API

### POST /api/jobs
```json
{ "urls": ["https://example.com"] }
```
Ответ: `{ "jobId": "uuid" }`

### GET /api/jobs
Список заданий: `id`, `createdAt`, `status`, `urlCount`, `stats`.

### GET /api/jobs/:id
Детали задания с массивом URL и полями статуса/HTTP/ошибки/таймингов.

### DELETE /api/jobs/:id
Отмена задания; не начатые URL помечаются `cancelled`.

## Архитектура

### Backend
- `JobsModule`: controller + service + in-memory repository
- `UrlCheckerService`: HEAD-запрос, случайная задержка 0–10с, `AbortSignal`
- `p-limit(5)`: не более 5 параллельных HEAD на задание
- Несколько заданий обрабатываются параллельно

### Frontend
- Pinia: `jobsStore` (список), `activeJobStore` (детали + polling)
- Компоненты: `CreateJobForm`, `JobList`, `JobDetails`
- Polling с generation token — ответы по старому `jobId` игнорируются

## Статусы

**Job:** `pending` | `in_progress` | `completed` | `cancelled` | `failed`

**URL:** `pending` | `in_progress` | `success` | `error` | `cancelled`
