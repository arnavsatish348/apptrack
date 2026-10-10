# AppTrack

A full-stack job application tracker. Log every application, move it through stages (saved → applied → interview → offer), and see your response and interview rates update as you go. Every status change is saved, so each application keeps a full timeline.

![AppTrack screenshot (sample data)](docs/screenshot.png)

## Tech stack

| Layer | Tools |
|---|---|
| Front end | React 18, TypeScript, Vite |
| Back end | Node.js, Express, REST API, Zod validation |
| Database | PostgreSQL (raw parameterized SQL, indexes, foreign keys, check constraints) |
| Testing | Jest + Supertest, running the real schema against in-memory Postgres (pg-mem) |
| DevOps | Docker, Docker Compose, GitHub Actions CI |

## Features

- Create, update, filter, search, and delete applications
- Status history: every change is written to a `status_history` table
- Live stats: totals by stage, response rate, and interview rate (applications you only saved are left out of the rates)
- Input validation with field-level error messages
- Status colors so interviews and rejections stand out at a glance

## REST API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/applications` | List applications. Query params: `status`, `track`, `q` (search), `sort`, `order` |
| `GET` | `/api/applications/stats` | Counts by status, response rate, interview rate |
| `GET` | `/api/applications/:id` | One application with its status history |
| `POST` | `/api/applications` | Create an application |
| `PATCH` | `/api/applications/:id` | Update fields; status changes are logged |
| `DELETE` | `/api/applications/:id` | Delete an application and its history |

Example:

```bash
curl -X POST http://localhost:4000/api/applications \
  -H "Content-Type: application/json" \
  -d '{"company":"Northwind Health","role":"Junior Full Stack Developer","track":"full-stack"}'
```

## Run it

**With Docker (recommended):**

```bash
docker compose up --build
# open http://localhost:8080
```

**Without Docker** (needs a local PostgreSQL):

```bash
# API
cd server
npm install
DATABASE_URL=postgres://user:pass@localhost:5432/apptrack npm start

# Front end (in a second terminal)
cd client
npm install
npm run dev
# open http://localhost:5173
```

**Tests:**

```bash
cd server && npm test
```

## How it works

- **Database design:** `server/db/schema.sql` defines `applications` and `status_history` with a foreign key (`ON DELETE CASCADE`), a check constraint on valid statuses, and indexes on the columns used for filtering. The server runs the schema on startup.
- **API:** Express routes in `server/src/routes/applications.js` use parameterized queries (no string-built SQL from user input) and build filters dynamically. Zod validates request bodies before they reach the database.
- **Testing without a database server:** tests load the same `schema.sql` into pg-mem, an in-memory Postgres, so CI needs no database container and every test starts from a clean state.
- **Front end:** typed API client (`client/src/api.ts`), shared types for the data model, and small components for stats, the add form, and the table. Vite proxies `/api` to Express in development, and nginx does the same in the Docker build.

## Project structure

```
server/
  db/schema.sql            Tables, constraints, indexes
  src/app.js               Express app setup and error handling
  src/routes/              REST endpoints
  src/validation.js        Zod schemas
  test/                    API tests (Jest + Supertest + pg-mem)
client/
  src/api.ts               Typed API client
  src/components/          StatsBar, ApplicationForm, ApplicationTable
docker-compose.yml         Postgres + API + front end
.github/workflows/ci.yml   Tests and build on every push
```

## Possible next steps

- User accounts with authentication
- Reminders to follow up on applications with no response after two weeks
- Charts of applications per week
