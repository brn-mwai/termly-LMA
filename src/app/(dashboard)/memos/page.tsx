import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scroll, Plus, Eye, Sparkle, User } from '@phosphor-icons/react/dist/ssr';
import { formatDate, formatRelativeTime } from '@/lib/utils/format';

export default async function MemosPage() {
  const { userId } = await auth();

  let memos = mockMemos;

  if (userId) {
    const supabase = await createClient();

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('clerk_id', userId)
      .single();

    const orgId = (userData as { organization_id: string } | null)?.organization_id;

    if (orgId) {
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

      if (data && data.length > 0) {
        memos = data;
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl tracking-tight flex items-center gap-2">
            <Scroll className="h-6 w-6" />
            Credit Memos
          </h1>
          <p className="text-muted-foreground">
            Generate and manage credit analysis memos
          </p>
        </div>
        <Button asChild>
          <Link href="/memos/new">
            <Plus className="h-4 w-4 mr-2" />
            New Memo
          </Link>
        </Button>
      </div>

      {/* Memos Grid */}
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

        {memos.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Scroll className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No memos yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first credit memo to get started
            </p>
            <Button asChild>
              <Link href="/memos/new">Create Memo</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

const mockMemos = [
  {
    id: '1',
    title: 'Q4 2025 Quarterly Review - Acme Corporation',
    content: '## Executive Summary\n\nAcme Corporation has experienced deteriorating financial performance in Q4 2025, resulting in a breach of the Total Leverage Ratio covenant. The leverage ratio increased to 5.2x, exceeding the maximum threshold of 5.0x.\n\n## Financial Performance\n\nRevenue declined 8% YoY to $312.5M, primarily driven by...',
    generated_by_ai: true,
    created_at: '2026-01-06T10:30:00Z',
    loans: { id: '1', name: 'Senior Term Loan', borrowers: { name: 'Acme Corporation' } },
    users: { full_name: 'John Smith', email: 'john@example.com' },
  },
  {
    id: '2',
    title: 'Covenant Breach Analysis - Acme Corporation',
    content: '## Breach Overview\n\nOn January 5, 2026, Acme Corporation breached the Total Leverage Ratio covenant with a calculated ratio of 5.2x against a maximum threshold of 5.0x...',
    generated_by_ai: true,
    created_at: '2026-01-05T14:00:00Z',
    loans: { id: '1', name: 'Senior Term Loan', borrowers: { name: 'Acme Corporation' } },
    users: { full_name: 'Jane Doe', email: 'jane@example.com' },
  },
  {
    id: '3',
    title: 'Annual Review - Beta Industries',
    content: '## Executive Summary\n\nBeta Industries has maintained strong covenant compliance throughout 2025 with all covenants showing healthy headroom...',
    generated_by_ai: false,
    created_at: '2025-12-20T09:00:00Z',
    loans: { id: '2', name: 'Revolving Credit Facility', borrowers: { name: 'Beta Industries' } },
    users: { full_name: 'John Smith', email: 'john@example.com' },
  },
];
