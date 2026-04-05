# IMPROVEMENTS.md — Gatekeeper

**Planned enhancements beyond the initial build.**
**Append-only. Never remove entries — mark as Done with date instead.**

---

## Auth

- [ ] Email verification on registration
- [ ] Org admin invite flow — invite by email, token-based accept (the real B2B auth pattern)
- [ ] Password reset flow
- [ ] MFA (TOTP) for admin roles

## Permissions

- [ ] ABAC rules for attribute-based edge cases (e.g., managers can only edit their own reports)
- [ ] Permission delegation — admin grants a manager the ability to invite users

## Infrastructure

- [ ] Redis for refresh token storage (replace PostgreSQL reads at scale)
- [ ] PgBouncer for connection pooling
- [ ] Rate limiting on auth endpoints
- [ ] Uptime monitoring
- [ ] Staging environment with separate DB

## Security

- [ ] Dependency audit scheduled in CI (not just on demand)
- [ ] Secrets rotation policy and tooling
- [ ] SOC 2 readiness checklist

## Features

- [ ] User profile and settings page
- [ ] Org billing and subscription tier (gates features by plan)
- [ ] Export audit log as CSV
- [ ] Schema-per-tenant migration path for enterprise customers requiring contractual isolation
