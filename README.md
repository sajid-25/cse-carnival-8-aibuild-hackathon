# CampusOS — AI Build Hackathon

An intelligent university platform powered by an AI agent that understands and acts on **real-time campus data**. Judges and reviewers can run the entire stack locally in under 5 minutes with no manual seeding step.

---

## ✨ What Is CampusOS?

CampusOS is a two-part application:

1. **Data Dashboard** — Full CRUD management for five campus resources (Schedule, Rooms & Bookings, Events & Registrations, Announcements, Assignments) with live SSE-driven updates across browser tabs.
2. **AI Chat Agent** — A Vercel AI SDK–powered agent with real tool-calling. It reads live data from MySQL on every query and can act (book rooms, register for events) on behalf of the student.

---

## 🚀 Local Setup — Zero Manual Steps

A judge starting from a fresh clone can have a fully working app by following the steps below. **No manual seeding is required** — the database is auto-seeded on first boot.

### Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | ≥ 18 | `node -v` to check |
| npm | ≥ 9 | Bundled with Node |
| Docker + Docker Compose | any recent | For local MySQL (or use your own MySQL 8 instance) |

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/cse-carnival-8-aibuild-hackathon.git
cd cse-carnival-8-aibuild-hackathon
```

---

### Step 2 — Start MySQL

The easiest path is the included Docker Compose file, which spins up a `mysql:8.0` container pre-configured with the correct database name and credentials.

```bash
docker compose up -d
```

This starts `campusos-mysql` on port **3306** with:
- Root password: `password`
- Database name: `campusos`

> **Using your own MySQL?** Make sure a database named `campusos` exists and note your credentials for the next step.

---

### Step 3 — Configure environment variables

```bash
cp .env.example .env
```

Then open `.env` and fill in your values:

```env
# MySQL connection string (Prisma format)
DATABASE_URL="mysql://root:password@localhost:3306/campusos"

# LLM provider — set exactly ONE of these (the agent uses whichever key is present)
OPENAI_API_KEY="sk-..."
# ANTHROPIC_API_KEY="sk-ant-..."
# GOOGLE_GENERATIVE_AI_API_KEY="..."
```

> **Default Docker credentials** — if you used `docker compose up -d` unchanged, the `DATABASE_URL` in `.env.example` works as-is. Just copy and add your LLM key.

---

### Step 4 — Install dependencies & run migrations

```bash
npm install
npx prisma migrate deploy
```

This applies all Prisma migrations to your MySQL instance and creates all 7 tables (`Schedule`, `Room`, `Booking`, `Event`, `Registration`, `Announcement`, `Assignment`).

---

### Step 5 — Start the dev server

```bash
npm run dev
```

On first boot, the app **automatically seeds the database** from the five JSON files in `/data/` if the tables are empty. No manual `npm run db:seed` is required.

Open [http://localhost:3000](http://localhost:3000).

---

### Full quick-start (copy-paste)

```bash
git clone https://github.com/YOUR_USERNAME/cse-carnival-8-aibuild-hackathon.git
cd cse-carnival-8-aibuild-hackathon
docker compose up -d
cp .env.example .env
# → edit .env: add your OPENAI_API_KEY (or other LLM key)
npm install
npx prisma migrate deploy
npm run dev
```

---

## 🌱 Seed Data

Seeding is **automatic on first boot** — when the server starts and the `Schedule` table is empty, it reads the five JSON files in `/data/` and inserts all records (including nested `Booking` and `Registration` rows).

| File | Records | Contents |
|------|---------|---------|
| `data/schedules.json` | 24 | Class timetable — course, day, time, room, instructor |
| `data/rooms.json` | 20 | Rooms 7A01–7A20 with equipment and pre-existing bookings |
| `data/events.json` | 7 | Campus events with registration lists |
| `data/announcements.json` | 8 | Notices with priority levels and expiry dates |
| `data/assignments.json` | 8 | Course assignments with deadlines and submission status |

> To force a re-seed (wipe + reload), run: `npm run db:seed:force`

---

## 🗂️ Project Structure

```
/app
  /api
    /schedule/          ← CRUD + ?day= ?course= filters
    /rooms/             ← CRUD + availability filter + booking sub-routes
    /events/            ← CRUD + register/cancel sub-routes
    /announcements/     ← CRUD + ?active_only= ?priority= filters
    /assignments/       ← CRUD + ?course= ?due_within_days= filters
    /stream/            ← SSE broadcaster (live updates)
    /chat/              ← AI agent endpoint (Vercel AI SDK streamText)
  /(dashboard)
    /schedule/          ← Schedule dashboard page
    /rooms/             ← Rooms + booking UI
    /events/            ← Events + registration UI
    /announcements/     ← Announcements with priority/expiry badges
    /assignments/       ← Assignments sorted by deadline
    /chat/              ← AI chat with streaming + tool-call transparency

/lib
  /db.ts               ← Prisma client singleton
  /notify.ts           ← SSE notifyChange() helper
  /rooms.ts            ← isRoomAvailable(), createBooking() — single source of truth for conflict logic
  /events.ts           ← registerForEvent(), cancelRegistration() — single source of truth for capacity logic
  /validation/         ← Zod schemas for all 5 resources
  /agent/
    /tools/read.ts     ← get_schedule, get_rooms, get_events, get_announcements, get_assignments, get_current_datetime
    /tools/actions.ts  ← book_room, cancel_booking, register_event, cancel_registration
    /system-prompt.ts  ← Agent instructions injected at request time

/components
  /data-table.tsx      ← Generic sortable table (used by all 5 dashboard pages)
  /resource-modal.tsx  ← Generic add/edit form shell driven by field config
  /ui/                 ← shadcn-style primitives (Button, Input, Badge, Dialog, Table…)
  /chat/               ← Message, ToolCallChip, StudentSelector components

/prisma
  /schema.prisma       ← All 7 models
  /seed.ts             ← Auto-seed logic (reads from /data/ JSON files)

/data/                 ← Seed JSON files (read-only source; backend is the database)
/schema/schema.md      ← Canonical field definitions for all 5 resources
/sample_queries/       ← Agent queries used for judging
```

---

## ⚙️ Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | MySQL connection string in Prisma format |
| `OPENAI_API_KEY` | One of these ✅ | OpenAI API key for the chat agent |
| `ANTHROPIC_API_KEY` | One of these ✅ | Anthropic API key for the chat agent |
| `GOOGLE_GENERATIVE_AI_API_KEY` | One of these ✅ | Google Generative AI key |
| `NODE_ENV` | optional | `development` (default) or `production` |

---

## 🧠 How the AI Agent Works

The chat agent at `/app/api/chat/route.ts` uses the **Vercel AI SDK's `streamText`** with tool-calling. It operates under strict guardrails defined in `lib/agent/system-prompt.ts`:

- **Always reads before answering** — every factual query triggers a read tool call against live MySQL (no caching, no memory answers).
- **Asks before acting** — if a booking/registration request is missing required details (time, room, student ID), the agent asks a clarifying question rather than guessing.
- **Honest on failure** — if a room is already booked or an event is full, the agent says so plainly and may offer alternatives.
- **Never fabricates data** — only information returned by tool calls appears in the response.

### Available Tools

**Read tools** (`lib/agent/tools/read.ts`)

| Tool | Description |
|------|-------------|
| `get_schedule` | Class schedule filtered by day/course |
| `get_rooms` | Rooms with real availability check against the booking table |
| `get_events` | Events with registration counts |
| `get_announcements` | Announcements (excludes expired by default; `include_expired` override) |
| `get_assignments` | Assignments filtered by course or due window |
| `get_current_datetime` | Server-authoritative date + day-of-week |

**Action tools** (`lib/agent/tools/actions.ts`)

| Tool | Description |
|------|-------------|
| `book_room` | Reuses `isRoomAvailable()` from `lib/rooms.ts`; emits SSE on success |
| `cancel_booking` | Cancels a booking by ID |
| `register_event` | Reuses `registerForEvent()` from `lib/events.ts`; enforces capacity |
| `cancel_registration` | Cancels a student registration |

---

## 🔄 Live Updates (SSE)

Every dashboard page subscribes to `/api/stream` via `useLiveResource()`. When any mutation succeeds (dashboard or agent), `notifyChange(resource)` broadcasts to all connected clients, which immediately refetch that resource via SWR — **no manual refresh needed**.

This means:
- Booking a room through the AI chat → the room's booking list updates live on the Rooms dashboard
- Editing an announcement in the dashboard → the change is immediately visible in another browser tab

---

## 🛠️ Useful Scripts

```bash
npm run dev              # Start the development server (auto-seeds on first boot)
npm run build            # Build production bundle
npm run lint             # ESLint
npm run format           # Prettier
npm run db:seed          # Manually seed (skips if data exists)
npm run db:seed:force    # Force re-seed (deletes all data and re-inserts)
npx prisma studio        # Open Prisma Studio (visual database browser)
npx prisma migrate dev   # Run migrations in development
npx prisma migrate deploy # Apply migrations in production
```

---

## 📋 API Quick Reference

All routes follow a consistent shape: list filters as query params, `400` with `{ error: string }` on validation failure, `409` with `{ error, conflict }` on business-logic rejection.

| Resource | Base Route | Notable Query Params |
|----------|-----------|---------------------|
| Schedule | `GET /api/schedule` | `?day=Monday`, `?course=CSE101` |
| Rooms | `GET /api/rooms` | `?min_capacity=5`, `?equipment=projector`, `?date=`, `?start_time=`, `?end_time=` |
| Events | `GET /api/events` | — |
| Announcements | `GET /api/announcements` | `?active_only=true`, `?priority=high` |
| Assignments | `GET /api/assignments` | `?course=CSE101`, `?due_within_days=7` |

**Booking & registration sub-routes:**

```
POST   /api/rooms/:id/book                         → book a room (body: { date, start_time, end_time, purpose, booked_by })
DELETE /api/rooms/:id/bookings/:bookingId          → cancel a booking

POST   /api/events/:id/register                    → register a student (body: { student_id, name })
DELETE /api/events/:id/register/:studentId         → cancel a registration
```

---

## 📚 Related Documents

| Document | Purpose |
|----------|---------|
| [`PROBLEM_STATEMENT.md`](./PROBLEM_STATEMENT.md) | Full problem statement and scoring rubric |
| [`schema/schema.md`](./schema/schema.md) | Canonical field definitions for all 5 data models |
| [`sample_queries/sample_queries.md`](./sample_queries/sample_queries.md) | Agent queries used by judges during evaluation |
| [`SUBMISSION.md`](./SUBMISSION.md) | Submission instructions |

---

Good luck. Build something that actually works.
