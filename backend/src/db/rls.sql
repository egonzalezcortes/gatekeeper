-- Row-Level Security Policies
-- Applied after migrations. Enforces tenant isolation at the DB layer.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_tenant_isolation ON users
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY roles_tenant_isolation ON roles
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_roles_tenant_isolation ON user_roles
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY refresh_tokens_tenant_isolation ON refresh_tokens
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_log_tenant_isolation ON audit_log
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
