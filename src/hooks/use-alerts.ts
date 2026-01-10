import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';

export interface Alert {
  id: string;
  loan_id: string;
  loan?: {
    id: string;
    name: string;
  };
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  acknowledged: boolean;
  created_at: string;
}

export interface AlertFilters {
  severity?: string;
  acknowledged?: boolean;
}

async function fetchAlerts(filters?: AlertFilters): Promise<Alert[]> {
  const params = new URLSearchParams();
  if (filters?.severity) params.set('severity', filters.severity);
  if (filters?.acknowledged !== undefined) {
    params.set('acknowledged', String(filters.acknowledged));
  }

  const res = await fetch(`/api/alerts?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  const { data } = await res.json();
  return data;
}

export function useAlerts(filters?: AlertFilters) {
  return useQuery({
    queryKey: queryKeys.alerts.list(filters as Record<string, unknown>),
    queryFn: () => fetchAlerts(filters),
  });
}

export function useUnacknowledgedAlerts() {
  return useQuery({
    queryKey: queryKeys.alerts.unacknowledged(),
    queryFn: () => fetchAlerts({ acknowledged: false }),
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acknowledged: true }),
      });
      if (!res.ok) throw new Error('Failed to acknowledge alert');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function useBulkAcknowledgeAlerts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch('/api/alerts/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, acknowledged: true }),
      });
      if (!res.ok) throw new Error('Failed to acknowledge alerts');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}
