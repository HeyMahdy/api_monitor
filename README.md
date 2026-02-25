# API Monitor

A backend service for monitoring API uptime/health, tracking incidents, and dispatching alerts.

## What this project includes

- Express + TypeScript API server
- Monitor management endpoints
- Incident tracking endpoints
- Alert channel endpoints
- Auth (register/login with JWT)
- Swagger docs UI
- Background workers using BullMQ + Redis for checks/aggregation/flush jobs

## Project structure

- `server/`: main backend code (TypeScript)
- `server/src/app.ts`: API server entrypoint
- `server/src/queues/workers/`: background worker processes
- `api.README.md`: detailed endpoint reference
- `xx/FactoryAi_agent/`: unrelated experiment/prototype assets

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis instance (for BullMQ queues)

## Installation

```bash
npm install
cd server
npm install
```

## Environment variables

Create `server/.env` with at least:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=change-me
NODE_ENV=development
LOG_LEVEL=debug
```

Notes:

- `DATABASE_URL` is required by `server/src/db/db_config.ts`.
- `JWT_SECRET` currently falls back to `super-secret` if unset, but set your own value in real environments.
- Redis credentials are currently hardcoded in `server/src/config/redis.ts`; move them to env vars before production use.

## Run the project

From `server/`:

```bash
npm run dev
```

This starts:

- API server (`src/app.ts`) on `http://localhost:3000`
- Health-check worker
- DB flush worker
- Stats aggregator worker

Production build/start:

```bash
npm run build
npm start
```

## API docs

When running locally:

- Swagger UI: `http://localhost:3000/api-docs`
- Redirect alias: `http://localhost:3000/docs`
- Full written API reference: `api.README.md`

## Main routes

- `POST /auth/register`
- `POST /auth/login`
- `GET/POST/... /api/monitors`
- `GET/POST/... /api/incidents`
- `GET/POST/... /api/v1/alert-channels`
- `GET /profile` (protected)

## Security and cleanup suggestions

- Remove hardcoded Redis host/password from source code.
- Replace default JWT fallback secret.
- Add `.env.example` for easier onboarding.
- Consider updating root `README.md` to point to this file and `api.README.md`.
