-- Termly Database Schema
-- AI-Powered Loan Covenant Monitoring Platform

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
CREATE TYPE covenant_type AS ENUM (
  'leverage',
  'interest_coverage',
  'fixed_charge_coverage',
  'current_ratio',
  'min_net_worth',
  'custom'
);

CREATE TYPE covenant_operator AS ENUM ('max', 'min');

CREATE TYPE compliance_status AS ENUM ('compliant', 'warning', 'breach', 'pending');

CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');

CREATE TYPE document_type AS ENUM (
  'credit_agreement',
  'compliance_certificate',
  'financial_statement',
  'amendment',
  'other'
);

CREATE TYPE extraction_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'needs_review'
);

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Users table (synced with Clerk)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  role VARCHAR(50) DEFAULT 'analyst',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Borrowers table
CREATE TABLE borrowers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  rating VARCHAR(20),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Loans table
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  borrower_id UUID NOT NULL REFERENCES borrowers(id),
  name VARCHAR(255) NOT NULL,
  facility_type VARCHAR(100) NOT NULL,
  commitment_amount DECIMAL(18, 2) NOT NULL,
  outstanding_amount DECIMAL(18, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  origination_date DATE NOT NULL,
  maturity_date DATE NOT NULL,
  interest_rate DECIMAL(5, 4),
  interest_rate_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  loan_id UUID NOT NULL REFERENCES loans(id),
  type document_type NOT NULL,
  name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  extraction_status extraction_status DEFAULT 'pending',
  extracted_data JSONB,
  confidence_scores JSONB,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Covenants table
CREATE TABLE covenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES loans(id),
  name VARCHAR(255) NOT NULL,
  type covenant_type NOT NULL,
  operator covenant_operator NOT NULL,
  threshold DECIMAL(10, 4) NOT NULL,
  threshold_step_downs JSONB, -- Array of {date, threshold} for step-downs
  ebitda_definition TEXT,
  ebitda_addbacks JSONB, -- Array of addback items with descriptions
  testing_frequency VARCHAR(50) DEFAULT 'quarterly',
  grace_period_days INTEGER DEFAULT 0,
  source_document_id UUID REFERENCES documents(id),
  source_clause TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Financial periods table
CREATE TABLE financial_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES loans(id),
  period_end_date DATE NOT NULL,
  period_type VARCHAR(20) NOT NULL, -- 'quarterly', 'annual', 'monthly'
  revenue DECIMAL(18, 2),
  ebitda_reported DECIMAL(18, 2),
  ebitda_adjusted DECIMAL(18, 2),
  total_debt DECIMAL(18, 2),
  interest_expense DECIMAL(18, 2),
  fixed_charges DECIMAL(18, 2),
  current_assets DECIMAL(18, 2),
  current_liabilities DECIMAL(18, 2),
  net_worth DECIMAL(18, 2),
  addbacks_applied JSONB, -- Details of addbacks applied
  source_document_id UUID REFERENCES documents(id),
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(loan_id, period_end_date, period_type)
);

-- Covenant tests table
CREATE TABLE covenant_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  covenant_id UUID NOT NULL REFERENCES covenants(id),
  financial_period_id UUID NOT NULL REFERENCES financial_periods(id),
  calculated_value DECIMAL(10, 4) NOT NULL,
  threshold_at_test DECIMAL(10, 4) NOT NULL,
  status compliance_status NOT NULL,
  headroom_absolute DECIMAL(18, 2),
  headroom_percentage DECIMAL(5, 2),
  calculation_details JSONB,
  notes TEXT,
  tested_by UUID REFERENCES users(id),
  tested_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(covenant_id, financial_period_id)
);

-- Alerts table
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  loan_id UUID NOT NULL REFERENCES loans(id),
  covenant_id UUID REFERENCES covenants(id),
  covenant_test_id UUID REFERENCES covenant_tests(id),
  severity alert_severity NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memos table
CREATE TABLE memos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  loan_id UUID NOT NULL REFERENCES loans(id),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  generated_by_ai BOOLEAN DEFAULT FALSE,
  ai_prompt TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_borrowers_organization ON borrowers(organization_id);
CREATE INDEX idx_loans_organization ON loans(organization_id);
CREATE INDEX idx_loans_borrower ON loans(borrower_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_documents_loan ON documents(loan_id);
CREATE INDEX idx_documents_extraction_status ON documents(extraction_status);
CREATE INDEX idx_covenants_loan ON covenants(loan_id);
CREATE INDEX idx_financial_periods_loan ON financial_periods(loan_id);
CREATE INDEX idx_financial_periods_date ON financial_periods(period_end_date);
CREATE INDEX idx_covenant_tests_covenant ON covenant_tests(covenant_id);
CREATE INDEX idx_covenant_tests_period ON covenant_tests(financial_period_id);
CREATE INDEX idx_covenant_tests_status ON covenant_tests(status);
CREATE INDEX idx_alerts_organization ON alerts(organization_id);
CREATE INDEX idx_alerts_loan ON alerts(loan_id);
CREATE INDEX idx_alerts_acknowledged ON alerts(acknowledged);
CREATE INDEX idx_audit_logs_organization ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_borrowers_updated_at BEFORE UPDATE ON borrowers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_covenants_updated_at BEFORE UPDATE ON covenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_periods_updated_at BEFORE UPDATE ON financial_periods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_covenant_tests_updated_at BEFORE UPDATE ON covenant_tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memos_updated_at BEFORE UPDATE ON memos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security policies (basic - expand as needed)
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

-- Storage bucket for documents (run via Supabase dashboard or API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
