import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { auth } from '@clerk/nextjs/server';

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const body = await request.json();
    const { ids, acknowledged } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: ids must be a non-empty array' },
        { status: 400 }
      );
    }

    if (typeof acknowledged !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request: acknowledged must be a boolean' },
        { status: 400 }
      );
    }

    const updateData = {
      acknowledged,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('alerts')
      .update(updateData as never)
      .in('id', ids)
      .select();

    if (error) {
      console.error('Error bulk updating alerts:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      message: `${data?.length || 0} alerts updated successfully`,
    });
  } catch (error) {
    console.error('Error in bulk alerts PATCH:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
