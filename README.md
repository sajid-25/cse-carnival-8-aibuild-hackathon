# CampusOS — AI Build Hackathon

An intelligent university platform powered by an AI agent that understands and acts on real-time campus data.

## Local Setup

### Requirements

- Node.js 20 or newer
- MySQL 8.0 or newer

### Install and configure

```bash
npm install
```

Create `.env` from `.env.example` and set `DATABASE_URL` to the credentials for your local MySQL server. The database name should be `campusos`.

Apply the Prisma schema and load the supplied campus records:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Start the application:

```bash
npm run dev
```

The API is served by the same Next.js process. Check the database connection at `/api/health`, or query a resource such as `/api/rooms`.

To reset the local data and reseed it:

```bash
npm run db:seed:force
```

Never commit `.env` or real database credentials.

---

## The Challenge

Students struggle daily with scattered campus information — class changes buried in group chats, deadlines forgotten until the last minute, no easy way to know what's happening on campus right now.

Your job: build **CampusOS** — a two-part app with a data dashboard and an AI agent that always reads live data.

Read the full problem statement → [`PROBLEM_STATEMENT.md`](./PROBLEM_STATEMENT.md)

---

## Repository Structure

```
campusos-hackathon/
│
├── README.md                    ← You are here
├── PROBLEM_STATEMENT.md         ← Full problem statement + scoring
├── SUBMISSION.md                ← How and where to submit
│
├── data/                        ← Seed data (load these into your backend)
│   ├── schedules.json
│   ├── rooms.json
│   ├── events.json
│   ├── announcements.json
│   └── assignments.json
│
├── schema/
│   └── schema.md                ← Field names, types, and constraints for all 5 systems
│
└── sample_queries/
    └── sample_queries.md        ← Queries we will use when judging your agent
```

---

## How to Participate

### 1. Fork the repository

Click **Fork** in the top-right corner of this repo's GitHub page. This creates your own copy under your GitHub account, where you'll build your solution.

### 2. Clone your fork

```bash
git clone https://github.com/YOUR_USERNAME/campusos-hackathon.git
cd campusos-hackathon
```

### 3. Build your solution inside your fork

> Your solution lives in your fork — do not open a pull request to this repo.

### 4. Making your fork private

By default, a fork is public. If you want to keep your work hidden from other participants while you build:

1. Go to your fork on GitHub
2. Open **Settings** (top of the repo page)
3. Scroll to the **Danger Zone** at the bottom
4. Click **Change repository visibility** → **Make private**
5. Confirm by typing the repository name

> **You may keep your fork private during the hackathon period, but it must be switched back to public by 8:30 PM on the submission deadline.** Repositories still private after that time will not be judged. To make it public again, repeat the steps above and choose **Make public** instead.

### 5. Submit

Submit your fork's public URL via the instructions in [`SUBMISSION.md`](./SUBMISSION.md).

---

## Quick Links

| Resource | Link |
|----------|------|
| Full problem statement | [`PROBLEM_STATEMENT.md`](./PROBLEM_STATEMENT.md) |
| Data schema | [`schema/schema.md`](./schema/schema.md) |
| Sample agent queries | [`sample_queries/sample_queries.md`](./sample_queries/sample_queries.md) |
| Submission guide | [`SUBMISSION.md`](./SUBMISSION.md) |

---

## Seed Data Overview

| File | Records | What It Contains |
|------|---------|-----------------|
| `schedules.json` | 24 | Class timetable — course, day, time, room, instructor |
| `rooms.json` | 20 | Rooms 7A01–7A07, 7B01–7B08, 7C01–7C05 with equipment and bookings |
| `events.json` | 7 | Campus events with registration lists |
| `announcements.json` | 8 | Notices with priority levels and expiry dates |
| `assignments.json` | 8 | Course assignments with deadlines and submission status |

> **Important:** These JSON files are only the starting/seed data — not the database itself. Load them into a real backend (a database, or at minimum a backend service with persistent storage) on app startup. Your dashboard and AI agent must both read from and write to that backend, not the static JSON files directly. If you add, edit, or delete a record, the change must be saved in your backend and still be there after a reload — the JSON files in this repo will not update. The agent is also expected to always query the current backend state, not a cached or hardcoded copy of the seed data.

---

Good luck. Build something that actually works.
