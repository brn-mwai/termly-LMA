-- Row Level Security (RLS) Policies for Termly
-- Enforces organization-based data isolation at the database level
-- Note: Service role key bypasses RLS, so API routes using admin client are unaffected

-- ============================================================================
-- HELPER FUNCTION: Get current user's organization ID from JWT
-- ============================================================================
CREATE OR REPLACE FUNCTION auth.organization_id()
RETURNS uuid AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'organization_id')::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS uuid AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'sub')::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$ LANGUAGE sql STABLE;

-- ============================================================================
-- ORGANIZATIONS TABLE
-- ============================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Users can only view their own organization
CREATE POLICY "organizations_select_own" ON organizations
  FOR SELECT USING (id = auth.organization_id());

-- Only admins can update organization (handled in API, but defense-in-depth)
CREATE POLICY "organizations_update_own" ON organizations
  FOR UPDATE USING (id = auth.organization_id());

-- ============================================================================
-- USERS TABLE
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can see other users in their organization
CREATE POLICY "users_select_org" ON users
  FOR SELECT USING (organization_id = auth.organization_id() AND deleted_at IS NULL);

-- Users can update their own profile
CREATE POLICY "users_update_self" ON users
  FOR UPDATE USING (id = auth.user_id());

-- Admins can insert users (invitations) - handled by service role in API

-- ============================================================================
-- BORROWERS TABLE
-- ============================================================================
ALTER TABLE borrowers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "borrowers_select_org" ON borrowers
  FOR SELECT USING (organization_id = auth.organization_id() AND deleted_at IS NULL);

CREATE POLICY "borrowers_insert_org" ON borrowers
  FOR INSERT WITH CHECK (organization_id = auth.organization_id());

CREATE POLICY "borrowers_update_org" ON borrowers
  FOR UPDATE USING (organization_id = auth.organization_id());

CREATE POLICY "borrowers_delete_org" ON borrowers
  FOR DELETE USING (organization_id = auth.organization_id());

-- ============================================================================
-- LOANS TABLE
-- ============================================================================
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "loans_select_org" ON loans
  FOR SELECT USING (organization_id = auth.organization_id() AND deleted_at IS NULL);

CREATE POLICY "loans_insert_org" ON loans
  FOR INSERT WITH CHECK (organization_id = auth.organization_id());

CREATE POLICY "loans_update_org" ON loans
  FOR UPDATE USING (organization_id = auth.organization_id());

CREATE POLICY "loans_delete_org" ON loans
  FOR DELETE USING (organization_id = auth.organization_id());

-- ============================================================================
-- DOCUMENTS TABLE
-- ============================================================================
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_select_org" ON documents
  FOR SELECT USING (organization_id = auth.organization_id() AND deleted_at IS NULL);

CREATE POLICY "documents_insert_org" ON documents
  FOR INSERT WITH CHECK (organization_id = auth.organization_id());

CREATE POLICY "documents_update_org" ON documents
  FOR UPDATE USING (organization_id = auth.organization_id());

CREATE POLICY "documents_delete_org" ON documents
  FOR DELETE USING (organization_id = auth.organization_id());

-- ============================================================================
-- COVENANTS TABLE (linked via loan_id, org check through join)
-- ============================================================================
ALTER TABLE covenants ENABLE ROW LEVEL SECURITY;

-- Covenants are accessed through loans, verify org via loan
CREATE POLICY "covenants_select_via_loan" ON covenants
  FOR SELECT USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = covenants.loan_id
      AND loans.organization_id = auth.organization_id()
    )
  );

CREATE POLICY "covenants_insert_via_loan" ON covenants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = covenants.loan_id
      AND loans.organization_id = auth.organization_id()
    )
  );

CREATE POLICY "covenants_update_via_loan" ON covenants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = covenants.loan_id
      AND loans.organization_id = auth.organization_id()
    )
  );

CREATE POLICY "covenants_delete_via_loan" ON covenants
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = covenants.loan_id
      AND loans.organization_id = auth.organization_id()
    )
  );

-- ============================================================================
-- FINANCIAL_PERIODS TABLE (linked via loan_id)
-- ============================================================================
ALTER TABLE financial_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "financial_periods_select_via_loan" ON financial_periods
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = financial_periods.loan_id
      AND loans.organization_id = auth.organization_id()
    )
  );

CREATE POLICY "financial_periods_insert_via_loan" ON financial_periods
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = financial_periods.loan_id
      AND loans.organization_id = auth.organization_id()
    )
  );

CREATE POLICY "financial_periods_update_via_loan" ON financial_periods
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = financial_periods.loan_id
      AND loans.organization_id = auth.organization_id()
    )
  );

-- ============================================================================
-- COVENANT_TESTS TABLE (linked via covenant -> loan)
-- ============================================================================
ALTER TABLE covenant_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "covenant_tests_select_via_covenant" ON covenant_tests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM covenants
      JOIN loans ON loans.id = covenants.loan_id
      WHERE covenants.id = covenant_tests.covenant_id
      AND loans.organization_id = auth.organization_id()
    )
  );

CREATE POLICY "covenant_tests_insert_via_covenant" ON covenant_tests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM covenants
      JOIN loans ON loans.id = covenants.loan_id
      WHERE covenants.id = covenant_tests.covenant_id
      AND loans.organization_id = auth.organization_id()
    )
  );

CREATE POLICY "covenant_tests_update_via_covenant" ON covenant_tests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM covenants
      JOIN loans ON loans.id = covenants.loan_id
      WHERE covenants.id = covenant_tests.covenant_id
      AND loans.organization_id = auth.organization_id()
    )
  );

-- ============================================================================
-- ALERTS TABLE
-- ============================================================================
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alerts_select_org" ON alerts
  FOR SELECT USING (organization_id = auth.organization_id());

CREATE POLICY "alerts_insert_org" ON alerts
  FOR INSERT WITH CHECK (organization_id = auth.organization_id());

CREATE POLICY "alerts_update_org" ON alerts
  FOR UPDATE USING (organization_id = auth.organization_id());

-- ============================================================================
-- MEMOS TABLE
-- ============================================================================
ALTER TABLE memos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memos_select_org" ON memos
  FOR SELECT USING (organization_id = auth.organization_id() AND deleted_at IS NULL);

CREATE POLICY "memos_insert_org" ON memos
  FOR INSERT WITH CHECK (organization_id = auth.organization_id());

CREATE POLICY "memos_update_org" ON memos
  FOR UPDATE USING (organization_id = auth.organization_id());

CREATE POLICY "memos_delete_org" ON memos
  FOR DELETE USING (organization_id = auth.organization_id());

-- ============================================================================
-- AUDIT_LOGS TABLE (read-only for users, write via service role)
-- ============================================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view audit logs for their organization
CREATE POLICY "audit_logs_select_org" ON audit_logs
  FOR SELECT USING (organization_id = auth.organization_id());

-- Insert is done via service role key (bypasses RLS)
-- No insert policy for regular users - audit logs are system-generated

-- ============================================================================
-- STORAGE POLICIES (for document files)
-- ============================================================================
-- Note: Storage policies are configured separately in Supabase dashboard
-- or via storage.objects policies. This is a reference implementation.

-- Documents bucket policy (if using Supabase storage)
-- Users can only access files in their organization's folder
-- File path format: {organization_id}/{loan_id}/{filename}

-- Example storage policy (run in Supabase dashboard):
-- CREATE POLICY "documents_storage_select" ON storage.objects
--   FOR SELECT USING (
--     bucket_id = 'documents' AND
--     (storage.foldername(name))[1] = auth.organization_id()::text
--   );

-- ============================================================================
-- INDEXES FOR RLS PERFORMANCE
-- ============================================================================
-- These indexes help RLS policies execute efficiently

CREATE INDEX IF NOT EXISTS idx_loans_org_id ON loans(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_org_id ON documents(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_borrowers_org_id ON borrowers(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_alerts_org_id ON alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_memos_org_id ON memos(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_covenants_loan_id ON covenants(loan_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_financial_periods_loan_id ON financial_periods(loan_id);
CREATE INDEX IF NOT EXISTS idx_covenant_tests_covenant_id ON covenant_tests(covenant_id);
