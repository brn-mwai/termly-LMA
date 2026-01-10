import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';

export interface Loan {
  id: string;
  name: string;
  borrower_id: string;
  borrower?: {
    id: string;
    name: string;
    industry: string;
    rating: string;
  };
  facility_type: string;
  commitment_amount: number;
  outstanding_amount: number;
  status: 'active' | 'matured' | 'defaulted';
  maturity_date: string;
  created_at: string;
}

export interface LoanFilters {
  status?: string;
  search?: string;
}

async function fetchLoans(filters?: LoanFilters): Promise<Loan[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.search) params.set('search', filters.search);

  const res = await fetch(`/api/loans?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch loans');
  const { data } = await res.json();
  return data;
}

async function fetchLoan(id: string): Promise<Loan> {
  const res = await fetch(`/api/loans/${id}`);
  if (!res.ok) throw new Error('Failed to fetch loan');
  const { data } = await res.json();
  return data;
}

export function useLoans(filters?: LoanFilters) {
  return useQuery({
    queryKey: queryKeys.loans.list(filters as Record<string, unknown>),
    queryFn: () => fetchLoans(filters),
  });
}

export function useLoan(id: string) {
  return useQuery({
    queryKey: queryKeys.loans.detail(id),
    queryFn: () => fetchLoan(id),
    enabled: !!id,
  });
}

export function useRunCovenantTest(loanId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/loans/${loanId}/test`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to run covenant test');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loans.detail(loanId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
    },
  });
}
