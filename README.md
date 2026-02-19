# SeatMaster

Event seating management: create events, invite guests, manage tables and seats, and handle RSVPs—all in one place.

---

## Architecture

SeatMaster is a full-stack app with a **Go API** and a **Next.js** frontend.

```
SeatMaster/
├── client/          # Next.js 16 frontend (React 19, TypeScript)
├── server/          # Go REST API
└── stitch-seatmaster/   # Design / Stitch UI assets
```

### Backend (server/)

Layered structure with clear boundaries:

| Layer | Location | Role |
|-------|----------|------|
| **Entry** | `cmd/server/` | Wiring, DB, migrations, HTTP server |
| **Domain** | `internal/domain/entities/` | Core entities (User, Event, EventTable, EventSeat, EventInvite) and validation |
| **Application** | `internal/application/usecases/` | Business logic (auth, events, profile) and DTOs |
| **Infrastructure** | `internal/infrastructure/` | HTTP handlers, Gorilla Mux router, PostgreSQL (GORM), JWT, file uploads, CORS |

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
| **DevOps** | Migrations in `server/migrations/`; uploads under `server/uploads/` (banners, avatars) |

---

## Features

- **Auth** — Register, login, JWT-protected routes, optional auth for public content.
- **Profile** — View and update profile; avatar upload.
- **Events** — Create, list, get, update, delete; public/private visibility; location and map (lat/lng); event type, date, start/end time; banner upload.
- **Discover** — List public events.
- **Invitations** — Invite users to events; list event invites; list “my invitations”; RSVP (accept/decline).
- **Seating** — Event tables (create, update, delete); seats per table; seating order for events.
- **Uploads** — Banner images for events; avatar images for users (served under `/uploads/`).

---

## Quick Start

1. **Backend**  
   - Copy `.env` (e.g. from a template) in `server/` with DB URL, JWT secret, `PORT`, `UPLOAD_DIR`, `BASE_URL`.  
   - From `server/`: run migrations, then start the API (e.g. `go run ./cmd/server` or use the Makefile).

2. **Frontend**  
   - In `client/`, set `NEXT_PUBLIC_API_URL` if the API is not at `http://localhost:8080`.  
   - Run `npm install` and `npm run dev`.

3. **Database**  
   - PostgreSQL; connection string and migration usage are configured in `server/` (see `database` package and `cmd/server/main.go`).

---

## License

See repository for license information.
