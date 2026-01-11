import { Suspense } from 'react';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scroll, Plus, Eye, Sparkle, User } from '@phosphor-icons/react/dist/ssr';
import { formatRelativeTime } from '@/lib/utils/format';
import { MemosGridSkeleton } from '@/components/memos/memos-grid-skeleton';

async function getMemos() {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = await createClient();

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('clerk_id', userId)
    .single();

  const orgId = (userData as { organization_id: string } | null)?.organization_id;
  if (!orgId) return [];

  const { data } = await supabase
    .from('memos')
    .select(`
      *,
      loans (id, name, borrowers (name)),
      users:created_by (full_name, email)
    `)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return data || [];
}

async function MemosGrid() {
  const memos = await getMemos();

  if (memos.length === 0) {
    return (
      <div className="text-center py-12">
        <Scroll className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No memos yet</h3>
        <p className="text-muted-foreground mb-4">
          Create your first credit memo to get started
        </p>
        <Button asChild>
          <Link href="/memos/new">Create Memo</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {memos.map((memo: any) => (
        <Card key={memo.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg line-clamp-1">{memo.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {memo.loans?.borrowers?.name || 'Unknown'} - {memo.loans?.name || 'Unknown'}
                </p>
              </div>
              {memo.generated_by_ai && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  <Sparkle className="h-3 w-3 mr-1" />
                  AI
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
              {memo.content?.slice(0, 200)}...
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                {memo.users?.full_name || 'System'}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(memo.created_at)}
                </span>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/memos/${memo.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function MemosPage() {
  return (
    <div className="space-y-4 min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-normal tracking-tight">
            Credit Memos
          </h1>
          <p className="text-sm text-muted-foreground">
            Generate and manage credit analysis memos
          </p>
        </div>
        <Button asChild className="w-fit">
          <Link href="/memos/new">
            <Plus className="h-4 w-4 mr-2" />
            New Memo
          </Link>
        </Button>
      </div>

      {/* Memos Grid with Suspense */}
      <div className="min-w-0">
        <Suspense fallback={<MemosGridSkeleton />}>
          <MemosGrid />
        </Suspense>
      </div>
    </div>
  );
}
