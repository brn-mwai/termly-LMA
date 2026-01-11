/**
 * Demo Data Seeding Script
 *
 * This script populates the database with demo data for showcasing Termly.
 * Run with: npx tsx scripts/seed-demo-data.ts
 *
 * Prerequisites:
 * - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Demo IDs (fixed for consistency)
const DEMO_ORG_ID = 'demo-org-' + uuidv4().slice(0, 8);

// Borrower IDs
const TECHFLOW_BORROWER_ID = uuidv4();
const MIDWEST_BORROWER_ID = uuidv4();
const HARBOR_BORROWER_ID = uuidv4();
const SUNRISE_BORROWER_ID = uuidv4();

// Loan IDs
const TECHFLOW_LOAN_ID = uuidv4();
const MIDWEST_LOAN_ID = uuidv4();
const HARBOR_LOAN_ID = uuidv4();
const SUNRISE_LOAN_ID = uuidv4();

async function seedDemoData(organizationId: string) {
  console.log('Starting demo data seeding...');
  console.log(`Using organization ID: ${organizationId}`);

  // Step 1: Create Borrowers
  console.log('\n1. Creating borrowers...');
  const borrowers = [
    {
      id: TECHFLOW_BORROWER_ID,
      organization_id: organizationId,
      name: 'TechFlow Solutions Inc.',
      industry: 'Technology',
      rating: 'BBB+',
      metadata: { ticker: 'TFSI', headquarters: 'San Francisco, CA' }
    },
    {
      id: MIDWEST_BORROWER_ID,
      organization_id: organizationId,
      name: 'Midwest Manufacturing Co.',
      industry: 'Manufacturing',
      rating: 'BB+',
      metadata: { headquarters: 'Cleveland, OH', employees: 450 }
    },
    {
      id: HARBOR_BORROWER_ID,
      organization_id: organizationId,
      name: 'Harbor Retail Group, LLC',
      industry: 'Retail',
      rating: 'B',
      metadata: { headquarters: 'Los Angeles, CA', stores: 42 }
    },
    {
      id: SUNRISE_BORROWER_ID,
      organization_id: organizationId,
      name: 'Sunrise Healthcare Systems, Inc.',
      industry: 'Healthcare',
      rating: 'BBB',
      metadata: { headquarters: 'Philadelphia, PA', facilities: 6 }
    }
  ];

  const { error: borrowerError } = await supabase.from('borrowers').upsert(borrowers, { onConflict: 'id' });
  if (borrowerError) {
    console.error('Error creating borrowers:', borrowerError);
    return;
  }
  console.log(`   Created ${borrowers.length} borrowers`);

  // Step 2: Create Loans
  console.log('\n2. Creating loans...');
  const loans = [
    {
      id: TECHFLOW_LOAN_ID,
      organization_id: organizationId,
      borrower_id: TECHFLOW_BORROWER_ID,
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
      id: MIDWEST_LOAN_ID,
      organization_id: organizationId,
      borrower_id: MIDWEST_BORROWER_ID,
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
      id: HARBOR_LOAN_ID,
      organization_id: organizationId,
      borrower_id: HARBOR_BORROWER_ID,
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
      id: SUNRISE_LOAN_ID,
      organization_id: organizationId,
      borrower_id: SUNRISE_BORROWER_ID,
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

  const { error: loanError } = await supabase.from('loans').upsert(loans, { onConflict: 'id' });
  if (loanError) {
    console.error('Error creating loans:', loanError);
    return;
  }
  console.log(`   Created ${loans.length} loans`);

  // Step 3: Create Covenants
  console.log('\n3. Creating covenants...');
  const covenants = [
    // TechFlow Covenants
    {
      id: uuidv4(),
      loan_id: TECHFLOW_LOAN_ID,
      name: 'Maximum Leverage Ratio',
      type: 'leverage',
      operator: 'max',
      threshold: 4.0,
      testing_frequency: 'quarterly',
      grace_period_days: 30
    },
    {
      id: uuidv4(),
      loan_id: TECHFLOW_LOAN_ID,
      name: 'Minimum Interest Coverage Ratio',
      type: 'interest_coverage',
      operator: 'min',
      threshold: 2.5,
      testing_frequency: 'quarterly',
      grace_period_days: 30
    },
    // Midwest Covenants
    {
      id: uuidv4(),
      loan_id: MIDWEST_LOAN_ID,
      name: 'Maximum Leverage Ratio',
      type: 'leverage',
      operator: 'max',
      threshold: 5.0,
      testing_frequency: 'quarterly',
      grace_period_days: 30
    },
    {
      id: uuidv4(),
      loan_id: MIDWEST_LOAN_ID,
      name: 'Minimum Interest Coverage Ratio',
      type: 'interest_coverage',
      operator: 'min',
      threshold: 2.0,
      testing_frequency: 'quarterly',
      grace_period_days: 30
    },
    {
      id: uuidv4(),
      loan_id: MIDWEST_LOAN_ID,
      name: 'Minimum Current Ratio',
      type: 'current_ratio',
      operator: 'min',
      threshold: 1.25,
      testing_frequency: 'quarterly',
      grace_period_days: 30
    },
    // Harbor Covenants
    {
      id: uuidv4(),
      loan_id: HARBOR_LOAN_ID,
      name: 'Maximum Leverage Ratio',
      type: 'leverage',
      operator: 'max',
      threshold: 4.5,
      testing_frequency: 'quarterly',
      grace_period_days: 30
    },
    {
      id: uuidv4(),
      loan_id: HARBOR_LOAN_ID,
      name: 'Minimum Interest Coverage Ratio',
      type: 'interest_coverage',
      operator: 'min',
      threshold: 2.0,
      testing_frequency: 'quarterly',
      grace_period_days: 30
    },
    {
      id: uuidv4(),
      loan_id: HARBOR_LOAN_ID,
      name: 'Minimum Fixed Charge Coverage Ratio',
      type: 'fixed_charge_coverage',
      operator: 'min',
      threshold: 1.1,
      testing_frequency: 'quarterly',
      grace_period_days: 30
    },
    // Sunrise Covenants
    {
      id: uuidv4(),
      loan_id: SUNRISE_LOAN_ID,
      name: 'Maximum Leverage Ratio',
      type: 'leverage',
      operator: 'max',
      threshold: 4.0,
      testing_frequency: 'quarterly',
      grace_period_days: 30
    },
    {
      id: uuidv4(),
      loan_id: SUNRISE_LOAN_ID,
      name: 'Minimum DSCR',
      type: 'fixed_charge_coverage',
      operator: 'min',
      threshold: 1.25,
      testing_frequency: 'quarterly',
      grace_period_days: 30
    },
    {
      id: uuidv4(),
      loan_id: SUNRISE_LOAN_ID,
      name: 'Minimum Current Ratio',
      type: 'current_ratio',
      operator: 'min',
      threshold: 1.5,
      testing_frequency: 'quarterly',
      grace_period_days: 30
    }
  ];

  const { error: covenantError } = await supabase.from('covenants').upsert(covenants, { onConflict: 'id' });
  if (covenantError) {
    console.error('Error creating covenants:', covenantError);
    return;
  }
  console.log(`   Created ${covenants.length} covenants`);

  // Get inserted covenant IDs for covenant tests
  const { data: insertedCovenants } = await supabase
    .from('covenants')
    .select('id, loan_id, type, name')
    .in('loan_id', [TECHFLOW_LOAN_ID, MIDWEST_LOAN_ID, HARBOR_LOAN_ID, SUNRISE_LOAN_ID]);

  // Step 4: Create Financial Periods
  console.log('\n4. Creating financial periods...');
  const periods = [
    // TechFlow - Q3 2025
    {
      id: uuidv4(),
      loan_id: TECHFLOW_LOAN_ID,
      period_end_date: '2025-09-30',
      period_type: 'quarterly',
      revenue: 42500000,
      ebitda_reported: 12450000,
      total_debt: 28500000,
      interest_expense: 2137500,
      current_assets: 18500000,
      current_liabilities: 7200000,
      verified: true
    },
    // Midwest - Q3 2025
    {
      id: uuidv4(),
      loan_id: MIDWEST_LOAN_ID,
      period_end_date: '2025-09-30',
      period_type: 'quarterly',
      revenue: 62600000,
      ebitda_reported: 13000000,
      total_debt: 62400000,
      interest_expense: 4368000,
      current_assets: 24500000,
      current_liabilities: 17850000,
      verified: true
    },
    // Harbor - Q3 2025
    {
      id: uuidv4(),
      loan_id: HARBOR_LOAN_ID,
      period_end_date: '2025-09-30',
      period_type: 'quarterly',
      revenue: 62600000,
      ebitda_reported: 7150000,
      total_debt: 31200000,
      interest_expense: 3972000,
      fixed_charges: 6472000,
      current_assets: 8500000,
      current_liabilities: 9200000,
      verified: true
    },
    // Sunrise - Q3 2025
    {
      id: uuidv4(),
      loan_id: SUNRISE_LOAN_ID,
      period_end_date: '2025-09-30',
      period_type: 'quarterly',
      revenue: 58000000,
      ebitda_reported: 14850000,
      total_debt: 36250000,
      interest_expense: 2537500,
      fixed_charges: 6537500,
      current_assets: 18200000,
      current_liabilities: 8750000,
      verified: true
    }
  ];

  const { error: periodError } = await supabase.from('financial_periods').upsert(periods, { onConflict: 'id' });
  if (periodError) {
    console.error('Error creating financial periods:', periodError);
    return;
  }
  console.log(`   Created ${periods.length} financial periods`);

  // Get inserted period IDs for covenant tests
  const { data: insertedPeriods } = await supabase
    .from('financial_periods')
    .select('id, loan_id')
    .eq('period_end_date', '2025-09-30');

  if (!insertedCovenants || !insertedPeriods) {
    console.error('Could not retrieve inserted covenants or periods');
    return;
  }

  // Step 5: Create Covenant Tests
  console.log('\n5. Creating covenant tests...');
  const covenantTests: any[] = [];

  // Helper to find covenant and period
  const findCovenant = (loanId: string, type: string) =>
    insertedCovenants.find(c => c.loan_id === loanId && c.type === type);
  const findPeriod = (loanId: string) =>
    insertedPeriods.find(p => p.loan_id === loanId);

  // TechFlow Tests - All Compliant
  const tfLeverage = findCovenant(TECHFLOW_LOAN_ID, 'leverage');
  const tfInterest = findCovenant(TECHFLOW_LOAN_ID, 'interest_coverage');
  const tfPeriod = findPeriod(TECHFLOW_LOAN_ID);
  if (tfLeverage && tfPeriod) {
    covenantTests.push({
      id: uuidv4(),
      covenant_id: tfLeverage.id,
      financial_period_id: tfPeriod.id,
      calculated_value: 2.29,
      threshold_at_test: 4.0,
      status: 'compliant',
      headroom_percentage: 42.8,
      tested_at: '2025-11-14'
    });
  }
  if (tfInterest && tfPeriod) {
    covenantTests.push({
      id: uuidv4(),
      covenant_id: tfInterest.id,
      financial_period_id: tfPeriod.id,
      calculated_value: 5.83,
      threshold_at_test: 2.5,
      status: 'compliant',
      headroom_percentage: 133.0,
      tested_at: '2025-11-14'
    });
  }

  // Midwest Tests - Warning on Leverage
  const mwLeverage = findCovenant(MIDWEST_LOAN_ID, 'leverage');
  const mwInterest = findCovenant(MIDWEST_LOAN_ID, 'interest_coverage');
  const mwCurrent = findCovenant(MIDWEST_LOAN_ID, 'current_ratio');
  const mwPeriod = findPeriod(MIDWEST_LOAN_ID);
  if (mwLeverage && mwPeriod) {
    covenantTests.push({
      id: uuidv4(),
      covenant_id: mwLeverage.id,
      financial_period_id: mwPeriod.id,
      calculated_value: 4.8,
      threshold_at_test: 5.0,
      status: 'warning',
      headroom_percentage: 4.0,
      notes: 'Low headroom - monitor closely',
      tested_at: '2025-11-12'
    });
  }
  if (mwInterest && mwPeriod) {
    covenantTests.push({
      id: uuidv4(),
      covenant_id: mwInterest.id,
      financial_period_id: mwPeriod.id,
      calculated_value: 2.98,
      threshold_at_test: 2.0,
      status: 'compliant',
      headroom_percentage: 48.8,
      tested_at: '2025-11-12'
    });
  }
  if (mwCurrent && mwPeriod) {
    covenantTests.push({
      id: uuidv4(),
      covenant_id: mwCurrent.id,
      financial_period_id: mwPeriod.id,
      calculated_value: 1.37,
      threshold_at_test: 1.25,
      status: 'compliant',
      headroom_percentage: 9.8,
      tested_at: '2025-11-12'
    });
  }

  // Harbor Tests - BREACH on Interest Coverage and Fixed Charge
  const hrLeverage = findCovenant(HARBOR_LOAN_ID, 'leverage');
  const hrInterest = findCovenant(HARBOR_LOAN_ID, 'interest_coverage');
  const hrFixed = findCovenant(HARBOR_LOAN_ID, 'fixed_charge_coverage');
  const hrPeriod = findPeriod(HARBOR_LOAN_ID);
  if (hrLeverage && hrPeriod) {
    covenantTests.push({
      id: uuidv4(),
      covenant_id: hrLeverage.id,
      financial_period_id: hrPeriod.id,
      calculated_value: 4.36,
      threshold_at_test: 4.5,
      status: 'warning',
      headroom_percentage: 3.1,
      tested_at: '2025-11-10'
    });
  }
  if (hrInterest && hrPeriod) {
    covenantTests.push({
      id: uuidv4(),
      covenant_id: hrInterest.id,
      financial_period_id: hrPeriod.id,
      calculated_value: 1.8,
      threshold_at_test: 2.0,
      status: 'breach',
      headroom_percentage: -10.0,
      notes: 'BREACH: Below minimum interest coverage requirement',
      tested_at: '2025-11-10'
    });
  }
  if (hrFixed && hrPeriod) {
    covenantTests.push({
      id: uuidv4(),
      covenant_id: hrFixed.id,
      financial_period_id: hrPeriod.id,
      calculated_value: 0.75,
      threshold_at_test: 1.1,
      status: 'breach',
      headroom_percentage: -31.8,
      notes: 'BREACH: Fixed charge coverage significantly below minimum',
      tested_at: '2025-11-10'
    });
  }

  // Sunrise Tests - All Compliant
  const srLeverage = findCovenant(SUNRISE_LOAN_ID, 'leverage');
  const srDscr = findCovenant(SUNRISE_LOAN_ID, 'fixed_charge_coverage');
  const srCurrent = findCovenant(SUNRISE_LOAN_ID, 'current_ratio');
  const srPeriod = findPeriod(SUNRISE_LOAN_ID);
  if (srLeverage && srPeriod) {
    covenantTests.push({
      id: uuidv4(),
      covenant_id: srLeverage.id,
      financial_period_id: srPeriod.id,
      calculated_value: 2.44,
      threshold_at_test: 4.0,
      status: 'compliant',
      headroom_percentage: 39.0,
      tested_at: '2025-11-08'
    });
  }
  if (srDscr && srPeriod) {
    covenantTests.push({
      id: uuidv4(),
      covenant_id: srDscr.id,
      financial_period_id: srPeriod.id,
      calculated_value: 1.95,
      threshold_at_test: 1.25,
      status: 'compliant',
      headroom_percentage: 56.0,
      tested_at: '2025-11-08'
    });
  }
  if (srCurrent && srPeriod) {
    covenantTests.push({
      id: uuidv4(),
      covenant_id: srCurrent.id,
      financial_period_id: srPeriod.id,
      calculated_value: 2.08,
      threshold_at_test: 1.5,
      status: 'compliant',
      headroom_percentage: 38.7,
      tested_at: '2025-11-08'
    });
  }

  const { error: testError } = await supabase.from('covenant_tests').upsert(covenantTests, { onConflict: 'id' });
  if (testError) {
    console.error('Error creating covenant tests:', testError);
    return;
  }
  console.log(`   Created ${covenantTests.length} covenant tests`);

  // Step 6: Create Alerts for breaches and warnings
  console.log('\n6. Creating alerts...');
  const alerts = [
    // Midwest Warning
    {
      id: uuidv4(),
      organization_id: organizationId,
      loan_id: MIDWEST_LOAN_ID,
      severity: 'warning',
      title: 'Low Covenant Headroom: Leverage Ratio',
      message: 'Midwest Manufacturing Co. leverage ratio at 4.80x is approaching the 5.00x maximum covenant threshold with only 4% headroom remaining.',
      acknowledged: false
    },
    // Harbor Breaches
    {
      id: uuidv4(),
      organization_id: organizationId,
      loan_id: HARBOR_LOAN_ID,
      severity: 'critical',
      title: 'Covenant Breach: Interest Coverage Ratio',
      message: 'Harbor Retail Group, LLC has breached the minimum Interest Coverage Ratio covenant. Current ratio: 1.80x vs required minimum 2.00x (10% shortfall).',
      acknowledged: false
    },
    {
      id: uuidv4(),
      organization_id: organizationId,
      loan_id: HARBOR_LOAN_ID,
      severity: 'critical',
      title: 'Covenant Breach: Fixed Charge Coverage Ratio',
      message: 'Harbor Retail Group, LLC has breached the minimum Fixed Charge Coverage Ratio covenant. Current ratio: 0.75x vs required minimum 1.10x (31.8% shortfall).',
      acknowledged: false
    },
    {
      id: uuidv4(),
      organization_id: organizationId,
      loan_id: HARBOR_LOAN_ID,
      severity: 'warning',
      title: 'Low Covenant Headroom: Leverage Ratio',
      message: 'Harbor Retail Group, LLC leverage ratio at 4.36x is approaching the 4.50x maximum with only 3.1% headroom remaining.',
      acknowledged: false
    }
  ];

  const { error: alertError } = await supabase.from('alerts').upsert(alerts, { onConflict: 'id' });
  if (alertError) {
    console.error('Error creating alerts:', alertError);
    return;
  }
  console.log(`   Created ${alerts.length} alerts`);

  console.log('\n========================================');
  console.log('Demo data seeding completed successfully!');
  console.log('========================================');
  console.log('\nPortfolio Summary:');
  console.log('  - TechFlow Solutions: COMPLIANT (strong headroom)');
  console.log('  - Midwest Manufacturing: WARNING (leverage at 4.8x vs 5.0x max)');
  console.log('  - Harbor Retail Group: BREACH (2 covenant breaches)');
  console.log('  - Sunrise Healthcare: COMPLIANT (healthy margins)');
}

// Main execution
async function main() {
  // Check command line arguments
  const orgId = process.argv[2];

  if (!orgId) {
    console.log('Usage: npx tsx scripts/seed-demo-data.ts <organization_id>');
    console.log('');
    console.log('To find your organization_id:');
    console.log('  1. Log in to your Termly account');
    console.log('  2. Check the users table in Supabase for your organization_id');
    console.log('');
    console.log('Alternatively, run with "new" to create a fresh demo organization:');
    console.log('  npx tsx scripts/seed-demo-data.ts new');

    // Try to get existing orgs
    const { data: orgs } = await supabase.from('organizations').select('id, name').limit(5);
    if (orgs && orgs.length > 0) {
      console.log('\nExisting organizations:');
      orgs.forEach(org => console.log(`  ${org.id} - ${org.name}`));
    }
    return;
  }

  let targetOrgId = orgId;

  if (orgId === 'new') {
    // Create a new demo organization
    const newOrgId = DEMO_ORG_ID;
    const { error } = await supabase.from('organizations').insert({
      id: newOrgId,
      name: 'Demo Financial Institution',
      slug: 'demo-' + Date.now()
    });

    if (error) {
      console.error('Error creating demo organization:', error);
      return;
    }
    console.log(`Created new demo organization: ${newOrgId}`);
    targetOrgId = newOrgId;
  }

  await seedDemoData(targetOrgId);
}

main().catch(console.error);
