import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api';
import { calculateRiskScore, RiskFactors } from '@/lib/utils/risk-scoring';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    const { searchParams } = new URL(request.url);
    const borrowerId = searchParams.get('borrower_id');
    const loanId = searchParams.get('loan_id');

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

    // Get loans (optionally filtered)
    let loansQuery = supabase
      .from('loans')
      .select(`
        id,
        name,
        borrower_id,
        borrowers (id, name, rating)
      `)
      .eq('organization_id', orgId)
      .is('deleted_at', null);

    if (borrowerId) {
      loansQuery = loansQuery.eq('borrower_id', borrowerId);
    }

    if (loanId) {
      loansQuery = loansQuery.eq('id', loanId);
    }

    const { data: loans, error: loansError } = await loansQuery;

    if (loansError) {
      return errorResponse('DATABASE_ERROR', loansError.message, 500);
    }

    interface LoanData {
      id: string;
      name: string;
      borrower_id: string;
      borrowers?: { id: string; name: string; rating?: string };
    }

    const loansList = (loans || []) as unknown as LoanData[];

    if (loansList.length === 0) {
      return successResponse({ riskScores: [], summary: null });
    }

    // Get all covenants with their latest test results for these loans
    const loanIds = loansList.map(l => l.id);

    const { data: covenants } = await supabase
      .from('covenants')
      .select(`
        id,
        loan_id,
        type,
        covenant_tests (
          status,
          headroom_percentage,
          tested_at
        )
      `)
      .in('loan_id', loanIds)
      .is('deleted_at', null);

    interface CovenantData {
      id: string;
      loan_id: string;
      type: string;
      covenant_tests?: Array<{
        status: string;
        headroom_percentage: number;
        tested_at: string;
      }>;
    }

    const covenantsList = (covenants || []) as unknown as CovenantData[];

    // Calculate risk scores for each borrower
    const borrowerScores: Record<string, {
      borrowerId: string;
      borrowerName: string;
      rating: string | null;
      loans: Array<{ id: string; name: string }>;
      factors: RiskFactors;
    }> = {};

    // Group loans by borrower
    for (const loan of loansList) {
      const borrowerId = loan.borrowers?.id || loan.borrower_id;
      const borrowerName = loan.borrowers?.name || 'Unknown';
      const rating = loan.borrowers?.rating || null;

      if (!borrowerScores[borrowerId]) {
        borrowerScores[borrowerId] = {
          borrowerId,
          borrowerName,
          rating,
          loans: [],
          factors: {
            breachCount: 0,
            warningCount: 0,
            avgHeadroom: null,
            lowestHeadroom: null,
            creditRating: rating,
            leverageRatio: null,
            interestCoverage: null,
            headroomTrend: 'unknown',
          },
        };
      }

      borrowerScores[borrowerId].loans.push({ id: loan.id, name: loan.name });
    }

    // Process covenants for each loan
    const headroomValues: Record<string, number[]> = {};

    for (const covenant of covenantsList) {
      const loan = loansList.find(l => l.id === covenant.loan_id);
      if (!loan) continue;

      const borrowerId = loan.borrowers?.id || loan.borrower_id;
      if (!borrowerScores[borrowerId]) continue;

      // Get latest test
      const tests = covenant.covenant_tests || [];
      const sortedTests = tests.sort((a, b) =>
        new Date(b.tested_at).getTime() - new Date(a.tested_at).getTime()
      );
      const latestTest = sortedTests[0];

      if (latestTest) {
        if (latestTest.status === 'breach') {
          borrowerScores[borrowerId].factors.breachCount++;
        } else if (latestTest.status === 'warning') {
          borrowerScores[borrowerId].factors.warningCount++;
        }

        if (latestTest.headroom_percentage !== null) {
          if (!headroomValues[borrowerId]) {
            headroomValues[borrowerId] = [];
          }
          headroomValues[borrowerId].push(latestTest.headroom_percentage);
        }

        // Calculate trend from test history
        if (sortedTests.length >= 2) {
          const currentHeadroom = sortedTests[0]?.headroom_percentage;
          const previousHeadroom = sortedTests[1]?.headroom_percentage;

          if (currentHeadroom !== undefined && previousHeadroom !== undefined) {
            if (currentHeadroom > previousHeadroom + 5) {
              borrowerScores[borrowerId].factors.headroomTrend = 'improving';
            } else if (currentHeadroom < previousHeadroom - 5) {
              borrowerScores[borrowerId].factors.headroomTrend = 'deteriorating';
            } else {
              borrowerScores[borrowerId].factors.headroomTrend = 'stable';
            }
          }
        }
      }
    }

    // Calculate headroom stats
    for (const borrowerId of Object.keys(headroomValues)) {
      const values = headroomValues[borrowerId];
      if (values.length > 0) {
        borrowerScores[borrowerId].factors.avgHeadroom =
          values.reduce((a, b) => a + b, 0) / values.length;
        borrowerScores[borrowerId].factors.lowestHeadroom = Math.min(...values);
      }
    }

    // Calculate final risk scores
    const riskScores = Object.values(borrowerScores).map(borrower => {
      const score = calculateRiskScore(borrower.factors);
      return {
        borrowerId: borrower.borrowerId,
        borrowerName: borrower.borrowerName,
        rating: borrower.rating,
        loanCount: borrower.loans.length,
        loans: borrower.loans,
        ...score,
      };
    });

    // Sort by risk score (highest first)
    riskScores.sort((a, b) => b.score - a.score);

    // Calculate portfolio summary
    const summary = {
      totalBorrowers: riskScores.length,
      highRisk: riskScores.filter(r => r.level === 'high').length,
      mediumRisk: riskScores.filter(r => r.level === 'medium').length,
      lowRisk: riskScores.filter(r => r.level === 'low').length,
      avgScore: riskScores.length > 0
        ? Math.round(riskScores.reduce((sum, r) => sum + r.score, 0) / riskScores.length)
        : 0,
      highestRiskBorrower: riskScores[0] || null,
    };

    return successResponse({
      riskScores,
      summary,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
