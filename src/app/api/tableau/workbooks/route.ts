import { auth, currentUser } from '@clerk/nextjs/server';
import { tableauAPI } from '@/lib/tableau/rest-api';
import { isTableauConfigured } from '@/lib/tableau/embed';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    if (!isTableauConfigured()) {
      return errorResponse('NOT_CONFIGURED', 'Tableau is not configured', 503);
    }

    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress;
    if (!email) {
      return errorResponse('BAD_REQUEST', 'User email required', 400);
    }

    await tableauAPI.authenticate(email);
    const workbooks = await tableauAPI.getWorkbooks();

    return successResponse(workbooks);
  } catch (error) {
    console.error('Tableau workbooks error:', error);
    return handleApiError(error);
  }
}
