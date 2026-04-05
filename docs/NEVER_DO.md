# NEVER_DO.md — Gatekeeper

**Append-only. Never remove or modify existing entries.**
**Last updated:** April 2026

---

- Never write inline permission checks. All access control goes through `enforcer.enforce()` in the authorize middleware.
- Never store JWT tokens in localStorage or sessionStorage. Access tokens live in memory (AuthContext state) only. Refresh tokens live in httpOnly cookies only.
- Never write a database query against a tenant-scoped table without tenant_id scoping in the WHERE clause. Use `withTenant()` — never raw pool access for tenant data.
- Never construct SQL strings by concatenating user input. Parameterized queries only, always.
- Never trust tenant_id or role from the JWT payload. Always resolve from the database using the userId from the token.
- Never return stack traces, error objects, or internal system details in API responses. Return a safe error message only.
- Never commit secrets, API keys, or .env files. Environment variables only. .env is in .gitignore.
- Never make architectural decisions silently. If a task requires choosing between two valid approaches, stop and surface both options before proceeding.
- Never apply RLS to the `tenants` table or the `casbin_rules` table — these are global tables with no tenant_id column.
- Never run migrations as a PostgreSQL superuser — RLS does not apply to superusers and tests would pass incorrectly.
- Never update or delete audit_log rows. The audit log is append-only by design.
- Never cache the user's role in the JWT or in the session — always resolve from the DB on each request so role changes take effect immediately.
- Never proxy S3 uploads through the backend. The frontend uploads directly to S3 using the pre-signed URL. The backend only generates the URL.
- Never issue a new refresh token without revoking the old one in the same transaction.
- Never proceed past the Step 0 verification signal before starting Step 1. Each step's verification must pass before the next step begins.
