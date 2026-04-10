-- Grant full access to user-scoped tables
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO gatekeeper_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON roles TO gatekeeper_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_roles TO gatekeeper_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON refresh_tokens TO gatekeeper_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON casbin_rules TO gatekeeper_app;

-- Enforce append-only on audit_log
GRANT SELECT, INSERT ON audit_log TO gatekeeper_app;
REVOKE UPDATE, DELETE ON audit_log FROM gatekeeper_app;

-- Restrict tenants table to read-only
GRANT SELECT ON tenants TO gatekeeper_app;
REVOKE INSERT, UPDATE, DELETE ON tenants FROM gatekeeper_app;
