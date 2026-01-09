export const APP_NAME = 'Termly';
export const APP_DESCRIPTION = 'AI-powered loan covenant monitoring platform';

export const COVENANT_CATEGORIES = [
  { value: 'leverage', label: 'Leverage' },
  { value: 'coverage', label: 'Coverage' },
  { value: 'liquidity', label: 'Liquidity' },
  { value: 'capex', label: 'Capital Expenditure' },
] as const;

export const COVENANT_TYPES = [
  { value: 'debt_to_ebitda', label: 'Debt to EBITDA', category: 'leverage' },
  { value: 'senior_debt_to_ebitda', label: 'Senior Debt to EBITDA', category: 'leverage' },
  { value: 'net_debt_to_ebitda', label: 'Net Debt to EBITDA', category: 'leverage' },
  { value: 'interest_coverage', label: 'Interest Coverage', category: 'coverage' },
  { value: 'fixed_charge_coverage', label: 'Fixed Charge Coverage', category: 'coverage' },
  { value: 'debt_service_coverage', label: 'Debt Service Coverage', category: 'coverage' },
  { value: 'current_ratio', label: 'Current Ratio', category: 'liquidity' },
  { value: 'quick_ratio', label: 'Quick Ratio', category: 'liquidity' },
  { value: 'minimum_liquidity', label: 'Minimum Liquidity', category: 'liquidity' },
  { value: 'capex_limit', label: 'CapEx Limit', category: 'capex' },
] as const;

export const LOAN_STATUS = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'watchlist', label: 'Watchlist', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'default', label: 'Default', color: 'bg-red-100 text-red-800' },
  { value: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-800' },
] as const;

export const COVENANT_STATUS = [
  { value: 'compliant', label: 'Compliant', color: 'bg-green-100 text-green-800' },
  { value: 'warning', label: 'Warning', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'breach', label: 'Breach', color: 'bg-red-100 text-red-800' },
  { value: 'waived', label: 'Waived', color: 'bg-purple-100 text-purple-800' },
  { value: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-800' },
] as const;

export const DOCUMENT_TYPES = [
  { value: 'credit_agreement', label: 'Credit Agreement' },
  { value: 'amendment', label: 'Amendment' },
  { value: 'financial_statement', label: 'Financial Statement' },
  { value: 'compliance_certificate', label: 'Compliance Certificate' },
  { value: 'other', label: 'Other' },
] as const;

export const ALERT_SEVERITY = [
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-800' },
] as const;

export const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-blue-100 text-blue-800',
};

export const STATUS_COLORS: Record<string, string> = {
  compliant: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  breach: 'bg-red-100 text-red-800',
  waived: 'bg-purple-100 text-purple-800',
  pending: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  watchlist: 'bg-yellow-100 text-yellow-800',
  default: 'bg-red-100 text-red-800',
  closed: 'bg-gray-100 text-gray-800',
};

export const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Financial Services',
  'Manufacturing',
  'Retail',
  'Energy',
  'Real Estate',
  'Transportation',
  'Telecommunications',
  'Consumer Goods',
  'Other',
] as const;

export const TEST_FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi_annual', label: 'Semi-Annual' },
  { value: 'annual', label: 'Annual' },
] as const;
