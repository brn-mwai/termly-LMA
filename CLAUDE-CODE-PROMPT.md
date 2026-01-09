# Claude Code Instructions: Build Termly in One Day

## Context

You have access to the Termly project at `C:\Users\Windows\OneDrive\Documents\termly\termly\`. This is an AI-powered loan covenant monitoring platform being built for two hackathons:
- **Tableau Hackathon** ($45K prizes) - Due Jan 14, 2025 ⭐ PRIMARY TARGET
- **LMA Innovation Challenge** ($15K prizes)

The marketing landing page is already complete. Your job is to build the entire backend and dashboard application in one session.

---

## Project Overview

**Termly** transforms loan covenant monitoring from 4-8 hours of manual work to 15 minutes using AI.

**Tech Stack:**
- Next.js 14 (App Router) + TypeScript
- Supabase (PostgreSQL, Auth, Storage, Realtime)
- Clerk (Authentication)
- Anthropic Claude (Document extraction)
- Groq Llama 3 (NLP chat)
- **Tableau Cloud (Embedded dashboards)** ⭐ CRITICAL FOR HACKATHON
- Vercel (Deployment)

---

## IMPORTANT: Tableau Hackathon Requirements

This project is primarily for the **Tableau Hackathon**. We MUST demonstrate:

1. **Tableau Cloud Integration** - Embedded interactive dashboards
2. **Tableau Developer Platform APIs**:
   - Embedding API v3 (JWT authentication)
   - REST API (programmatic access)
   - Connected Apps (Direct Trust)

3. **Four Dashboards to Embed**:
   - Portfolio Overview (KPIs, sector breakdown, trends)
   - Covenant Monitor (watchlist, headroom, status heatmap)
   - Loan Detail (parameterized by loan_id)
   - Risk Heatmap (sector × covenant matrix)

4. **Prize Categories We're Targeting**:
   - Grand Prize ($17K) - Most innovative solution
   - Best Actionable Analytics ($7K) - Data → Action workflow
   - Best Product Extensibility ($7K) - API integrations

---

## Documentation Available

Read these files FIRST before writing any code:

1. **`docs/PROJECT-STRUCTURE.md`** - Complete directory structure, all files needed
2. **`docs/guides/BACKEND-SETUP.md`** - Database schema, API specs, AI prompts, **Tableau integration details**
3. **`docs/guides/ONE-DAY-BUILD.md`** - Build schedule and quick reference
4. **`docs/guides/ONE-DAY-BUILD-PART2.md`** - All code implementations

---

## Build Order (Follow This Exactly)

### Phase 1: Setup (30 min)

1. Install all dependencies:
```bash
npm install @supabase/supabase-js @supabase/ssr @clerk/nextjs zod date-fns uuid jsonwebtoken @anthropic-ai/sdk groq-sdk @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs @radix-ui/react-select @radix-ui/react-tooltip @radix-ui/react-popover @radix-ui/react-avatar @radix-ui/react-progress lucide-react class-variance-authority clsx tailwind-merge react-hook-form @hookform/resolvers react-dropzone @tanstack/react-table

npm install -D @types/uuid @types/jsonwebtoken supabase
```

2. Create directory structure:
```bash
mkdir -p src/app/\(dashboard\)/{dashboard,loans,loans/\[id\],loans/new,documents,documents/\[id\],documents/upload,alerts,alerts/\[id\],analytics,memos,memos/\[id\],memos/new,audit,settings}
mkdir -p src/app/api/{loans,loans/\[id\],documents,documents/\[id\],documents/\[id\]/extract,covenants,covenants/\[id\],alerts,alerts/\[id\],memos,memos/\[id\],chat,audit,tableau/token,tableau/refresh,webhooks/clerk}
mkdir -p src/lib/{supabase,ai,ai/prompts,tableau,services,utils,hooks,validations}
mkdir -p src/components/{ui,layout,dashboard,loans,documents,alerts,analytics,memos,chat,audit,shared}
mkdir -p src/types
mkdir -p supabase/migrations
```

3. Create utility files:
   - `src/lib/utils/cn.ts` - Class name merger
   - `src/lib/utils/format.ts` - Formatting helpers
   - `src/lib/utils/api.ts` - API response helpers
   - `src/lib/constants.ts` - App constants

### Phase 2: Database (30 min)

1. Create `supabase/migrations/001_initial_schema.sql` with all 11 tables (see BACKEND-SETUP.md)
2. Create Supabase clients:
   - `src/lib/supabase/client.ts` - Browser client
   - `src/lib/supabase/server.ts` - Server client  
   - `src/lib/supabase/admin.ts` - Admin client

**Note:** User needs to manually run the migration in Supabase SQL Editor.

### Phase 3: Authentication (30 min)

1. Update `src/app/layout.tsx` - Add ClerkProvider
2. Create `src/middleware.ts` - Auth middleware
3. Create login/signup pages:
   - `src/app/(marketing)/login/[[...sign-in]]/page.tsx`
   - `src/app/(marketing)/signup/[[...sign-up]]/page.tsx`
4. Create `src/app/api/webhooks/clerk/route.ts` - User sync webhook

### Phase 4: Dashboard Layout (45 min)

1. Create `src/app/(dashboard)/layout.tsx` - Dashboard wrapper
2. Create `src/components/layout/sidebar.tsx` - Navigation sidebar
3. Create `src/components/layout/header.tsx` - Top header with search and user
4. Create `src/app/(dashboard)/dashboard/page.tsx` - Main dashboard
5. Create dashboard components:
   - `src/components/dashboard/stats-cards.tsx`
   - `src/components/dashboard/recent-alerts.tsx`
   - `src/components/dashboard/upcoming-tests.tsx`

### Phase 5: Loans Feature (1.5 hrs)

1. Create APIs:
   - `src/app/api/loans/route.ts` - GET (list), POST (create)
   - `src/app/api/loans/[id]/route.ts` - GET, PATCH, DELETE

2. Create pages:
   - `src/app/(dashboard)/loans/page.tsx` - Loans list
   - `src/app/(dashboard)/loans/new/page.tsx` - New loan form
   - `src/app/(dashboard)/loans/[id]/page.tsx` - Loan detail

3. Create components:
   - `src/components/loans/loan-table.tsx`
   - `src/components/loans/loan-form.tsx`

### Phase 6: Documents & AI Extraction (2 hrs)

1. Create AI clients:
   - `src/lib/ai/anthropic.ts` - Anthropic client
   - `src/lib/ai/extraction.ts` - Extraction service

2. Create APIs:
   - `src/app/api/documents/route.ts` - GET, POST (upload)
   - `src/app/api/documents/[id]/route.ts` - GET, DELETE
   - `src/app/api/documents/[id]/extract/route.ts` - POST (trigger extraction)

3. Create pages:
   - `src/app/(dashboard)/documents/page.tsx` - Documents list
   - `src/app/(dashboard)/documents/upload/page.tsx` - Upload page
   - `src/app/(dashboard)/documents/[id]/page.tsx` - Document detail + extraction

4. Create components:
   - `src/components/documents/upload-zone.tsx` (use react-dropzone)

### Phase 7: Alerts (1 hr)

1. Create APIs:
   - `src/app/api/alerts/route.ts` - GET, POST
   - `src/app/api/alerts/[id]/route.ts` - GET, PATCH

2. Create pages:
   - `src/app/(dashboard)/alerts/page.tsx` - Alerts list
   - `src/app/(dashboard)/alerts/[id]/page.tsx` - Alert detail

3. Create components:
   - `src/components/alerts/alert-table.tsx`

### Phase 8: AI Chat Assistant (1 hr)

1. Create:
   - `src/lib/ai/groq.ts` - Groq client
   - `src/lib/ai/prompts/chat-system.ts` - System prompt
   - `src/app/api/chat/route.ts` - Chat API

2. Create `src/components/chat/chat-assistant.tsx` - Floating chat widget

3. Add `<ChatAssistant />` to dashboard layout

### Phase 9: Tableau Integration ⭐ CRITICAL (1.5 hrs)

This phase is CRITICAL for the Tableau Hackathon. Implement thoroughly.

#### 9.1 Tableau Library Files

**`src/lib/tableau/config.ts`** - Dashboard configurations:
```typescript
export const TABLEAU_CONFIG = {
  serverUrl: process.env.TABLEAU_SERVER_URL!,
  siteId: process.env.TABLEAU_SITE_ID!,
  tokenName: process.env.TABLEAU_TOKEN_NAME!,
  tokenSecret: process.env.TABLEAU_TOKEN_SECRET!,
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
    parameters: ['loan_id'], // Supports URL parameters
  },
  riskHeatmap: {
    id: 'riskHeatmap',
    name: 'Risk Heatmap',
    path: 'TermlyDashboards/RiskHeatmap',
    description: 'Portfolio-wide risk visualization by sector and covenant type',
  },
} as const;

export type DashboardKey = keyof typeof DASHBOARDS;
```

**`src/lib/tableau/embed.ts`** - JWT Token Generation:
```typescript
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { TABLEAU_CONFIG, DASHBOARDS, DashboardKey } from './config';

interface EmbedTokenResult {
  token: string;
  expiresAt: Date;
  viewUrl: string;
  dashboardName: string;
}

export function generateEmbedToken(
  userEmail: string,
  dashboardKey: DashboardKey,
  parameters?: Record<string, string>
): EmbedTokenResult {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 10 * 60; // 10 minutes

  const payload = {
    iss: TABLEAU_CONFIG.tokenName,
    sub: userEmail,
    aud: 'tableau',
    exp,
    jti: uuidv4(),
    scp: ['tableau:views:embed', 'tableau:views:embed_authoring'],
  };

  const token = jwt.sign(payload, TABLEAU_CONFIG.tokenSecret, {
    algorithm: 'HS256',
    header: {
      alg: 'HS256',
      typ: 'JWT',
      kid: TABLEAU_CONFIG.tokenName,
      iss: TABLEAU_CONFIG.tokenName,
    },
  });

  const dashboard = DASHBOARDS[dashboardKey];
  let viewUrl = `${TABLEAU_CONFIG.serverUrl}/t/${TABLEAU_CONFIG.siteId}/views/${dashboard.path}`;

  // Add parameters if provided (e.g., for loan detail dashboard)
  if (parameters && Object.keys(parameters).length > 0) {
    const params = new URLSearchParams(parameters);
    viewUrl += `?${params.toString()}`;
  }

  return {
    token,
    expiresAt: new Date(exp * 1000),
    viewUrl,
    dashboardName: dashboard.name,
  };
}
```

**`src/lib/tableau/rest-api.ts`** - Tableau REST API Client:
```typescript
import { TABLEAU_CONFIG } from './config';
import { generateEmbedToken } from './embed';

interface TableauSession {
  token: string;
  siteId: string;
  userId: string;
}

export class TableauRestAPI {
  private session: TableauSession | null = null;

  async authenticate(userEmail: string): Promise<TableauSession> {
    const { token } = generateEmbedToken(userEmail, 'portfolioOverview');
    
    const response = await fetch(
      `${TABLEAU_CONFIG.serverUrl}/api/3.21/auth/signin`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentials: {
            jwt: token,
            site: { contentUrl: TABLEAU_CONFIG.siteId },
          },
        }),
      }
    );

    const data = await response.json();
    
    this.session = {
      token: data.credentials.token,
      siteId: data.credentials.site.id,
      userId: data.credentials.user.id,
    };

    return this.session;
  }

  async getWorkbooks(): Promise<any[]> {
    if (!this.session) throw new Error('Not authenticated');
    
    const response = await fetch(
      `${TABLEAU_CONFIG.serverUrl}/api/3.21/sites/${this.session.siteId}/workbooks`,
      {
        headers: { 'X-Tableau-Auth': this.session.token },
      }
    );

    const data = await response.json();
    return data.workbooks?.workbook || [];
  }

  async refreshDataSource(datasourceId: string): Promise<void> {
    if (!this.session) throw new Error('Not authenticated');

    await fetch(
      `${TABLEAU_CONFIG.serverUrl}/api/3.21/sites/${this.session.siteId}/datasources/${datasourceId}/refresh`,
      {
        method: 'POST',
        headers: { 'X-Tableau-Auth': this.session.token },
      }
    );
  }

  async getViewImage(viewId: string): Promise<Buffer> {
    if (!this.session) throw new Error('Not authenticated');

    const response = await fetch(
      `${TABLEAU_CONFIG.serverUrl}/api/3.21/sites/${this.session.siteId}/views/${viewId}/image`,
      {
        headers: { 'X-Tableau-Auth': this.session.token },
      }
    );

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

export const tableauAPI = new TableauRestAPI();
```

#### 9.2 Tableau API Routes

**`src/app/api/tableau/token/route.ts`**:
```typescript
import { auth, currentUser } from '@clerk/nextjs/server';
import { generateEmbedToken, DASHBOARDS, DashboardKey } from '@/lib/tableau/embed';
import { successResponse, errorResponse } from '@/lib/utils/api';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress;
    if (!email) return errorResponse('BAD_REQUEST', 'Email required', 400);

    const body = await request.json();
    const { dashboard, parameters } = body;

    if (!dashboard || !DASHBOARDS[dashboard as DashboardKey]) {
      return errorResponse('BAD_REQUEST', 'Invalid dashboard', 400);
    }

    const result = generateEmbedToken(email, dashboard as DashboardKey, parameters);

    return successResponse({
      token: result.token,
      expiresAt: result.expiresAt.toISOString(),
      viewUrl: result.viewUrl,
      dashboardName: result.dashboardName,
    });
  } catch (error) {
    console.error('Tableau token error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to generate token', 500);
  }
}
```

**`src/app/api/tableau/refresh/route.ts`**:
```typescript
import { auth, currentUser } from '@clerk/nextjs/server';
import { tableauAPI } from '@/lib/tableau/rest-api';
import { successResponse, errorResponse } from '@/lib/utils/api';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress;
    if (!email) return errorResponse('BAD_REQUEST', 'Email required', 400);

    const { datasourceId } = await request.json();
    if (!datasourceId) return errorResponse('BAD_REQUEST', 'Datasource ID required', 400);

    await tableauAPI.authenticate(email);
    await tableauAPI.refreshDataSource(datasourceId);

    return successResponse({ refreshed: true });
  } catch (error) {
    console.error('Tableau refresh error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to refresh', 500);
  }
}
```

**`src/app/api/tableau/workbooks/route.ts`**:
```typescript
import { auth, currentUser } from '@clerk/nextjs/server';
import { tableauAPI } from '@/lib/tableau/rest-api';
import { successResponse, errorResponse } from '@/lib/utils/api';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress;
    if (!email) return errorResponse('BAD_REQUEST', 'Email required', 400);

    await tableauAPI.authenticate(email);
    const workbooks = await tableauAPI.getWorkbooks();

    return successResponse(workbooks);
  } catch (error) {
    console.error('Tableau workbooks error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to get workbooks', 500);
  }
}
```

#### 9.3 Analytics Page with Dashboard Tabs

**`src/app/(dashboard)/analytics/page.tsx`**:
```typescript
'use client';

import { useState } from 'react';
import { TableauEmbed } from '@/components/analytics/tableau-embed';
import { DashboardSelector } from '@/components/analytics/dashboard-selector';
import { RefreshButton } from '@/components/analytics/refresh-button';
import { DASHBOARDS } from '@/lib/tableau/config';

export default function AnalyticsPage() {
  const [activeDashboard, setActiveDashboard] = useState<keyof typeof DASHBOARDS>('portfolioOverview');
  const [loanId, setLoanId] = useState<string | null>(null);

  const dashboard = DASHBOARDS[activeDashboard];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Interactive portfolio dashboards powered by Tableau
          </p>
        </div>
        <div className="flex items-center gap-4">
          <RefreshButton />
        </div>
      </div>

      {/* Dashboard Tabs */}
      <DashboardSelector 
        active={activeDashboard} 
        onChange={setActiveDashboard}
      />

      {/* Loan ID selector for Loan Detail dashboard */}
      {activeDashboard === 'loanDetail' && (
        <div className="rounded-lg bg-white p-4 shadow">
          <label className="block text-sm font-medium text-gray-700">
            Select Loan
          </label>
          <input
            type="text"
            placeholder="Enter Loan ID or select from list..."
            value={loanId || ''}
            onChange={(e) => setLoanId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      )}

      {/* Dashboard Description */}
      <div className="rounded-lg bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <strong>{dashboard.name}:</strong> {dashboard.description}
        </p>
      </div>

      {/* Tableau Dashboard */}
      <div className="rounded-lg bg-white shadow overflow-hidden">
        <TableauEmbed 
          dashboard={activeDashboard}
          parameters={loanId && activeDashboard === 'loanDetail' ? { loan_id: loanId } : undefined}
        />
      </div>

      {/* Tableau Hackathon Badge */}
      <div className="text-center text-xs text-gray-400">
        Powered by Tableau Cloud • Embedding API v3 • Connected Apps (Direct Trust)
      </div>
    </div>
  );
}
```

#### 9.4 Tableau Components

**`src/components/analytics/dashboard-selector.tsx`**:
```typescript
'use client';

import { DASHBOARDS, DashboardKey } from '@/lib/tableau/config';
import { cn } from '@/lib/utils/cn';
import { BarChart3, Shield, FileText, Grid3X3 } from 'lucide-react';

const icons: Record<DashboardKey, any> = {
  portfolioOverview: BarChart3,
  covenantMonitor: Shield,
  loanDetail: FileText,
  riskHeatmap: Grid3X3,
};

interface DashboardSelectorProps {
  active: DashboardKey;
  onChange: (dashboard: DashboardKey) => void;
}

export function DashboardSelector({ active, onChange }: DashboardSelectorProps) {
  return (
    <div className="flex gap-2 border-b border-gray-200">
      {Object.entries(DASHBOARDS).map(([key, dashboard]) => {
        const Icon = icons[key as DashboardKey];
        const isActive = active === key;

        return (
          <button
            key={key}
            onClick={() => onChange(key as DashboardKey)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              isActive
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            <Icon className="h-4 w-4" />
            {dashboard.name}
          </button>
        );
      })}
    </div>
  );
}
```

**`src/components/analytics/tableau-embed.tsx`**:
```typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { DashboardKey } from '@/lib/tableau/config';

interface TableauEmbedProps {
  dashboard: DashboardKey;
  parameters?: Record<string, string>;
  height?: number;
}

export function TableauEmbed({ dashboard, parameters, height = 700 }: TableauEmbedProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const vizRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    async function loadTableau() {
      try {
        setLoading(true);
        setError(null);

        // Get embed token from API
        const res = await fetch('/api/tableau/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dashboard, parameters }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error?.message || 'Failed to get token');
        }

        const { data } = await res.json();

        if (!mounted) return;

        // Load Tableau Embedding API script
        if (!document.querySelector('script[src*="tableau.embedding"]')) {
          const script = document.createElement('script');
          script.src = 'https://embedding.tableauusercontent.com/tableau.embedding.3.latest.min.js';
          script.type = 'module';
          document.head.appendChild(script);

          await new Promise((resolve) => {
            script.onload = resolve;
          });
        }

        if (!mounted || !containerRef.current) return;

        // Clear previous viz
        containerRef.current.innerHTML = '';

        // Create tableau-viz element
        const viz = document.createElement('tableau-viz');
        viz.setAttribute('src', data.viewUrl);
        viz.setAttribute('token', data.token);
        viz.setAttribute('toolbar', 'hidden');
        viz.setAttribute('hide-tabs', 'true');
        viz.style.width = '100%';
        viz.style.height = `${height}px`;

        // Listen for load complete
        viz.addEventListener('firstinteractive', () => {
          if (mounted) setLoading(false);
        });

        viz.addEventListener('vizloaderror', (e: any) => {
          if (mounted) {
            setError(e.detail?.message || 'Failed to load visualization');
            setLoading(false);
          }
        });

        containerRef.current.appendChild(viz);
        vizRef.current = viz;

      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load');
          setLoading(false);
        }
      }
    }

    loadTableau();

    return () => {
      mounted = false;
    };
  }, [dashboard, parameters, height]);

  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-red-600">
        <AlertCircle className="h-12 w-12" />
        <p className="font-medium">Failed to load dashboard</p>
        <p className="text-sm text-gray-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative" style={{ minHeight: height }}>
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-4 text-sm text-gray-500">Loading Tableau dashboard...</p>
        </div>
      )}
      <div ref={containerRef} className={loading ? 'opacity-0' : 'opacity-100'} />
    </div>
  );
}
```

**`src/components/analytics/refresh-button.tsx`**:
```typescript
'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export function RefreshButton() {
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    // In production, this would refresh the Tableau data source
    await new Promise((resolve) => setTimeout(resolve, 1000));
    window.location.reload();
    setRefreshing(false);
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={refreshing}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
    >
      <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
      {refreshing ? 'Refreshing...' : 'Refresh Data'}
    </button>
  );
}
```

### Phase 10: Memos & Audit (1 hr)

1. Create APIs:
   - `src/app/api/memos/route.ts` - GET, POST (generate)
   - `src/app/api/memos/[id]/route.ts` - GET, PATCH
   - `src/app/api/audit/route.ts` - GET

2. Create pages:
   - `src/app/(dashboard)/memos/page.tsx` - Memos list
   - `src/app/(dashboard)/memos/new/page.tsx` - Generate memo
   - `src/app/(dashboard)/memos/[id]/page.tsx` - Memo detail
   - `src/app/(dashboard)/audit/page.tsx` - Audit trail

### Phase 11: Final Cleanup

1. Add loading.tsx and error.tsx to key routes
2. Ensure all TypeScript types are correct
3. Test build: `npm run build`
4. Fix any errors

---

## Environment Variables Needed

Create `.env.local` with:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (user will fill in)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Clerk (user will fill in)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# AI (user will fill in)
ANTHROPIC_API_KEY=
GROQ_API_KEY=

# Tableau ⭐ CRITICAL
TABLEAU_SERVER_URL=https://us-west-2b.online.tableau.com
TABLEAU_SITE_ID=
TABLEAU_TOKEN_NAME=
TABLEAU_TOKEN_SECRET=
```

---

## Tableau Setup Guide (For User)

After the code is built, the user needs to:

### 1. Create Tableau Cloud Account
- Go to https://www.tableau.com/products/cloud
- Start free trial or use existing account

### 2. Connect Tableau to Supabase
In Tableau Desktop:
1. Connect → PostgreSQL
2. Server: `db.xxxx.supabase.co`
3. Port: `5432`
4. Database: `postgres`
5. Username: `postgres`
6. Password: (from Supabase)
7. Require SSL: Yes

### 3. Create Connected App
In Tableau Cloud → Settings → Connected Apps:
1. Create new → Direct Trust
2. Name: `termly-embed`
3. Enable
4. Create Secret
5. Copy: Token Name + Token Secret

### 4. Build 4 Dashboards
Create workbooks with these views:

**Portfolio Overview:**
- KPI tiles: Total Loans, Compliant %, Exposure
- Pie chart: Status distribution
- Bar chart: Exposure by sector
- Line chart: Trend over time

**Covenant Monitor:**
- Table: Watchlist (low headroom loans)
- Histogram: Headroom distribution
- Stacked bar: Status by covenant type

**Loan Detail:**
- Parameter: loan_id (filter)
- Header: Borrower info
- Line chart: Covenant trend
- Table: Financial periods

**Risk Heatmap:**
- Matrix: Sector × Covenant Type
- Color: Red/Yellow/Green by headroom
- Treemap: Exposure at risk

### 5. Publish to Tableau Cloud
1. Server → Publish Workbook
2. Project: Create "TermlyDashboards"
3. Name views exactly as in DASHBOARDS config

---

## Key Implementation Notes

### 1. Supabase Server Client Pattern
```typescript
// Always use this pattern in Server Components and API routes
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.from('loans').select('*');
}
```

### 2. Getting User's Org ID
```typescript
// Always get org_id through the users table
const { data: user } = await supabase
  .from('users')
  .select('org_id')
  .eq('clerk_id', userId)
  .single();

// Then filter queries by org_id
const { data: loans } = await supabase
  .from('loans')
  .select('*')
  .eq('org_id', user.org_id);
```

### 3. API Route Pattern
```typescript
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Auth required', 401);
    
    const supabase = await createClient();
    // ... query logic
    
    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
```

### 4. Dynamic Route Params (Next.js 15)
```typescript
// params is now a Promise in Next.js 15
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}
```

---

## Files Summary

After completion, you should have created approximately:

- **11 database tables** (via migration)
- **~18 API routes** (including 3 Tableau routes)
- **~15 pages**
- **~25 components** (including 4 Tableau components)
- **~15 utility/lib files** (including 3 Tableau files)

Total: **~70 files**

---

## Success Criteria

- [ ] Can sign up and see dashboard
- [ ] Can create loans
- [ ] Can upload documents
- [ ] Can trigger AI extraction (needs API key)
- [ ] Can see alerts
- [ ] Chat assistant responds
- [ ] **Analytics page loads with dashboard tabs** ⭐
- [ ] **Tableau embed component renders** ⭐
- [ ] **Can switch between 4 dashboards** ⭐
- [ ] **Loan Detail dashboard accepts loan_id parameter** ⭐
- [ ] Can generate memos
- [ ] Audit trail shows activity
- [ ] `npm run build` succeeds with no errors

---

## Hackathon Submission Requirements

For the Tableau Hackathon, we need:

1. **Text description** - Features and functionality
2. **1-2 sentence pitch:**
   > "Termly uses AI to extract covenant data from complex loan documents and surfaces actionable insights through embedded Tableau dashboards, transforming 4-8 hours of manual work into 15 minutes."

3. **Demo video (5 min)** showing:
   - Document upload → AI extraction
   - All 4 Tableau dashboards
   - Alert → Action workflow
   - Chat assistant

4. **GitHub access** to @kglover29 and testing@devpost.com

5. **APIs Used:**
   - Tableau Embedding API v3
   - Tableau REST API
   - Tableau Connected Apps (JWT)
   - Anthropic Claude API
   - Groq API
   - Supabase

---

## Start Now

Begin with Phase 1. Read the documentation files first, then create each file systematically. Use the code from ONE-DAY-BUILD-PART2.md as reference.

**Pay special attention to Phase 9 (Tableau)** - this is critical for the hackathon!

After each phase, verify it works before moving to the next.

Good luck! 🚀
