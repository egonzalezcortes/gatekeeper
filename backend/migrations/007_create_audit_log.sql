-- Migration 007: audit_log table for tenant-scoped append-only audit history
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_log_tenant_id ON audit_log(tenant_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- Append-only enforcement: audit_log accepts INSERT and SELECT only.
-- UPDATE and DELETE will be revoked on the app database role in Step 2
-- when the connection layer creates gatekeeper_app.
