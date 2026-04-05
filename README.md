# Gatekeeper

Gatekeeper is a multi-tenant RBAC SaaS scaffold that helps teams ship secure tenant-isolated applications faster. It combines strict backend boundaries, database-level tenant isolation, and policy-based permissions so authentication, authorization, and auditability are built in from day one.

## Tech Stack

- Backend: Node.js, Express, TypeScript (strict mode)
- Auth: JWT access tokens + refresh token families (planned in later steps)
- Permissions: Casbin RBAC with PostgreSQL-backed policies (planned in later steps)
- Database: PostgreSQL 16
- Frontend: React 19 + TypeScript (full scaffold in Step 11)
- Infrastructure: Docker and Docker Compose

## Local Setup

```bash
git clone https://github.com/egonzalezcortes/gatekeeper.git
cd gatekeeper
cp .env.example .env
docker compose up
```

## Verify

Backend logs `Server listening on port 3000`. Frontend is reachable at `localhost:5173`.

## Documentation

Start with [docs/APP_FLOW.md](docs/APP_FLOW.md) for the architecture map.

## Planning

Deferred features and follow-up ideas live in [docs/IMPROVEMENTS.md](docs/IMPROVEMENTS.md).
