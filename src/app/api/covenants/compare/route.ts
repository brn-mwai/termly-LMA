import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    const { searchParams } = new URL(request.url);
    const loanIds = searchParams.get('loans')?.split(',').filter(Boolean);
    const covenantType = searchParams.get('type');

    const supabase = createAdminClient();

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('clerk_id', userId)
      .is('deleted_at', null)
      .single();

    if (!userData?.organization_id) {
      return errorResponse('NOT_FOUND', 'User not found', 404);
    }

    const orgId = userData.organization_id;

    // Build query for loans
    let loansQuery = supabase
      .from('loans')
      .select('id')
      .eq('organization_id', orgId)
      .is('deleted_at', null);

    if (loanIds && loanIds.length > 0) {
      loansQuery = loansQuery.in('id', loanIds);
    }

    const { data: loans } = await loansQuery;
    const orgLoanIds = (loans || []).map(l => l.id);

    if (orgLoanIds.length === 0) {
      return successResponse({ covenants: [], loans: [] });
    }

    // Get covenants with latest test results
    let covenantsQuery = supabase
      .from('covenants')
      .select(`
        id,
        name,
        type,
        operator,
        threshold,
        testing_frequency,
        loans (
          id,
          name,
          borrowers (name)
        ),
        covenant_tests (
          calculated_value,
          status,
          headroom_percentage,
          tested_at
        )
      `)
      .in('loan_id', orgLoanIds)
      .is('deleted_at', null)
      .order('type', { ascending: true });

    if (covenantType) {
      covenantsQuery = covenantsQuery.eq('type', covenantType);
    }

    const { data: covenants, error } = await covenantsQuery;

    if (error) {
      return errorResponse('DATABASE_ERROR', error.message, 500);
    }

    interface CovenantData {
      id: string;
      name: string;
      type: string;
      operator: string;
      threshold: number;
      testing_frequency: string;
      loans?: {
        id: string;
        name: string;
        borrowers?: { name: string };
      };
      covenant_tests?: Array<{
        calculated_value: number;
        status: string;
        headroom_percentage: number;
        tested_at: string;
      }>;
    }

    // Format comparison data
    const comparisonData = ((covenants || []) as unknown as CovenantData[]).map(cov => {
      const tests = cov.covenant_tests || [];
      const latestTest = tests.sort((a, b) =>
        new Date(b.tested_at).getTime() - new Date(a.tested_at).getTime()
      )[0];

      return {
        id: cov.id,
        covenantName: cov.name,
        type: cov.type,
        borrower: cov.loans?.borrowers?.name || 'Unknown',
        loanName: cov.loans?.name || 'Unknown',
        loanId: cov.loans?.id,
        operator: cov.operator,
        threshold: cov.threshold,
        frequency: cov.testing_frequency,
        currentValue: latestTest?.calculated_value || null,
        status: latestTest?.status || 'pending',
        headroom: latestTest?.headroom_percentage || null,
        lastTested: latestTest?.tested_at || null,
      };
    });

    // Group by covenant type for easier comparison
    const byType: Record<string, typeof comparisonData> = {};
    for (const cov of comparisonData) {
      if (!byType[cov.type]) {
        byType[cov.type] = [];
      }
      byType[cov.type].push(cov);
    }

    // Sort each type by headroom (worst first)
    for (const type of Object.keys(byType)) {
      byType[type].sort((a, b) => (a.headroom || 100) - (b.headroom || 100));
    }

    // Get unique loans for the selector
    const uniqueLoans = [...new Map(
      comparisonData.map(c => [c.loanId, { id: c.loanId, name: c.loanName, borrower: c.borrower }])
    ).values()];

    // Calculate summary stats
    const summary = {
      totalCovenants: comparisonData.length,
      compliant: comparisonData.filter(c => c.status === 'compliant').length,
      warning: comparisonData.filter(c => c.status === 'warning').length,
      breach: comparisonData.filter(c => c.status === 'breach').length,
      lowestHeadroom: comparisonData.length > 0
        ? Math.min(...comparisonData.filter(c => c.headroom !== null).map(c => c.headroom!))
        : null,
      avgHeadroom: comparisonData.length > 0
        ? comparisonData.filter(c => c.headroom !== null).reduce((sum, c) => sum + c.headroom!, 0) /
          comparisonData.filter(c => c.headroom !== null).length
        : null,
    };

    return successResponse({
      covenants: comparisonData,
      byType,
      loans: uniqueLoans,
      summary,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
