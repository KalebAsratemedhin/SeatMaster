# SeatMaster

Event seating management: create events, invite guests, manage tables and seats, and handle RSVPs—all in one place.

---

## Architecture

SeatMaster is a full-stack app with a **Go API** and a **Next.js** frontend.

```
SeatMaster/
├── client/          # Next.js 16 frontend (React 19, TypeScript)
└── server/          # Go REST API
```

### Backend (server/)

Layered structure with clear boundaries:

| Layer | Location | Role |
|-------|----------|------|
| **Entry** | `cmd/server/` | Wiring, DB, migrations, HTTP server |
| **Domain** | `internal/domain/entities/` | Core entities (User, Event, EventTable, EventSeat, EventInvite) and validation |
| **Application** | `internal/application/usecases/` | Business logic (auth, events, profile) and DTOs |
| **Infrastructure** | `internal/infrastructure/` | HTTP handlers, Gorilla Mux router, PostgreSQL (GORM), JWT, CORS |

API base path: `/api/v1`. Auth is JWT-based; some routes use optional auth so public event and seating data can be read without logging in.

### Frontend (client/)

- **Next.js 16** App Router (`app/`): auth, events (list, create, edit, discover), event detail, RSVP, invitations, profile, settings.
- **State**: Redux Toolkit for global state; Axios for API calls (`lib/api/`).
- **UI**: Tailwind CSS 4, Radix UI, Leaflet for maps.

---

## Tools & Tech Stack

| Area | Technologies |
|------|--------------|
| **Backend** | Go 1.25, Gorilla Mux, GORM, PostgreSQL, JWT (golang-jwt), bcrypt (golang.org/x/crypto), golang-migrate, godotenv |
| **Frontend** | Next.js 16, React 19, TypeScript, Redux Toolkit, Tailwind CSS 4, Radix UI, Leaflet / react-leaflet, Axios |
| **DevOps** | Migrations in `server/migrations/` |

---

## Features

What you can do with SeatMaster:

- **Run events with a real guest list** — Create events (name, type, date, time, location, visibility). Invite guests by email and see who’s coming, who’s pending, and who declined in one place.
- **Get and track RSVPs** — Guests receive invitations and can accept or decline (with optional plus-one). Organizers see response rates and recent RSVPs at a glance.
- **Plan seating before the day** — Define tables and seats per event (round or grid). Guests who accept can pick their seat (or two for plus-one). Organizers can move tables and see the chart fill up.
- **Engage before and after** — Public comments on the event page; private chat between organizer and guest for questions. Event detail shows a map, seating tab, and (for organizers) the full invitation list.
- **Find and promote events** — Public events are discoverable with search and filters (date, type, location). Organizers can share event or RSVP links; event pages work for logged-out visitors where allowed.
- **Manage one identity across events** — Sign up once; use one profile (name, avatar) as organizer or guest. Dashboard summarizes your activity as both: events you run, invitations you’ve received, and RSVP status.

---

## Quick Start

1. **Backend**  
   - Copy `.env` from `server/.env.example` in `server/`. Set `DATABASE_URL` to your Postgres connection string, plus `JWT_SECRET`, `PORT`, and `BASE_URL` as needed.  
   - From `server/`: run migrations (they run on server start, or use `make migrate-up` with the migrate CLI), then start the API (e.g. `go run ./cmd/server` or `make build && ./server`).

2. **Frontend**  
   - In `client/`, set `NEXT_PUBLIC_API_URL` if the API is not at `http://localhost:8080`.  
   - Run `npm install` and `npm run dev`.

3. **Database**  
   - PostgreSQL; the server expects a single connection string in `DATABASE_URL` or `DB_URL` (e.g. `postgres://user:pass@host:port/dbname?sslmode=require`).

---

## License

See repository for license information.
