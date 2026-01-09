import { auth, currentUser } from '@clerk/nextjs/server';
import { generateEmbedToken, isTableauConfigured } from '@/lib/tableau/embed';
import { DASHBOARDS, isDashboardKey } from '@/lib/tableau/config';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    // Check if Tableau is configured
    if (!isTableauConfigured()) {
      return errorResponse(
        'NOT_CONFIGURED',
        'Tableau is not configured. Please set TABLEAU_SERVER_URL, TABLEAU_SITE_ID, TABLEAU_TOKEN_NAME, and TABLEAU_TOKEN_SECRET environment variables.',
        503
      );
    }

    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress;
    if (!email) {
      return errorResponse('BAD_REQUEST', 'User email required', 400);
    }

    const body = await request.json();
    const { dashboard, parameters } = body;

    if (!dashboard || !isDashboardKey(dashboard)) {
      return errorResponse(
        'BAD_REQUEST',
        `Invalid dashboard. Must be one of: ${Object.keys(DASHBOARDS).join(', ')}`,
        400
      );
    }

    const result = generateEmbedToken(email, dashboard, parameters);

    return successResponse({
      token: result.token,
      expiresAt: result.expiresAt.toISOString(),
      viewUrl: result.viewUrl,
      dashboardName: result.dashboardName,
    });
  } catch (error) {
    console.error('Tableau token error:', error);
    return handleApiError(error);
  }
}
