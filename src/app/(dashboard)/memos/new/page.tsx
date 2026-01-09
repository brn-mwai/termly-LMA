'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';

const templates = [
  { value: 'quarterly_review', label: 'Quarterly Review' },
  { value: 'breach_analysis', label: 'Breach Analysis' },
  { value: 'watchlist_assessment', label: 'Watchlist Assessment' },
  { value: 'annual_review', label: 'Annual Review' },
];

export default function NewMemoPage() {
  const router = useRouter();
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const [loanId, setLoanId] = useState('');
  const [title, setTitle] = useState('');
  const [template, setTemplate] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch('/api/loans?limit=50')
      .then((res) => res.json())
      .then((data) => setLoans(data.data || []))
      .catch(() => setLoans([]));
  }, []);

  async function handleGenerate() {
    if (!loanId) {
      setError('Please select a loan first');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const res = await fetch('/api/memos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loan_id: loanId,
          title: title || `${templates.find((t) => t.value === template)?.label || 'Credit Memo'}`,
          template,
          generate_ai: true,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate memo');

      const { data } = await res.json();
      router.push(`/memos/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!loanId || !title || !content) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/memos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loan_id: loanId,
          title,
          content,
          generate_ai: false,
        }),
      });

      if (!res.ok) throw new Error('Failed to create memo');

      const { data } = await res.json();
      router.push(`/memos/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create memo');
    } finally {
      setLoading(false);
    }
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Credit Memo</h1>
          <p className="text-muted-foreground">
            Create a memo manually or generate with AI
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* AI Generation Card */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate with AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Let AI analyze the loan data and generate a professional credit memo automatically.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Select Loan *</Label>
              <Select value={loanId} onValueChange={setLoanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a loan" />
                </SelectTrigger>
                <SelectContent>
                  {loans.map((loan: any) => (
                    <SelectItem key={loan.id} value={loan.id}>
                      {loan.borrowers?.name} - {loan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleGenerate}
                disabled={generating || !loanId}
                className="w-full"
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {generating ? 'Generating...' : 'Generate Memo'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Creation */}
      <Card>
        <CardHeader>
          <CardTitle>Or Write Manually</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="loan">Loan *</Label>
                <Select value={loanId} onValueChange={setLoanId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a loan" />
                  </SelectTrigger>
                  <SelectContent>
                    {loans.map((loan: any) => (
                      <SelectItem key={loan.id} value={loan.id}>
                        {loan.borrowers?.name} - {loan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Q4 2025 Quarterly Review"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your credit memo content here..."
                rows={15}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/memos">Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Memo
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
