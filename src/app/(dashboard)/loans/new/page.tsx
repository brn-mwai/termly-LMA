'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { INDUSTRIES } from '@/lib/constants';

const facilityTypes = [
  { value: 'term_loan', label: 'Term Loan' },
  { value: 'revolver', label: 'Revolving Credit Facility' },
  { value: 'term_loan_b', label: 'Term Loan B' },
  { value: 'delayed_draw', label: 'Delayed Draw Term Loan' },
  { value: 'bridge', label: 'Bridge Loan' },
];

export default function NewLoanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      borrower_name: formData.get('borrower_name'),
      borrower_industry: formData.get('borrower_industry'),
      name: formData.get('name'),
      facility_type: formData.get('facility_type'),
      commitment_amount: parseFloat(formData.get('commitment_amount') as string),
      outstanding_amount: parseFloat(formData.get('outstanding_amount') as string) || 0,
      currency: formData.get('currency') || 'USD',
      origination_date: formData.get('origination_date'),
      maturity_date: formData.get('maturity_date'),
      interest_rate: parseFloat(formData.get('interest_rate') as string) / 100 || null,
      interest_rate_type: formData.get('interest_rate_type'),
    };

    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to create loan');
      }

      const { data: loan } = await res.json();
      router.push(`/loans/${loan.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/loans">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Loan</h1>
          <p className="text-muted-foreground">
            Create a new loan facility in your portfolio
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Borrower Information */}
        <Card>
          <CardHeader>
            <CardTitle>Borrower Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="borrower_name">Borrower Name *</Label>
              <Input
                id="borrower_name"
                name="borrower_name"
                placeholder="e.g., Acme Corporation"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="borrower_industry">Industry</Label>
              <Select name="borrower_industry">
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Loan Details */}
        <Card>
          <CardHeader>
            <CardTitle>Loan Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Facility Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Senior Term Loan"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facility_type">Facility Type *</Label>
              <Select name="facility_type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {facilityTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="commitment_amount">Commitment Amount ($) *</Label>
              <Input
                id="commitment_amount"
                name="commitment_amount"
                type="number"
                placeholder="250000000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="outstanding_amount">Outstanding Amount ($)</Label>
              <Input
                id="outstanding_amount"
                name="outstanding_amount"
                type="number"
                placeholder="225000000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select name="currency" defaultValue="USD">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="interest_rate">Interest Rate (%)</Label>
              <Input
                id="interest_rate"
                name="interest_rate"
                type="number"
                step="0.01"
                placeholder="8.75"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interest_rate_type">Rate Type</Label>
              <Input
                id="interest_rate_type"
                name="interest_rate_type"
                placeholder="e.g., SOFR + 350bps"
              />
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle>Key Dates</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="origination_date">Origination Date *</Label>
              <Input
                id="origination_date"
                name="origination_date"
                type="date"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maturity_date">Maturity Date *</Label>
              <Input
                id="maturity_date"
                name="maturity_date"
                type="date"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/loans">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Loan
          </Button>
        </div>
      </form>
    </div>
  );
}
