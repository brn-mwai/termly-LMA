'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
        <CardContent className="p-8 md:p-10">
          <article className="prose prose-base dark:prose-invert max-w-none
            [&>*]:mb-4

            prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-gray-900 dark:prose-headings:text-gray-100
            prose-h1:text-2xl prose-h1:border-b prose-h1:border-gray-200 dark:prose-h1:border-gray-700 prose-h1:pb-3 prose-h1:mb-6 prose-h1:mt-0
            prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:pt-4 prose-h2:border-t prose-h2:border-gray-100 dark:prose-h2:border-gray-800
            prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3

            prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-7 prose-p:mb-4
            prose-strong:font-semibold prose-strong:text-gray-900 dark:prose-strong:text-gray-100

            prose-ul:my-4 prose-ul:pl-6 prose-ul:list-disc
            prose-ol:my-4 prose-ol:pl-6 prose-ol:list-decimal
            prose-li:my-1.5 prose-li:leading-7 prose-li:text-gray-700 dark:prose-li:text-gray-300

            prose-table:my-6 prose-table:w-full prose-table:border-collapse prose-table:border prose-table:border-gray-200 dark:prose-table:border-gray-700 prose-table:rounded-lg prose-table:overflow-hidden
            prose-thead:bg-gray-50 dark:prose-thead:bg-gray-800
            prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:text-sm prose-th:font-semibold prose-th:text-gray-900 dark:prose-th:text-gray-100 prose-th:border-b prose-th:border-gray-200 dark:prose-th:border-gray-700
            prose-td:px-4 prose-td:py-3 prose-td:text-sm prose-td:border-b prose-td:border-gray-100 dark:prose-td:border-gray-800

            prose-hr:my-8 prose-hr:border-t-2 prose-hr:border-gray-200 dark:prose-hr:border-gray-700

            prose-blockquote:border-l-4 prose-blockquote:border-emerald-500 prose-blockquote:pl-4 prose-blockquote:py-1 prose-blockquote:my-4 prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-gray-800/50 prose-blockquote:rounded-r-lg prose-blockquote:italic prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-400

            prose-em:text-gray-600 dark:prose-em:text-gray-400
            prose-a:text-emerald-600 dark:prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline
            prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {memo.content}
            </ReactMarkdown>
          </article>
        </CardContent>
      </Card>
    </div>
  );
}
