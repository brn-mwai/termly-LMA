'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkle, Trash, CircleNotch, User, CalendarBlank } from '@phosphor-icons/react';
import { ExportMemoButton } from '@/components/memos/export-memo-button';
import { formatDate } from '@/lib/utils/format';

export default function MemoDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [memo, setMemo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMemo();
  }, [id]);

  async function fetchMemo() {
    try {
      const res = await fetch(`/api/memos/${id}`);
      if (res.ok) {
        const { data } = await res.json();
        setMemo(data);
      } else {
        setMemo(null);
      }
    } catch {
      setMemo(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this memo?')) return;

    try {
      const res = await fetch(`/api/memos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/memos');
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <CircleNotch className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!memo) {
    return (
      <div className="text-center py-12">
        <p>Memo not found</p>
        <Button asChild className="mt-4">
          <Link href="/memos">Back to Memos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/memos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-normal tracking-tight">{memo.title}</h1>
            {memo.generated_by_ai && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
                <Sparkle className="h-3 w-3 mr-1" />
                AI Generated
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {memo.loans?.borrowers?.name} - {memo.loans?.name}
          </p>
        </div>
        <div className="flex gap-2">
          <ExportMemoButton memo={memo} />
          <Button variant="outline" onClick={handleDelete}>
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Meta Info */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          {memo.users?.full_name || 'System'}
        </div>
        <div className="flex items-center gap-2">
          <CalendarBlank className="h-4 w-4" />
          {formatDate(memo.created_at)}
        </div>
        {memo.loans && (
          <Link href={`/loans/${memo.loans.id}`} className="text-primary hover:underline">
            View Loan Details
          </Link>
        )}
      </div>

      {/* Content */}
      <Card>
        <CardContent className="prose prose-sm max-w-none p-6">
          <div className="whitespace-pre-wrap">{memo.content}</div>
        </CardContent>
      </Card>
    </div>
  );
}
