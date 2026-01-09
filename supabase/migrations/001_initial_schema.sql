-- Termly Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
CREATE TYPE covenant_type AS ENUM ('leverage', 'interest_coverage', 'fixed_charge_coverage', 'current_ratio', 'min_net_worth', 'custom');
CREATE TYPE covenant_operator AS ENUM ('max', 'min');
CREATE TYPE compliance_status AS ENUM ('compliant', 'warning', 'breach', 'pending');
CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');
CREATE TYPE document_type AS ENUM ('credit_agreement', 'compliance_certificate', 'financial_statement', 'amendment', 'other');
CREATE TYPE extraction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'needs_review');

-- 1. Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 2. Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  role TEXT DEFAULT 'analyst',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 3. Borrowers table
CREATE TABLE borrowers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  industry TEXT,
  rating TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 4. Loans table
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  borrower_id UUID NOT NULL REFERENCES borrowers(id),
  name TEXT NOT NULL,
  facility_type TEXT NOT NULL,
  commitment_amount DECIMAL(15,2) NOT NULL,
  outstanding_amount DECIMAL(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  origination_date DATE NOT NULL,
  maturity_date DATE NOT NULL,
  interest_rate DECIMAL(5,4),
  interest_rate_type TEXT,
  status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 5. Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  loan_id UUID NOT NULL REFERENCES loans(id),
  type document_type NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  extraction_status extraction_status DEFAULT 'pending',
  extracted_data JSONB,
  confidence_scores JSONB,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 6. Covenants table
CREATE TABLE covenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES loans(id),
  name TEXT NOT NULL,
  type covenant_type NOT NULL,
  operator covenant_operator NOT NULL,
  threshold DECIMAL(15,4) NOT NULL,
  threshold_step_downs JSONB,
  ebitda_definition TEXT,
  ebitda_addbacks JSONB,
  testing_frequency TEXT DEFAULT 'quarterly',
  grace_period_days INTEGER DEFAULT 0,
  source_document_id UUID REFERENCES documents(id),
  source_clause TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 7. Financial periods table
CREATE TABLE financial_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES loans(id),
  period_end_date DATE NOT NULL,
  period_type TEXT NOT NULL,
  revenue DECIMAL(15,2),
  ebitda_reported DECIMAL(15,2),
  ebitda_adjusted DECIMAL(15,2),
  total_debt DECIMAL(15,2),
  interest_expense DECIMAL(15,2),
  fixed_charges DECIMAL(15,2),
  current_assets DECIMAL(15,2),
  current_liabilities DECIMAL(15,2),
  net_worth DECIMAL(15,2),
  addbacks_applied JSONB,
  source_document_id UUID REFERENCES documents(id),
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(loan_id, period_end_date, period_type)
);

-- 8. Covenant tests table
CREATE TABLE covenant_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  covenant_id UUID NOT NULL REFERENCES covenants(id),
  financial_period_id UUID NOT NULL REFERENCES financial_periods(id),
  calculated_value DECIMAL(15,4) NOT NULL,
  threshold_at_test DECIMAL(15,4) NOT NULL,
  status compliance_status NOT NULL,
  headroom_absolute DECIMAL(15,4),
  headroom_percentage DECIMAL(8,4),
  calculation_details JSONB,
  notes TEXT,
  tested_by UUID REFERENCES users(id),
  tested_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(covenant_id, financial_period_id)
);

-- 9. Alerts table
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  loan_id UUID NOT NULL REFERENCES loans(id),
  covenant_id UUID REFERENCES covenants(id),
  covenant_test_id UUID REFERENCES covenant_tests(id),
  severity alert_severity NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Memos table
CREATE TABLE memos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  loan_id UUID NOT NULL REFERENCES loans(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  generated_by_ai BOOLEAN DEFAULT FALSE,
  ai_prompt TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 11. Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_borrowers_org ON borrowers(organization_id);
CREATE INDEX idx_loans_org ON loans(organization_id);
CREATE INDEX idx_loans_borrower ON loans(borrower_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_documents_loan ON documents(loan_id);
CREATE INDEX idx_documents_org ON documents(organization_id);
CREATE INDEX idx_covenants_loan ON covenants(loan_id);
CREATE INDEX idx_financial_periods_loan ON financial_periods(loan_id);
CREATE INDEX idx_covenant_tests_covenant ON covenant_tests(covenant_id);
CREATE INDEX idx_covenant_tests_period ON covenant_tests(financial_period_id);
CREATE INDEX idx_alerts_org ON alerts(organization_id);
CREATE INDEX idx_alerts_loan ON alerts(loan_id);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_memos_loan ON memos(loan_id);
CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_borrowers_updated_at BEFORE UPDATE ON borrowers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_covenants_updated_at BEFORE UPDATE ON covenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_financial_periods_updated_at BEFORE UPDATE ON financial_periods FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_covenant_tests_updated_at BEFORE UPDATE ON covenant_tests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_memos_updated_at BEFORE UPDATE ON memos FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security (RLS)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE covenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE covenant_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (using service role for now, can be tightened later)
CREATE POLICY "Service role full access" ON organizations FOR ALL USING (true);
CREATE POLICY "Service role full access" ON users FOR ALL USING (true);
CREATE POLICY "Service role full access" ON borrowers FOR ALL USING (true);
CREATE POLICY "Service role full access" ON loans FOR ALL USING (true);
CREATE POLICY "Service role full access" ON documents FOR ALL USING (true);
CREATE POLICY "Service role full access" ON covenants FOR ALL USING (true);
CREATE POLICY "Service role full access" ON financial_periods FOR ALL USING (true);
CREATE POLICY "Service role full access" ON covenant_tests FOR ALL USING (true);
CREATE POLICY "Service role full access" ON alerts FOR ALL USING (true);
CREATE POLICY "Service role full access" ON memos FOR ALL USING (true);
CREATE POLICY "Service role full access" ON audit_logs FOR ALL USING (true);

-- Storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Safe query execution function for chat
CREATE OR REPLACE FUNCTION execute_safe_query(query_text TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Only allow SELECT statements
  IF NOT (LOWER(TRIM(query_text)) LIKE 'select%') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  -- Execute and return results
  EXECUTE 'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (' || query_text || ') t'
  INTO result;

  RETURN result;
END;
$$;
