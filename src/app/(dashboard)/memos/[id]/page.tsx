'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, Edit, Trash2, Loader2, FileDown, User, Calendar } from 'lucide-react';
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
        setMemo(mockMemo);
      }
    } catch {
      setMemo(mockMemo);
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
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/memos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl tracking-tight">{memo.title}</h1>
            {memo.generated_by_ai && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Generated
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {memo.loans?.borrowers?.name} - {memo.loans?.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileDown className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
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
          <Calendar className="h-4 w-4" />
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

const mockMemo = {
  id: '1',
  title: 'Q4 2025 Quarterly Review - Acme Corporation',
  content: `## Executive Summary

Acme Corporation has experienced deteriorating financial performance in Q4 2025, resulting in a breach of the Total Leverage Ratio covenant. The leverage ratio increased to 5.2x, exceeding the maximum threshold of 5.0x. Immediate engagement with the borrower is recommended to discuss remediation options.

## Borrower Overview

**Company:** Acme Corporation
**Industry:** Manufacturing
**Facility:** Senior Term Loan
**Commitment:** $250M
**Outstanding:** $225M
**Maturity:** June 15, 2028

## Financial Performance

Revenue declined 8% YoY to $312.5M, primarily driven by:
- Reduced demand in key markets
- Supply chain disruptions impacting production
- Increased competition from overseas manufacturers

EBITDA decreased to $43.3M from $52.5M in Q3 2025, representing a 17.5% decline.

## Covenant Compliance Analysis

| Covenant | Threshold | Actual | Headroom | Status |
|----------|-----------|--------|----------|--------|
| Total Leverage | ≤ 5.0x | 5.2x | -4.0% | **BREACH** |
| Interest Coverage | ≥ 2.0x | 2.8x | +40.0% | Compliant |
| Fixed Charge Coverage | ≥ 1.25x | 1.35x | +8.0% | Warning |

## Risk Assessment

**Key Risks:**
- Continued revenue decline could further deteriorate leverage metrics
- Fixed Charge Coverage trending toward warning threshold
- Industry headwinds expected to persist through H1 2026

**Mitigating Factors:**
- Strong liquidity position
- Cost reduction initiatives underway
- Diversified customer base

## Recommendations

1. **Immediate:** Engage borrower to discuss Q4 results and remediation plan
2. **Short-term:** Request 13-week cash flow forecast
3. **Ongoing:** Increase monitoring frequency to monthly
4. **Consider:** Placement on watchlist pending remediation progress`,
  generated_by_ai: true,
  created_at: '2026-01-06T10:30:00Z',
  loans: { id: '1', name: 'Senior Term Loan', borrowers: { name: 'Acme Corporation', industry: 'Manufacturing' } },
  users: { full_name: 'John Smith', email: 'john@example.com' },
};
