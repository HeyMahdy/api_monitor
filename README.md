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

## Current features

- User authentication with `POST /auth/register` and `POST /auth/login` (JWT + cookie support)
- Protected monitor APIs: create, list, read, update, delete, and monitor controls (`start`, `pause`, `resume`)
- Scheduled health checks using BullMQ job schedulers with retry/backoff behavior
- Async health-result persistence pipeline using Redis Streams + DB flush worker
- Incident lifecycle APIs: create, list open incidents, get by id, acknowledge, resolve, delete
- Alert channel management (CRUD + test endpoint)
- Webhook notifications for incident created, acknowledged, and resolved events
- Stats aggregation worker for active monitors on a recurring schedule
- Swagger/OpenAPI docs at `/api-docs` and `/docs`
- Development utility route: `POST /api/dev/clear-db` (non-production only)

## Sequence diagram

```mermaid
sequenceDiagram
    autonumber
    participant U as User/Client
    participant T as Monitored API
    participant API as Express API
    participant DB as PostgreSQL
    participant Q as BullMQ + Redis
    participant HW as Health Worker
    participant RS as Redis Stream
    participant DW as DB Flush Worker
    participant IW as Incident Service
    participant AS as Alert Service
    participant WH as Webhook Endpoint
    participant SW as Stats Worker
    
    U->>API: POST /auth/login
    API->>DB: Validate user credentials
    API-->>U: JWT token (+ cookie)

    U->>API: POST /api/monitors
    API->>DB: Insert monitor
    API-->>U: Monitor created

    U->>API: POST /api/monitors/start/:id
    API->>DB: Set monitor active
    API->>Q: upsert monitor scheduler
    API->>Q: schedule stats aggregation
    API-->>U: Started

    loop Every check_interval
        Q->>HW: Run monitor job
        HW->>T: HTTP check to target URL
        alt Check success
            HW->>RS: add health result (UP)
            HW->>IW: resolve open incident (if exists)
        else Check fails after retries
            HW->>RS: add health result (DOWN)
            HW->>IW: create/increment OPEN incident
            IW->>AS: incident event
            AS->>WH: send webhook notification
            HW->>DB: set monitor inactive
        end
    end

    DW->>RS: read pending health results
    DW->>DB: persist check results/history

    Q->>SW: recurring stats-aggregation job
    SW->>DB: calculate and store monitor stats
```

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
