'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TableauEmbed, TableauEmbedRef } from '@/components/analytics/tableau-embed';
import { DashboardSelector } from '@/components/analytics/dashboard-selector';
import { RefreshButton } from '@/components/analytics/refresh-button';
import { DASHBOARDS, DashboardKey } from '@/lib/tableau/config';
import { Info } from '@phosphor-icons/react';

interface LoanOption {
  id: string;
  name: string;
  borrowers?: { name: string };
}

export default function AnalyticsPage() {
  const [activeDashboard, setActiveDashboard] = useState<DashboardKey>('portfolioOverview');
  const [loanId, setLoanId] = useState<string>('');
  const [loans, setLoans] = useState<LoanOption[]>([]);
  const tableauRef = useRef<TableauEmbedRef>(null);

  const dashboard = DASHBOARDS[activeDashboard];

  useEffect(() => {
    // Fetch loans for the loan selector
    const controller = new AbortController();
    fetch('/api/loans?limit=50', { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => setLoans(data.data || []))
      .catch(() => {
        // Ignore abort errors
      });
    return () => controller.abort();
  }, []);

  // Handle refresh button click
  const handleRefresh = useCallback(async () => {
    if (tableauRef.current) {
      await tableauRef.current.refresh();
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-normal tracking-tight">
            Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Interactive portfolio dashboards powered by Tableau
          </p>
        </div>
        <div className="flex items-center gap-4">
          <RefreshButton onRefresh={handleRefresh} />
        </div>
      </div>

      {/* Dashboard Tabs */}
      <DashboardSelector active={activeDashboard} onChange={setActiveDashboard} />

      {/* Loan ID selector for Loan Detail dashboard */}
      {activeDashboard === 'loanDetail' && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg border bg-muted/30">
          <Label className="text-sm font-medium whitespace-nowrap">Select Loan:</Label>
          <Select value={loanId} onValueChange={setLoanId}>
            <SelectTrigger className="flex-1 sm:max-w-[300px] h-9">
              <SelectValue placeholder="Choose a loan..." />
            </SelectTrigger>
            <SelectContent>
              {loans.map((loan) => (
                <SelectItem key={loan.id} value={loan.id}>
                  {loan.borrowers?.name || 'Unknown'} - {loan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground hidden sm:block">or</span>
          <Input
            placeholder="Enter loan ID..."
            value={loanId}
            onChange={(e) => setLoanId(e.target.value)}
            className="w-full sm:w-40 h-9"
          />
        </div>
      )}

      {/* Dashboard Description */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/5 border border-primary/20 text-sm">
        <Info className="h-4 w-4 text-primary shrink-0" />
        <span className="font-medium">{dashboard.name}:</span>
        <span className="text-muted-foreground">{dashboard.description}</span>
      </div>

      {/* Tableau Dashboard */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <TableauEmbed
            ref={tableauRef}
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
