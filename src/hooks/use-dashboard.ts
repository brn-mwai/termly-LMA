import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';

export interface DashboardStats {
  totalLoans: number;
  activeLoans: number;
  totalCommitment: number;
  totalOutstanding: number;
  complianceRate: number;
  covenants: {
    total: number;
    compliant: number;
    warning: number;
    breach: number;
  };
  alerts: {
    total: number;
    critical: number;
    warning: number;
    unacknowledged: number;
  };
}

export interface PortfolioHistoryPoint {
  date: string;
  commitment: number;
  outstanding: number;
}

export interface ComplianceHistoryPoint {
  date: string;
  compliant: number;
  warning: number;
  breach: number;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch('/api/loans');
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  const { data, meta } = await res.json();

  // Calculate stats from the response
  const loans = data || [];
  const totalCommitment = loans.reduce((sum: number, l: { commitment_amount: number }) => sum + (l.commitment_amount || 0), 0);
  const totalOutstanding = loans.reduce((sum: number, l: { outstanding_amount: number }) => sum + (l.outstanding_amount || 0), 0);

  return {
    totalLoans: meta?.total || loans.length,
    activeLoans: loans.filter((l: { status: string }) => l.status === 'active').length,
    totalCommitment,
    totalOutstanding,
    complianceRate: meta?.complianceRate || 0,
    covenants: meta?.covenants || { total: 0, compliant: 0, warning: 0, breach: 0 },
    alerts: meta?.alerts || { total: 0, critical: 0, warning: 0, unacknowledged: 0 },
  };
}

async function fetchPortfolioHistory(days: number): Promise<PortfolioHistoryPoint[]> {
  const res = await fetch(`/api/dashboard/portfolio-history?days=${days}`);
  if (!res.ok) throw new Error('Failed to fetch portfolio history');
  const { data } = await res.json();
  return data;
}

async function fetchComplianceHistory(days: number): Promise<ComplianceHistoryPoint[]> {
  const res = await fetch(`/api/dashboard/compliance-history?days=${days}`);
  if (!res.ok) throw new Error('Failed to fetch compliance history');
  const { data } = await res.json();
  return data;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: fetchDashboardStats,
    staleTime: 30 * 1000, // 30 seconds for dashboard data
  });
}

export function usePortfolioHistory(days: number = 30) {
  return useQuery({
    queryKey: queryKeys.dashboard.portfolioHistory(days),
    queryFn: () => fetchPortfolioHistory(days),
  });
}

export function useComplianceHistory(days: number = 30) {
  return useQuery({
    queryKey: queryKeys.dashboard.complianceHistory(days),
    queryFn: () => fetchComplianceHistory(days),
  });
}
