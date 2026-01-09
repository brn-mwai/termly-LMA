import { NextResponse } from 'next/server';

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export function successResponse<T>(data: T, meta?: ApiResponse['meta'], status = 200) {
  return NextResponse.json({ data, meta }, { status });
}

export function errorResponse(
  code: string,
  message: string,
  status = 400,
  details?: unknown
) {
  return NextResponse.json(
    { error: { code, message, details } },
    { status }
  );
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof Error) {
    if (error.message.includes('duplicate key')) {
      return errorResponse('DUPLICATE', 'Resource already exists', 409);
    }
    if (error.message.includes('not found')) {
      return errorResponse('NOT_FOUND', 'Resource not found', 404);
    }
    return errorResponse('INTERNAL_ERROR', error.message, 500);
  }

  return errorResponse('UNKNOWN_ERROR', 'An unexpected error occurred', 500);
}

export function parseSearchParams(url: string) {
  const { searchParams } = new URL(url);
  return {
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20'),
    search: searchParams.get('search') || '',
    sortBy: searchParams.get('sortBy') || 'created_at',
    sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
    status: searchParams.get('status') || undefined,
  };
}

// Type helper for Supabase user queries
export interface UserWithOrg {
  id?: string;
  organization_id: string;
}

export function asUserWithOrg(data: unknown): UserWithOrg | null {
  if (!data || typeof data !== 'object') return null;
  const user = data as Record<string, unknown>;
  if (typeof user.organization_id === 'string') {
    return {
      id: typeof user.id === 'string' ? user.id : undefined,
      organization_id: user.organization_id,
    };
  }
  return null;
}
