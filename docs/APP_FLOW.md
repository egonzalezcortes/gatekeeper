# APP_FLOW.md — Gatekeeper

**Last updated:** April 2026
**Status:** Pre-scaffold (Step 0 not yet run — update after Step 0 completes)

---

## Project Overview

Gatekeeper is a multi-tenant SaaS starter with fine-grained role-based access control. Organizations (tenants) are fully isolated via shared schema + PostgreSQL Row-Level Security. Within each tenant, users are assigned roles (admin, manager, viewer) whose permissions are enforced by Casbin.

Repo: https://github.com/egonzalezcortes/gatekeeper
Visibility: public

---

## Monorepo Structure

```
/
├── backend/                 — Node.js/Express/TypeScript API
├── frontend/                — React 19/TypeScript SPA
├── docs/                    — Project documentation (this folder)
├── docker-compose.yml       — Full stack local environment
├── .env.example             — Required environment variables
└── .gitignore
```

---

## Backend

### Entry Point

```
backend/src/index.ts         — Server bootstrap, middleware registration, route mounting
```

### Directory Map

```
backend/src/
├── index.ts                 — App entry point
├── db/
│   ├── client.ts            — pg Pool, withTenant() transaction helper, RLS context setter
│   └── rls.sql              — RLS policy definitions (applied once at DB setup)
├── migrations/              — Numbered SQL migration files (001_, 002_, etc.)
├── middleware/
│   ├── authenticate.ts      — JWT verification, resolves userId/tenantId/role from DB
│   ├── authorize.ts         — Casbin enforcer.enforce() factory middleware
│   └── types.ts             — Express Request type extension (req.user shape)
├── permissions/
│   ├── model.conf           — Casbin RBAC model definition
│   ├── enforcer.ts          — Enforcer initialization and export (singleton)
│   └── policies.ts          — Default policy seed function (called on tenant creation)
├── routes/
│   ├── auth.ts              — POST /api/auth/register, /login, /refresh, /logout
│   ├── tenants.ts           — GET/PUT /api/tenants/me
│   ├── users.ts             — GET /api/users, GET /api/users/:id, PUT /api/users/:id/role
│   ├── uploads.ts           — POST /api/uploads/sign
│   └── audit.ts             — GET /api/audit
├── services/
│   └── auditLog.ts          — writeAudit(), queryAudit() — all audit writes go here
└── types/                   — Shared TypeScript types
```

### API Routes

| Method | Path                | Auth   | Role  | Description                   |
| ------ | ------------------- | ------ | ----- | ----------------------------- |
| POST   | /api/auth/register  | None   | —     | Create tenant + admin user    |
| POST   | /api/auth/login     | None   | —     | Issue access + refresh tokens |
| POST   | /api/auth/refresh   | Cookie | —     | Rotate refresh token          |
| POST   | /api/auth/logout    | JWT    | —     | Revoke refresh token          |
| GET    | /api/tenants/me     | JWT    | any   | Get own org                   |
| PUT    | /api/tenants/me     | JWT    | admin | Update org name               |
| GET    | /api/users          | JWT    | admin | List all users in tenant      |
| GET    | /api/users/:id      | JWT    | admin | Get single user               |
| PUT    | /api/users/:id/role | JWT    | admin | Assign role                   |
| POST   | /api/uploads/sign   | JWT    | any   | Get pre-signed S3 upload URL  |
| GET    | /api/audit          | JWT    | admin | Paginated audit log           |

### Middleware Execution Order

```
Request → authenticate → authorize(resource, action) → route handler
```

---

## Database Schema

### Tables

| Table          | Purpose                                    | RLS |
| -------------- | ------------------------------------------ | --- |
| tenants        | Organization records                       | No  |
| users          | User accounts, scoped to tenant            | Yes |
| roles          | Named roles per tenant                     | Yes |
| user_roles     | User-to-role assignments                   | Yes |
| casbin_rules   | Casbin policy storage                      | No  |
| refresh_tokens | Hashed refresh tokens with family tracking | Yes |
| audit_log      | Append-only action history                 | Yes |

### Tenant Isolation Pattern

Every query against a tenant-scoped table uses `withTenant(tenantId, client => ...)`.
`withTenant` sets `SET LOCAL app.current_tenant_id = $1` before any query in the transaction.
RLS policies enforce `tenant_id = current_setting('app.current_tenant_id')::uuid` at the DB layer.

### Key Relationships

```
tenants
  └── users (tenant_id FK)
        └── user_roles (user_id FK)
              └── roles (role_id FK, tenant_id FK)
  └── refresh_tokens (tenant_id FK)
  └── audit_log (tenant_id FK)
casbin_rules (global — no tenant_id)
```

---

## Permissions System

**Engine:** Casbin, RBAC model
**Policy storage:** `casbin_rules` table in PostgreSQL
**Enforcer:** Singleton initialized at app startup in `permissions/enforcer.ts`

### Default Policies (seeded per tenant on creation)

```
admin   → users,   manage
admin   → roles,   manage
admin   → audit,   read
manager → reports, read
manager → reports, write
viewer  → reports, read
```

### Enforce Call Pattern

```typescript
// In authorize middleware:
const allowed = await enforcer.enforce(req.user.role, resource, action)
if (!allowed) {
  await writeAudit({ action: 'authz.denied', ... })
  return res.status(403).json({ error: 'Forbidden' })
}
```

---

## Authentication Flow

### Login

1. Validate credentials → resolve tenantId and role from DB (never from request)
2. Issue access token (15m, contains userId + tenantId only)
3. Issue refresh token (7d, raw token in httpOnly cookie, hash stored in DB with familyId)

### Refresh

1. Read raw refresh token from cookie
2. Hash it, look up in refresh_tokens
3. If revoked → family reuse detected → revoke entire family → 401
4. If valid → mark old token revoked → issue new access token + new refresh token (same familyId)

### Logout

1. Revoke current refresh token (set revoked = true)
2. Clear the cookie

---

## Frontend

### Directory Map

```
frontend/src/
├── main.tsx                 — App entry, QueryClient + Router providers
├── App.tsx                  — Route definitions
├── api/
│   └── client.ts            — Axios instance, base URL, 401 interceptor (auto-refresh)
├── lib/
│   └── queryClient.ts       — TanStack QueryClient config (staleTime: 30s)
├── context/
│   └── AuthContext.tsx       — Auth state: user, accessToken, login(), logout()
├── hooks/
│   ├── useAuth.ts
│   ├── useUsers.ts
│   ├── useRoleAssignment.ts
│   ├── useAuditLog.ts
│   └── useSignedUpload.ts
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   ├── UsersPage.tsx        — Admin only
│   ├── FilesPage.tsx
│   └── AuditLogPage.tsx    — Admin only
└── components/
    ├── ProtectedRoute.tsx   — Redirects to /login if unauthenticated
    ├── RoleGuard.tsx        — Renders 403 UI if role not in allowed list
    └── Layout/
        ├── AppLayout.tsx
        └── Sidebar.tsx      — Links filtered by role
```

### Token Storage

- Access token: module-level variable in AuthContext (never localStorage)
- Refresh token: httpOnly cookie (set by backend, inaccessible to JS)
- On page refresh: silent refresh attempt via POST /api/auth/refresh before rendering protected routes

### Sidebar Links by Role

```
admin:   Dashboard, Users, Audit Log, Files
manager: Dashboard, Files
viewer:  Dashboard
```

---

## Infrastructure

### Docker Compose Services

```
postgres   — PostgreSQL 16, named volume, health check
backend    — depends_on postgres (health check condition), migrations run on startup
frontend   — depends_on backend
```

### Environment Variables (.env.example)

```
DATABASE_URL
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
AWS_BUCKET
AWS_REGION
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
PORT
```

### CI (GitHub Actions)

```
backend-ci:  lint → type-check → test (against real PostgreSQL)
frontend-ci: lint → type-check → build
```

Triggers: push, pull_request to main.

---

## Deploy Command

```
[TBD — define after hosting decision. Document here before first deploy.]
```

---

## Implementation Progress

| Step | Description                             | Status      |
| ---- | --------------------------------------- | ----------- |
| 0    | Project scaffold and Docker environment | Not Started |
| 1    | PostgreSQL schema                       | Not Started |
| 2    | DB connection layer and RLS             | Not Started |
| 3    | Auth routes (register, login, logout)   | Not Started |
| 4    | Refresh token rotation                  | Not Started |
| 5    | Casbin setup                            | Not Started |
| 6    | Auth middleware and route protection    | Not Started |
| 7    | Tenant management routes                | Not Started |
| 8    | User management routes                  | Not Started |
| 9    | S3 signed URL route                     | Not Started |
| 10   | Audit log service                       | Not Started |
| 11   | React 19 frontend scaffold              | Not Started |
| 12   | Auth UI                                 | Not Started |
| 13   | Role-aware routing and layout           | Not Started |
| 14   | Admin dashboard                         | Not Started |
| 15   | File upload UI                          | Not Started |
| 16   | Audit log UI                            | Not Started |
| 17   | Docker Compose full stack               | Not Started |
| 18   | GitHub Actions CI                       | Not Started |
| 19   | Seed script                             | Not Started |
| 20   | README                                  | Not Started |
