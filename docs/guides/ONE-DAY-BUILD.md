# Termly - One Day Full Build Guide

> **Build the entire Termly platform in one intensive day**
> 
> This is Part 1 of the guide. See ONE-DAY-BUILD-PART2.md for the remaining phases.
> 
> Estimated total time: 12-16 hours

---

## Build Schedule Overview

| Phase | Duration | Focus |
|-------|----------|-------|
| 1. Setup | 1 hr | Dependencies, env, structure |
| 2. Database | 1 hr | Supabase, migrations |
| 3. Auth | 1 hr | Clerk, middleware |
| 4. Dashboard | 1.5 hrs | Layout, sidebar, nav |
| 5. Loans | 2 hrs | CRUD, list, detail |
| 6. Documents | 2.5 hrs | Upload, extraction |
| 7. Covenants | 2 hrs | Tests, calculations |
| 8. Chat | 1 hr | NLP assistant |
| 9. Tableau | 1.5 hrs | Embed dashboards |
| 10. Memos | 1 hr | AI generation |
| 11. Deploy | 1.5 hrs | Vercel, testing |

---

## Quick Start Commands

```bash
# 1. Install all dependencies at once
npm install @supabase/supabase-js @supabase/ssr @clerk/nextjs zod date-fns uuid jsonwebtoken @anthropic-ai/sdk groq-sdk @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs @radix-ui/react-select @radix-ui/react-tooltip @radix-ui/react-popover @radix-ui/react-avatar @radix-ui/react-progress lucide-react class-variance-authority clsx tailwind-merge react-hook-form @hookform/resolvers react-dropzone @tanstack/react-table

npm install -D @types/uuid @types/jsonwebtoken supabase

# 2. Create directory structure
mkdir -p src/app/\(dashboard\)/{dashboard,loans,loans/\[id\],loans/new,documents,documents/\[id\],documents/upload,alerts,alerts/\[id\],analytics,memos,memos/\[id\],memos/new,audit,settings}
mkdir -p src/app/api/{loans,loans/\[id\],documents,documents/\[id\],documents/\[id\]/extract,covenants,covenants/\[id\],alerts,alerts/\[id\],memos,memos/\[id\],chat,audit,tableau/token,webhooks/clerk}
mkdir -p src/lib/{supabase,ai,ai/prompts,tableau,services,utils,hooks,validations}
mkdir -p src/components/{ui,layout,dashboard,loans,documents,alerts,analytics,memos,chat,audit,shared}
mkdir -p src/types
mkdir -p supabase/migrations
```

---

## Environment Variables (.env.local)

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# AI
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...

# Tableau
TABLEAU_SERVER_URL=https://us-west-2b.online.tableau.com
TABLEAU_SITE_ID=your-site
TABLEAU_TOKEN_NAME=your-token-name
TABLEAU_TOKEN_SECRET=xxx-xxx-xxx
```

---

## Files to Create (In Order)

### Phase 1-2: Setup & Database

| File | Purpose |
|------|---------|
| `src/lib/utils/cn.ts` | Class name merger |
| `src/lib/utils/format.ts` | Formatting helpers |
| `src/lib/utils/api.ts` | API response helpers |
| `src/lib/constants.ts` | App constants |
| `src/lib/supabase/client.ts` | Browser client |
| `src/lib/supabase/server.ts` | Server client |
| `src/lib/supabase/admin.ts` | Admin client |
| `supabase/migrations/001_initial_schema.sql` | Database schema |

### Phase 3: Authentication

| File | Purpose |
|------|---------|
| `src/middleware.ts` | Clerk auth middleware |
| `src/app/(marketing)/login/[[...sign-in]]/page.tsx` | Login page |
| `src/app/(marketing)/signup/[[...sign-up]]/page.tsx` | Signup page |
| `src/app/api/webhooks/clerk/route.ts` | User sync webhook |

### Phase 4: Dashboard Layout

| File | Purpose |
|------|---------|
| `src/app/(dashboard)/layout.tsx` | Dashboard wrapper |
| `src/components/layout/sidebar.tsx` | Navigation sidebar |
| `src/components/layout/header.tsx` | Top header |
| `src/app/(dashboard)/dashboard/page.tsx` | Main dashboard |
| `src/components/dashboard/stats-cards.tsx` | KPI cards |
| `src/components/dashboard/recent-alerts.tsx` | Alert list |
| `src/components/dashboard/upcoming-tests.tsx` | Test calendar |

### Phase 5: Loans

| File | Purpose |
|------|---------|
| `src/app/api/loans/route.ts` | List/Create API |
| `src/app/api/loans/[id]/route.ts` | Get/Update/Delete API |
| `src/app/(dashboard)/loans/page.tsx` | Loans list page |
| `src/app/(dashboard)/loans/new/page.tsx` | New loan page |
| `src/app/(dashboard)/loans/[id]/page.tsx` | Loan detail page |
| `src/components/loans/loan-table.tsx` | Loans data table |
| `src/components/loans/loan-form.tsx` | Loan form |

### Phase 6: Documents & Extraction

| File | Purpose |
|------|---------|
| `src/lib/ai/anthropic.ts` | Anthropic client |
| `src/lib/ai/extraction.ts` | Extraction service |
| `src/app/api/documents/route.ts` | List/Upload API |
| `src/app/api/documents/[id]/extract/route.ts` | Extraction API |
| `src/app/(dashboard)/documents/page.tsx` | Documents list |
| `src/app/(dashboard)/documents/upload/page.tsx` | Upload page |
| `src/app/(dashboard)/documents/[id]/page.tsx` | Document detail |
| `src/components/documents/upload-zone.tsx` | Drag-drop upload |
| `src/components/documents/extraction-panel.tsx` | Extraction view |

### Phase 7: Covenants & Alerts

| File | Purpose |
|------|---------|
| `src/app/api/covenants/route.ts` | Covenants API |
| `src/app/api/covenants/[id]/route.ts` | Covenant detail API |
| `src/app/api/alerts/route.ts` | Alerts API |
| `src/app/api/alerts/[id]/route.ts` | Alert detail API |
| `src/app/(dashboard)/alerts/page.tsx` | Alerts list |
| `src/app/(dashboard)/alerts/[id]/page.tsx` | Alert detail |
| `src/components/alerts/alert-table.tsx` | Alerts table |
| `src/lib/services/calculation.service.ts` | Covenant calculations |

### Phase 8: AI Chat

| File | Purpose |
|------|---------|
| `src/lib/ai/groq.ts` | Groq client |
| `src/lib/ai/prompts/chat-system.ts` | Chat system prompt |
| `src/app/api/chat/route.ts` | Chat API |
| `src/components/chat/chat-assistant.tsx` | Chat widget |
| `src/components/chat/chat-messages.tsx` | Message list |
| `src/components/chat/chat-input.tsx` | Message input |

### Phase 9: Tableau

| File | Purpose |
|------|---------|
| `src/lib/tableau/client.ts` | Tableau API client |
| `src/lib/tableau/embed.ts` | JWT token generation |
| `src/app/api/tableau/token/route.ts` | Token API |
| `src/app/(dashboard)/analytics/page.tsx` | Analytics page |
| `src/components/analytics/tableau-embed.tsx` | Tableau iframe |

### Phase 10: Memos & Audit

| File | Purpose |
|------|---------|
| `src/lib/ai/prompts/generate-memo.ts` | Memo prompt |
| `src/app/api/memos/route.ts` | Memos API |
| `src/app/api/memos/[id]/route.ts` | Memo detail API |
| `src/app/api/audit/route.ts` | Audit API |
| `src/app/(dashboard)/memos/page.tsx` | Memos list |
| `src/app/(dashboard)/memos/new/page.tsx` | Generate memo |
| `src/app/(dashboard)/audit/page.tsx` | Audit trail |
| `src/components/memos/memo-editor.tsx` | Rich text editor |
| `src/components/audit/audit-table.tsx` | Audit table |

---

## Database Migration (Copy-Paste Ready)

Run this in Supabase SQL Editor:

```sql
-- See supabase/migrations/001_initial_schema.sql in BACKEND-SETUP.md
-- It contains all 11 tables, indexes, triggers, and functions
```

---

## Key Code Snippets

### Supabase Client (src/lib/supabase/server.ts)
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}
```

### Clerk Middleware (src/middleware.ts)
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/', '/login(.*)', '/signup(.*)', '/pricing', '/about', '/api/webhooks(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) await auth.protect();
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

### API Response Helper (src/lib/utils/api.ts)
```typescript
import { NextResponse } from 'next/server';

export function successResponse<T>(data: T, meta?: any, status = 200) {
  return NextResponse.json({ data, meta }, { status });
}

export function errorResponse(code: string, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error);
  if (error instanceof Error) {
    return errorResponse('ERROR', error.message, 500);
  }
  return errorResponse('UNKNOWN', 'An error occurred', 500);
}
```

---

## Continue to Part 2

See **ONE-DAY-BUILD-PART2.md** for:
- Complete component implementations
- AI integration code
- Tableau embedding
- Chat assistant
- Deployment steps

---

## Checkpoint Verification

After each phase, verify:

| Phase | Verification |
|-------|-------------|
| 1. Setup | `npm run dev` works |
| 2. Database | Tables visible in Supabase |
| 3. Auth | Can sign up/login |
| 4. Dashboard | See sidebar, header |
| 5. Loans | Can create/view loans |
| 6. Documents | Can upload/extract |
| 7. Covenants | Can see covenant status |
| 8. Chat | Chat widget works |
| 9. Tableau | Dashboards load |
| 10. Memos | Can generate memos |
| 11. Deploy | Live at termly.cc |
