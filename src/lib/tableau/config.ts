export const TABLEAU_CONFIG = {
  serverUrl: process.env.TABLEAU_SERVER_URL || 'https://us-west-2b.online.tableau.com',
  siteId: process.env.TABLEAU_SITE_ID || '',
  tokenName: process.env.TABLEAU_TOKEN_NAME || '',
  tokenSecret: process.env.TABLEAU_TOKEN_SECRET || '',
};

export const DASHBOARDS = {
  portfolioOverview: {
    id: 'portfolioOverview',
    name: 'Portfolio Overview',
    path: 'TermlyDashboards/PortfolioOverview',
    description: 'Executive summary with KPIs, exposure by sector, and compliance trends',
  },
  covenantMonitor: {
    id: 'covenantMonitor',
    name: 'Covenant Monitor',
    path: 'TermlyDashboards/CovenantMonitor',
    description: 'Watchlist of at-risk loans, headroom distribution, and status breakdown',
  },
  loanDetail: {
    id: 'loanDetail',
    name: 'Loan Detail',
    path: 'TermlyDashboards/LoanDetail',
    description: 'Deep-dive into individual loan with covenant history and financials',
    parameters: ['loan_id'],
  },
  riskHeatmap: {
    id: 'riskHeatmap',
    name: 'Risk Heatmap',
    path: 'TermlyDashboards/RiskHeatmap',
    description: 'Portfolio-wide risk visualization by sector and covenant type',
  },
} as const;

export type DashboardKey = keyof typeof DASHBOARDS;

export function isDashboardKey(key: string): key is DashboardKey {
  return key in DASHBOARDS;
}
