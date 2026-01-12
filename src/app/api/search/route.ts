import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
      return successResponse({ results: [], message: 'Query must be at least 2 characters' });
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
      return errorResponse('NOT_FOUND', 'User not found', 404);
    }

    const orgId = userData.organization_id;
    const searchPattern = `%${query}%`;

    // Search in parallel across all entities
    const [loansResult, borrowersResult, documentsResult, covenantsResult] = await Promise.all([
      // Search loans
      supabase
        .from('loans')
        .select('id, name, facility_type, status, borrowers(name)')
        .eq('organization_id', orgId)
        .is('deleted_at', null)
        .or(`name.ilike.${searchPattern}`)
        .limit(5),

      // Search borrowers
      supabase
        .from('borrowers')
        .select('id, name, industry, rating')
        .eq('organization_id', orgId)
        .is('deleted_at', null)
        .ilike('name', searchPattern)
        .limit(5),

      // Search documents
      supabase
        .from('documents')
        .select('id, name, type, extraction_status, loans(name)')
        .eq('organization_id', orgId)
        .is('deleted_at', null)
        .ilike('name', searchPattern)
        .limit(5),

      // Search covenants
      supabase
        .from('covenants')
        .select('id, name, type, loans(name, borrowers(name))')
        .eq('organization_id', orgId)
        .is('deleted_at', null)
        .ilike('name', searchPattern)
        .limit(5),
    ]);

    interface LoanResult {
      id: string;
      name: string;
      facility_type: string;
      status: string;
      borrowers?: { name: string } | Array<{ name: string }>;
    }

    interface BorrowerResult {
      id: string;
      name: string;
      industry?: string;
      rating?: string;
    }

    interface DocumentResult {
      id: string;
      name: string;
      type: string;
      extraction_status: string;
      loans?: { name: string };
    }

    interface CovenantResult {
      id: string;
      name: string;
      type: string;
      loans?: { name: string; borrowers?: { name: string } };
    }

    // Format results
    const results = {
      loans: ((loansResult.data || []) as unknown as LoanResult[]).map(loan => {
        const borrower = Array.isArray(loan.borrowers) ? loan.borrowers[0] : loan.borrowers;
        return {
          id: loan.id,
          name: loan.name,
          type: 'loan' as const,
          subtitle: borrower?.name || loan.facility_type,
          status: loan.status,
          url: `/loans/${loan.id}`,
        };
      }),

      borrowers: ((borrowersResult.data || []) as unknown as BorrowerResult[]).map(borrower => ({
        id: borrower.id,
        name: borrower.name,
        type: 'borrower' as const,
        subtitle: `${borrower.industry || 'Unknown'} • ${borrower.rating || 'Not rated'}`,
        url: `/borrowers/${borrower.id}`,
      })),

      documents: ((documentsResult.data || []) as unknown as DocumentResult[]).map(doc => ({
        id: doc.id,
        name: doc.name,
        type: 'document' as const,
        subtitle: doc.loans?.name || doc.type,
        status: doc.extraction_status,
        url: `/documents?id=${doc.id}`,
      })),

      covenants: ((covenantsResult.data || []) as unknown as CovenantResult[]).map(cov => ({
        id: cov.id,
        name: cov.name,
        type: 'covenant' as const,
        subtitle: `${cov.type} • ${cov.loans?.borrowers?.name || cov.loans?.name || 'Unknown'}`,
        url: `/loans/${cov.loans?.name}`,
      })),
    };

    const totalCount =
      results.loans.length +
      results.borrowers.length +
      results.documents.length +
      results.covenants.length;

    return successResponse({
      query,
      results,
      totalCount,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
