// Query key factory for consistent cache key management
export const queryKeys = {
  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
    portfolioHistory: (days: number) => [...queryKeys.dashboard.all, 'portfolio-history', days] as const,
    complianceHistory: (days: number) => [...queryKeys.dashboard.all, 'compliance-history', days] as const,
  },

  // Loans
  loans: {
    all: ['loans'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.loans.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.loans.all, 'detail', id] as const,
  },

  // Alerts
  alerts: {
    all: ['alerts'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.alerts.all, 'list', filters] as const,
    unacknowledged: () => [...queryKeys.alerts.all, 'unacknowledged'] as const,
  },

  // Documents
  documents: {
    all: ['documents'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.documents.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.documents.all, 'detail', id] as const,
  },

  // Memos
  memos: {
    all: ['memos'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.memos.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.memos.all, 'detail', id] as const,
  },

  // Audit
  audit: {
    all: ['audit'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.audit.all, 'list', filters] as const,
  },
};
