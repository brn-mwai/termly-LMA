import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api';
import { v4 as uuidv4 } from 'uuid';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    const supabase = createAdminClient();

    // Get user's org_id
    const { data: userData } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('clerk_id', userId)
      .is('deleted_at', null)
      .single();

    if (!userData?.organization_id) return errorResponse('NOT_FOUND', 'User not found', 404);
    const orgId = userData.organization_id;
    const dbUserId = userData.id;

    console.log('Seeding demo data for organization:', orgId);

    // Check if demo data already exists
    const { data: existingLoans } = await supabase
      .from('loans')
      .select('id')
      .eq('organization_id', orgId)
      .limit(1);

    if (existingLoans && existingLoans.length > 0) {
      return errorResponse('CONFLICT', 'Demo data already exists. Delete existing loans first.', 409);
    }

    // Create Borrowers
    const borrowers = [
      {
        id: uuidv4(),
        organization_id: orgId,
        name: 'TechFlow Solutions Inc.',
        industry: 'Technology',
        rating: 'BBB+',
      },
      {
        id: uuidv4(),
        organization_id: orgId,
        name: 'Midwest Manufacturing Co.',
        industry: 'Manufacturing',
        rating: 'BB+',
      },
      {
        id: uuidv4(),
        organization_id: orgId,
        name: 'Harbor Retail Group, LLC',
        industry: 'Retail',
        rating: 'B',
      },
      {
        id: uuidv4(),
        organization_id: orgId,
        name: 'Sunrise Healthcare Systems, Inc.',
        industry: 'Healthcare',
        rating: 'BBB',
      }
    ];

    const { error: borrowerError } = await supabase.from('borrowers').insert(borrowers as never[]);
    if (borrowerError) throw borrowerError;

    // Create Loans
    const loans = [
      {
        id: uuidv4(),
        organization_id: orgId,
        borrower_id: borrowers[0].id,
        name: 'Revolving Credit Facility',
        facility_type: 'Revolving Credit',
        commitment_amount: 25000000,
        outstanding_amount: 18500000,
        currency: 'USD',
        origination_date: '2024-01-15',
        maturity_date: '2029-01-15',
        interest_rate: 7.5,
        interest_rate_type: 'SOFR + 2.50%',
        status: 'active'
      },
      {
        id: uuidv4(),
        organization_id: orgId,
        borrower_id: borrowers[1].id,
        name: 'Term Loan Facility',
        facility_type: 'Term Loan',
        commitment_amount: 50000000,
        outstanding_amount: 42500000,
        currency: 'USD',
        origination_date: '2023-03-01',
        maturity_date: '2028-03-01',
        interest_rate: 8.25,
        interest_rate_type: 'SOFR + 3.25%',
        status: 'active'
      },
      {
        id: uuidv4(),
        organization_id: orgId,
        borrower_id: borrowers[2].id,
        name: 'Senior Secured Credit Facility',
        facility_type: 'Senior Secured',
        commitment_amount: 35000000,
        outstanding_amount: 28700000,
        currency: 'USD',
        origination_date: '2022-06-15',
        maturity_date: '2027-06-15',
        interest_rate: 9.0,
        interest_rate_type: 'SOFR + 4.00%',
        status: 'active'
      },
      {
        id: uuidv4(),
        organization_id: orgId,
        borrower_id: borrowers[3].id,
        name: 'Term Loan Facility',
        facility_type: 'Term Loan',
        commitment_amount: 40000000,
        outstanding_amount: 36250000,
        currency: 'USD',
        origination_date: '2024-04-01',
        maturity_date: '2031-04-01',
        interest_rate: 7.75,
        interest_rate_type: 'SOFR + 2.75%',
        status: 'active'
      }
    ];

    const { error: loanError } = await supabase.from('loans').insert(loans as never[]);
    if (loanError) throw loanError;

    // Create Covenants
    const covenants = [
      // TechFlow Covenants
      { id: uuidv4(), loan_id: loans[0].id, name: 'Maximum Leverage Ratio', type: 'leverage', operator: 'max', threshold: 4.0, testing_frequency: 'quarterly', grace_period_days: 30 },
      { id: uuidv4(), loan_id: loans[0].id, name: 'Minimum Interest Coverage Ratio', type: 'interest_coverage', operator: 'min', threshold: 2.5, testing_frequency: 'quarterly', grace_period_days: 30 },
      // Midwest Covenants
      { id: uuidv4(), loan_id: loans[1].id, name: 'Maximum Leverage Ratio', type: 'leverage', operator: 'max', threshold: 5.0, testing_frequency: 'quarterly', grace_period_days: 30 },
      { id: uuidv4(), loan_id: loans[1].id, name: 'Minimum Interest Coverage Ratio', type: 'interest_coverage', operator: 'min', threshold: 2.0, testing_frequency: 'quarterly', grace_period_days: 30 },
      { id: uuidv4(), loan_id: loans[1].id, name: 'Minimum Current Ratio', type: 'current_ratio', operator: 'min', threshold: 1.25, testing_frequency: 'quarterly', grace_period_days: 30 },
      // Harbor Covenants
      { id: uuidv4(), loan_id: loans[2].id, name: 'Maximum Leverage Ratio', type: 'leverage', operator: 'max', threshold: 4.5, testing_frequency: 'quarterly', grace_period_days: 30 },
      { id: uuidv4(), loan_id: loans[2].id, name: 'Minimum Interest Coverage Ratio', type: 'interest_coverage', operator: 'min', threshold: 2.0, testing_frequency: 'quarterly', grace_period_days: 30 },
      { id: uuidv4(), loan_id: loans[2].id, name: 'Minimum Fixed Charge Coverage Ratio', type: 'fixed_charge_coverage', operator: 'min', threshold: 1.1, testing_frequency: 'quarterly', grace_period_days: 30 },
      // Sunrise Covenants
      { id: uuidv4(), loan_id: loans[3].id, name: 'Maximum Leverage Ratio', type: 'leverage', operator: 'max', threshold: 4.0, testing_frequency: 'quarterly', grace_period_days: 30 },
      { id: uuidv4(), loan_id: loans[3].id, name: 'Minimum DSCR', type: 'fixed_charge_coverage', operator: 'min', threshold: 1.25, testing_frequency: 'quarterly', grace_period_days: 30 },
      { id: uuidv4(), loan_id: loans[3].id, name: 'Minimum Current Ratio', type: 'current_ratio', operator: 'min', threshold: 1.5, testing_frequency: 'quarterly', grace_period_days: 30 }
    ];

    const { error: covenantError } = await supabase.from('covenants').insert(covenants as never[]);
    if (covenantError) throw covenantError;

    // Create Financial Periods
    const periods = [
      { id: uuidv4(), loan_id: loans[0].id, period_end_date: '2025-09-30', period_type: 'quarterly', revenue: 42500000, ebitda_reported: 12450000, total_debt: 28500000, interest_expense: 2137500, current_assets: 18500000, current_liabilities: 7200000, verified: true },
      { id: uuidv4(), loan_id: loans[1].id, period_end_date: '2025-09-30', period_type: 'quarterly', revenue: 62600000, ebitda_reported: 13000000, total_debt: 62400000, interest_expense: 4368000, current_assets: 24500000, current_liabilities: 17850000, verified: true },
      { id: uuidv4(), loan_id: loans[2].id, period_end_date: '2025-09-30', period_type: 'quarterly', revenue: 62600000, ebitda_reported: 7150000, total_debt: 31200000, interest_expense: 3972000, fixed_charges: 6472000, current_assets: 8500000, current_liabilities: 9200000, verified: true },
      { id: uuidv4(), loan_id: loans[3].id, period_end_date: '2025-09-30', period_type: 'quarterly', revenue: 58000000, ebitda_reported: 14850000, total_debt: 36250000, interest_expense: 2537500, fixed_charges: 6537500, current_assets: 18200000, current_liabilities: 8750000, verified: true }
    ];

    const { error: periodError } = await supabase.from('financial_periods').insert(periods as never[]);
    if (periodError) throw periodError;

    // Create Covenant Tests
    const covenantTests = [
      // TechFlow - Compliant
      { id: uuidv4(), covenant_id: covenants[0].id, financial_period_id: periods[0].id, calculated_value: 2.29, threshold_at_test: 4.0, status: 'compliant', headroom_percentage: 42.8, tested_at: '2025-11-14' },
      { id: uuidv4(), covenant_id: covenants[1].id, financial_period_id: periods[0].id, calculated_value: 5.83, threshold_at_test: 2.5, status: 'compliant', headroom_percentage: 133.0, tested_at: '2025-11-14' },
      // Midwest - Warning
      { id: uuidv4(), covenant_id: covenants[2].id, financial_period_id: periods[1].id, calculated_value: 4.8, threshold_at_test: 5.0, status: 'warning', headroom_percentage: 4.0, notes: 'Low headroom - monitor closely', tested_at: '2025-11-12' },
      { id: uuidv4(), covenant_id: covenants[3].id, financial_period_id: periods[1].id, calculated_value: 2.98, threshold_at_test: 2.0, status: 'compliant', headroom_percentage: 48.8, tested_at: '2025-11-12' },
      { id: uuidv4(), covenant_id: covenants[4].id, financial_period_id: periods[1].id, calculated_value: 1.37, threshold_at_test: 1.25, status: 'compliant', headroom_percentage: 9.8, tested_at: '2025-11-12' },
      // Harbor - Breach
      { id: uuidv4(), covenant_id: covenants[5].id, financial_period_id: periods[2].id, calculated_value: 4.36, threshold_at_test: 4.5, status: 'warning', headroom_percentage: 3.1, tested_at: '2025-11-10' },
      { id: uuidv4(), covenant_id: covenants[6].id, financial_period_id: periods[2].id, calculated_value: 1.8, threshold_at_test: 2.0, status: 'breach', headroom_percentage: -10.0, notes: 'BREACH: Below minimum interest coverage requirement', tested_at: '2025-11-10' },
      { id: uuidv4(), covenant_id: covenants[7].id, financial_period_id: periods[2].id, calculated_value: 0.75, threshold_at_test: 1.1, status: 'breach', headroom_percentage: -31.8, notes: 'BREACH: Fixed charge coverage significantly below minimum', tested_at: '2025-11-10' },
      // Sunrise - Compliant
      { id: uuidv4(), covenant_id: covenants[8].id, financial_period_id: periods[3].id, calculated_value: 2.44, threshold_at_test: 4.0, status: 'compliant', headroom_percentage: 39.0, tested_at: '2025-11-08' },
      { id: uuidv4(), covenant_id: covenants[9].id, financial_period_id: periods[3].id, calculated_value: 1.95, threshold_at_test: 1.25, status: 'compliant', headroom_percentage: 56.0, tested_at: '2025-11-08' },
      { id: uuidv4(), covenant_id: covenants[10].id, financial_period_id: periods[3].id, calculated_value: 2.08, threshold_at_test: 1.5, status: 'compliant', headroom_percentage: 38.7, tested_at: '2025-11-08' }
    ];

    const { error: testError } = await supabase.from('covenant_tests').insert(covenantTests as never[]);
    if (testError) throw testError;

    // Create Alerts
    const alerts = [
      { id: uuidv4(), organization_id: orgId, loan_id: loans[1].id, severity: 'warning', title: 'Low Covenant Headroom: Leverage Ratio', message: 'Midwest Manufacturing Co. leverage ratio at 4.80x is approaching the 5.00x maximum covenant threshold with only 4% headroom remaining.', acknowledged: false },
      { id: uuidv4(), organization_id: orgId, loan_id: loans[2].id, severity: 'critical', title: 'Covenant Breach: Interest Coverage Ratio', message: 'Harbor Retail Group, LLC has breached the minimum Interest Coverage Ratio covenant. Current ratio: 1.80x vs required minimum 2.00x (10% shortfall).', acknowledged: false },
      { id: uuidv4(), organization_id: orgId, loan_id: loans[2].id, severity: 'critical', title: 'Covenant Breach: Fixed Charge Coverage Ratio', message: 'Harbor Retail Group, LLC has breached the minimum Fixed Charge Coverage Ratio covenant. Current ratio: 0.75x vs required minimum 1.10x (31.8% shortfall).', acknowledged: false },
      { id: uuidv4(), organization_id: orgId, loan_id: loans[2].id, severity: 'warning', title: 'Low Covenant Headroom: Leverage Ratio', message: 'Harbor Retail Group, LLC leverage ratio at 4.36x is approaching the 4.50x maximum with only 3.1% headroom remaining.', acknowledged: false }
    ];

    const { error: alertError } = await supabase.from('alerts').insert(alerts as never[]);
    if (alertError) throw alertError;

    // Log audit
    await supabase.from('audit_logs').insert({
      organization_id: orgId,
      user_id: dbUserId,
      action: 'seed_demo_data',
      entity_type: 'system',
      entity_id: orgId,
      changes: { borrowers: 4, loans: 4, covenants: 11, alerts: 4 },
    } as never);

    return successResponse({
      message: 'Demo data seeded successfully',
      summary: {
        borrowers: borrowers.length,
        loans: loans.length,
        covenants: covenants.length,
        financial_periods: periods.length,
        covenant_tests: covenantTests.length,
        alerts: alerts.length
      }
    }, undefined, 201);
  } catch (error) {
    console.error('Error seeding demo data:', error);
    return handleApiError(error);
  }
}
