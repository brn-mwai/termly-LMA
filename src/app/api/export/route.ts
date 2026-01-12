import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { toCSV } from '@/lib/utils/export';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return new NextResponse('Export type is required', { status: 400 });
    }

    const supabase = createAdminClient();

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('clerk_id', userId)
      .is('deleted_at', null)
      .single();

    if (!userData?.organization_id) {
      return new NextResponse('User not found', { status: 404 });
    }

    const orgId = userData.organization_id;
    let csv = '';
    let filename = '';

    switch (type) {
      case 'loans': {
        const { data: loans } = await supabase
          .from('loans')
          .select(`
            name,
            facility_type,
            commitment_amount,
            outstanding_amount,
            status,
            maturity_date,
            interest_rate,
            borrowers (name, industry, rating)
          `)
          .eq('organization_id', orgId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        interface LoanExport {
          borrower: string;
          loan_name: string;
          facility_type: string;
          commitment: number;
          outstanding: number;
          utilization: string;
          status: string;
          maturity_date: string;
          interest_rate: string;
          industry: string;
          rating: string;
        }

        const formattedLoans: LoanExport[] = (loans || []).map((loan: Record<string, unknown>) => {
          const borrower = loan.borrowers as { name?: string; industry?: string; rating?: string } | undefined;
          const commitment = Number(loan.commitment_amount) || 0;
          const outstanding = Number(loan.outstanding_amount) || 0;
          return {
            borrower: borrower?.name || '',
            loan_name: String(loan.name || ''),
            facility_type: String(loan.facility_type || ''),
            commitment,
            outstanding,
            utilization: commitment > 0 ? `${((outstanding / commitment) * 100).toFixed(1)}%` : '0%',
            status: String(loan.status || ''),
            maturity_date: String(loan.maturity_date || ''),
            interest_rate: loan.interest_rate ? `${(Number(loan.interest_rate) * 100).toFixed(2)}%` : '',
            industry: borrower?.industry || '',
            rating: borrower?.rating || '',
          };
        });

        csv = toCSV(formattedLoans, {
          columns: [
            { key: 'borrower', label: 'Borrower' },
            { key: 'loan_name', label: 'Loan Name' },
            { key: 'facility_type', label: 'Facility Type' },
            { key: 'commitment', label: 'Commitment ($)' },
            { key: 'outstanding', label: 'Outstanding ($)' },
            { key: 'utilization', label: 'Utilization' },
            { key: 'status', label: 'Status' },
            { key: 'maturity_date', label: 'Maturity Date' },
            { key: 'interest_rate', label: 'Interest Rate' },
            { key: 'industry', label: 'Industry' },
            { key: 'rating', label: 'Rating' },
          ],
        });
        filename = `loans-export-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }

      case 'covenants': {
        const { data: loans } = await supabase
          .from('loans')
          .select('id')
          .eq('organization_id', orgId)
          .is('deleted_at', null);

        const loanIds = (loans || []).map(l => l.id);

        const { data: covenants } = await supabase
          .from('covenants')
          .select(`
            name,
            type,
            operator,
            threshold,
            testing_frequency,
            test_due_date,
            loans (name, borrowers (name))
          `)
          .in('loan_id', loanIds)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        interface CovenantExport {
          borrower: string;
          loan: string;
          covenant_name: string;
          type: string;
          operator: string;
          threshold: number;
          testing_frequency: string;
          next_test_date: string;
        }

        const formattedCovenants: CovenantExport[] = (covenants || []).map((cov: Record<string, unknown>) => {
          const loan = cov.loans as { name?: string; borrowers?: { name?: string } } | undefined;
          return {
            borrower: loan?.borrowers?.name || '',
            loan: loan?.name || '',
            covenant_name: String(cov.name || ''),
            type: String(cov.type || ''),
            operator: String(cov.operator || ''),
            threshold: Number(cov.threshold) || 0,
            testing_frequency: String(cov.testing_frequency || ''),
            next_test_date: String(cov.test_due_date || ''),
          };
        });

        csv = toCSV(formattedCovenants, {
          columns: [
            { key: 'borrower', label: 'Borrower' },
            { key: 'loan', label: 'Loan' },
            { key: 'covenant_name', label: 'Covenant Name' },
            { key: 'type', label: 'Type' },
            { key: 'operator', label: 'Operator' },
            { key: 'threshold', label: 'Threshold' },
            { key: 'testing_frequency', label: 'Testing Frequency' },
            { key: 'next_test_date', label: 'Next Test Date' },
          ],
        });
        filename = `covenants-export-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }

      case 'financial-periods': {
        const { data: periods } = await supabase
          .from('financial_periods')
          .select(`
            period_end_date,
            period_type,
            revenue,
            ebitda_reported,
            total_debt,
            interest_expense,
            current_assets,
            current_liabilities,
            net_worth,
            loans (name, borrowers (name))
          `)
          .eq('organization_id', orgId)
          .order('period_end_date', { ascending: false });

        interface PeriodExport {
          borrower: string;
          loan: string;
          period_end: string;
          period_type: string;
          revenue: number;
          ebitda: number;
          total_debt: number;
          interest_expense: number;
          current_ratio: string;
          net_worth: number;
        }

        const formattedPeriods: PeriodExport[] = (periods || []).map((p: Record<string, unknown>) => {
          const loan = p.loans as { name?: string; borrowers?: { name?: string } } | undefined;
          const currentAssets = Number(p.current_assets) || 0;
          const currentLiabilities = Number(p.current_liabilities) || 0;
          return {
            borrower: loan?.borrowers?.name || '',
            loan: loan?.name || '',
            period_end: String(p.period_end_date || ''),
            period_type: String(p.period_type || ''),
            revenue: Number(p.revenue) || 0,
            ebitda: Number(p.ebitda_reported) || 0,
            total_debt: Number(p.total_debt) || 0,
            interest_expense: Number(p.interest_expense) || 0,
            current_ratio: currentLiabilities > 0 ? `${(currentAssets / currentLiabilities).toFixed(2)}x` : 'N/A',
            net_worth: Number(p.net_worth) || 0,
          };
        });

        csv = toCSV(formattedPeriods, {
          columns: [
            { key: 'borrower', label: 'Borrower' },
            { key: 'loan', label: 'Loan' },
            { key: 'period_end', label: 'Period End' },
            { key: 'period_type', label: 'Period Type' },
            { key: 'revenue', label: 'Revenue ($)' },
            { key: 'ebitda', label: 'EBITDA ($)' },
            { key: 'total_debt', label: 'Total Debt ($)' },
            { key: 'interest_expense', label: 'Interest Expense ($)' },
            { key: 'current_ratio', label: 'Current Ratio' },
            { key: 'net_worth', label: 'Net Worth ($)' },
          ],
        });
        filename = `financial-periods-export-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }

      case 'alerts': {
        const { data: alerts } = await supabase
          .from('alerts')
          .select(`
            severity,
            title,
            message,
            acknowledged,
            created_at,
            loans (name, borrowers (name))
          `)
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false });

        interface AlertExport {
          date: string;
          severity: string;
          title: string;
          message: string;
          borrower: string;
          loan: string;
          acknowledged: string;
        }

        const formattedAlerts: AlertExport[] = (alerts || []).map((a: Record<string, unknown>) => {
          const loan = a.loans as { name?: string; borrowers?: { name?: string } } | undefined;
          return {
            date: String(a.created_at || ''),
            severity: String(a.severity || ''),
            title: String(a.title || ''),
            message: String(a.message || ''),
            borrower: loan?.borrowers?.name || '',
            loan: loan?.name || '',
            acknowledged: a.acknowledged ? 'Yes' : 'No',
          };
        });

        csv = toCSV(formattedAlerts, {
          columns: [
            { key: 'date', label: 'Date' },
            { key: 'severity', label: 'Severity' },
            { key: 'title', label: 'Title' },
            { key: 'message', label: 'Message' },
            { key: 'borrower', label: 'Borrower' },
            { key: 'loan', label: 'Loan' },
            { key: 'acknowledged', label: 'Acknowledged' },
          ],
        });
        filename = `alerts-export-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }

      default:
        return new NextResponse('Invalid export type', { status: 400 });
    }

    // Return CSV as downloadable file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return new NextResponse('Export failed', { status: 500 });
  }
}
