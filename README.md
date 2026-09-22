# Job Tracker

A job application tracker API. Register an account, then log, update, and track the status of job applications (saved → applied → phone screen → interview → offer/rejected/withdrawn) through their lifecycle.

Currently backend-only; a frontend is planned.

## Tech stack

- **Express 5** + **TypeScript** (strict mode)
- **PostgreSQL** via **Drizzle ORM**, schema-first migrations
- **JWT** auth in an httpOnly session cookie, passwords hashed with **bcrypt**
- **Zod** request validation
- **Vitest** + **Supertest** for integration tests, run against a dockerized, disposable test database
- **Docker Compose** for local Postgres (dev + test instances)

## API

| Method | Route                    | Auth | Description                      |
|--------|---------------------------|------|-----------------------------------|
| POST   | `/api/auth/register`      | –    | Create an account, start a session |
| POST   | `/api/auth/login`         | –    | Start a session                   |
| POST   | `/api/auth/logout`        | –    | Clear the session                 |
| GET    | `/api/auth/me`            | ✓    | Current user                      |
| GET    | `/api/applications`       | ✓    | List your applications            |
| GET    | `/api/applications/:id`   | ✓    | Get one application                |
| POST   | `/api/applications`       | ✓    | Create an application              |
| PATCH  | `/api/applications/:id`   | ✓    | Update an application              |
| DELETE | `/api/applications/:id`   | ✓    | Delete an application              |

Every applications route is scoped to the authenticated user — requesting another user's application id returns a 404, not a 403, to avoid leaking existence.

## Getting started

Requires Node.js and Docker.

```bash
# start a local Postgres instance
docker compose up -d db

# install dependencies and configure environment
cd server
npm install
cp .env.example .env   # fill in JWT_SECRET, etc.

# apply the database schema
npx drizzle-kit migrate

# run the API
npx tsx watch src/index.ts
```

The server listens on `http://localhost:4000` by default (`PORT` in `.env`).

## Testing

```bash
# start the disposable test database (separate from dev, tmpfs-backed)
docker compose up -d db-test

cd server
cp .env.test.example .env.test
npm test
```

Tests run against the real Express app (`src/app.ts`) and a real Postgres instance via Supertest — no mocking of the database layer. Each test run applies migrations and truncates tables between tests for isolation.

## Project structure

```
server/
  src/
    app.ts          # Express app (middleware, routes, error handler)
    index.ts         # process entry point — loads env, starts listening
    routes/          # route → controller wiring
    controllers/      # request handling, validation, DB access
    middleware/        # requireAuth, centralized errorHandler
    db/               # Drizzle schema and client
    utils/             # JWT, AppError, Zod schemas, asyncHandler
  drizzle/            # generated SQL migrations
  tests/              # Vitest + Supertest integration tests
```
