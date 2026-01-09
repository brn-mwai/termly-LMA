'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TableauEmbed } from '@/components/analytics/tableau-embed';
import { DashboardSelector } from '@/components/analytics/dashboard-selector';
import { RefreshButton } from '@/components/analytics/refresh-button';
import { DASHBOARDS, DashboardKey } from '@/lib/tableau/config';
import { Badge } from '@/components/ui/badge';
import { Info } from '@phosphor-icons/react';

export default function AnalyticsPage() {
  const [activeDashboard, setActiveDashboard] = useState<DashboardKey>('portfolioOverview');
  const [loanId, setLoanId] = useState<string>('');
  const [loans, setLoans] = useState<any[]>([]);

  const dashboard = DASHBOARDS[activeDashboard];

  useEffect(() => {
    // Fetch loans for the loan selector
    fetch('/api/loans?limit=50')
      .then((res) => res.json())
      .then((data) => setLoans(data.data || []))
      .catch(() => setLoans([]));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Analytics
          </h1>
          <p className="text-muted-foreground">
            Interactive portfolio dashboards powered by Tableau
          </p>
        </div>
        <div className="flex items-center gap-4">
          <RefreshButton />
        </div>
      </div>

      {/* Dashboard Tabs */}
      <Card>
        <CardContent className="p-0">
          <DashboardSelector active={activeDashboard} onChange={setActiveDashboard} />
        </CardContent>
      </Card>

      {/* Loan ID selector for Loan Detail dashboard */}
      {activeDashboard === 'loanDetail' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Select Loan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="loan">Choose a loan to analyze</Label>
                <Select value={loanId} onValueChange={setLoanId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a loan from your portfolio" />
                  </SelectTrigger>
                  <SelectContent>
                    {loans.map((loan: any) => (
                      <SelectItem key={loan.id} value={loan.id}>
                        {loan.borrowers?.name || 'Unknown'} - {loan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <span className="text-sm text-muted-foreground">or</span>
              <div className="space-y-2">
                <Label htmlFor="loan_id">Enter Loan ID</Label>
                <Input
                  id="loan_id"
                  placeholder="Enter loan ID..."
                  value={loanId}
                  onChange={(e) => setLoanId(e.target.value)}
                  className="w-48"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard Description */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="flex items-center gap-3 py-4">
          <Info className="h-5 w-5 text-primary" />
          <div>
            <span className="font-semibold">{dashboard.name}:</span>{' '}
            <span className="text-muted-foreground">{dashboard.description}</span>
          </div>
        </CardContent>
      </Card>

      {/* Tableau Dashboard */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <TableauEmbed
            dashboard={activeDashboard}
            parameters={
              loanId && activeDashboard === 'loanDetail'
                ? { loan_id: loanId }
                : undefined
            }
          />
        </CardContent>
      </Card>

      {/* Tableau Hackathon Badge */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <Badge variant="outline" className="text-xs">
          Tableau Hackathon 2025
        </Badge>
        <span>Powered by Tableau Cloud</span>
        <span>|</span>
        <span>Embedding API v3</span>
        <span>|</span>
        <span>Connected Apps (Direct Trust)</span>
      </div>
    </div>
  );
}
