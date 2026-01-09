# TERMLY - Claude Code Project Prompt

## Project Overview

You are building **Termly**, an AI-powered loan covenant monitoring platform. This is a hackathon project targeting two competitions:
- **Tableau Hackathon** (Deadline: Jan 12, 2026 @ 12:00pm PST) - $45K prize pool
- **LMA EDGE Hackathon** (Deadline: Jan 14, 2026 @ 11:45pm GMT) - $25K prize pool

## The Problem

Credit analysts in the $5.5 trillion loan market spend 60% of their time manually extracting data from PDF loan documents into Excel spreadsheets. This process:
- Takes 4-8 hours per loan per quarter
- Has 5-15% error rates
- Misses covenant breaches until they become crises
- Doesn't scale without proportional headcount

## The Solution

Termly automates covenant monitoring through:
1. **AI Document Extraction**: Upload PDF → AI extracts covenant terms and financial data in 60 seconds
2. **Human Verification**: Side-by-side PDF view with confidence scores for review
3. **Automatic Calculation**: Apply bespoke EBITDA definitions, calculate all covenant ratios
4. **Real-Time Monitoring**: Track compliance status, generate alerts on breaches/warnings
5. **Tableau Dashboards**: Interactive portfolio visualization with embedded Tableau

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Clerk
- **Styling**: Tailwind CSS + shadcn/ui
- **AI**: Anthropic Claude API
- **Visualization**: Tableau Cloud (embedded)
- **Deployment**: Vercel

## Project Structure

```
termly/
├── CONTEXT.md                 # Master reference - READ THIS FIRST
├── docs/
│   ├── research/              # Market research, competitors, domain knowledge
│   │   ├── MARKET-RESEARCH.md
│   │   ├── COMPETITOR-ANALYSIS.md
│   │   ├── DOMAIN-KNOWLEDGE.md
│   │   ├── USER-PERSONAS.md
│   │   └── PAIN-POINTS.md
│   ├── specs/                 # Technical specifications
│   │   ├── PROBLEM-SOLUTION.md
│   │   ├── TECHNICAL-ARCHITECTURE.md
│   │   ├── DATABASE-SCHEMA.md
│   │   └── UI-STRUCTURE.md
│   ├── hackathon/             # Competition strategy
│   │   ├── DUAL-STRATEGY.md
│   │   └── BUILD-PLAN.md
│   └── guides/                # Implementation guides
├── src/
│   ├── app/                   # Next.js App Router pages
│   ├── components/            # React components
│   ├── lib/                   # Utilities, API clients
│   └── types/                 # TypeScript types
├── supabase/
│   └── migrations/            # Database migrations
└── public/                    # Static assets
```

## Key Domain Concepts

### What is a Covenant?
A legally binding condition in a loan requiring borrowers to maintain financial thresholds (e.g., Debt/EBITDA ≤ 4.5x). Breach triggers default.

### Key Ratios
- **Leverage Ratio**: Total Debt ÷ EBITDA (lower is better, max threshold)
- **Interest Coverage Ratio (ICR)**: EBITDA ÷ Interest Expense (higher is better, min threshold)
- **Fixed Charge Coverage Ratio (FCCR)**: EBITDA ÷ Fixed Charges (higher is better, min threshold)

### EBITDA Complexity
Every loan has a custom EBITDA definition with specific add-backs (non-cash charges, restructuring costs, etc.). The AI must extract these bespoke definitions from credit agreements.

## Database Schema (Key Tables)

```sql
-- Core entities
organizations, users, loans, documents, covenants, financial_periods, covenant_tests, alerts, memos, audit_logs

-- Key relationships
loans → documents (many)
loans → covenants (many)
covenants → covenant_tests (many)
loans → financial_periods (many)
```

## Core Workflows to Implement

### 1. Document Upload & Extraction
```
User uploads PDF → Store in Supabase Storage → 
AI extracts (multi-pass) → Return structured data with confidence → 
User reviews side-by-side → Confirm/correct → Save to database
```

### 2. Covenant Calculation
```
Load financial period data → Load covenant definitions (EBITDA formula) →
Apply add-backs → Calculate ratios → Compare to thresholds →
Determine status (compliant/warning/breach) → Calculate headroom
```

### 3. Alert Generation
```
Covenant status changes → Evaluate severity →
Generate alert (breach=critical, headroom<15%=warning) →
Store alert → Notify users
```

### 4. Dashboard Visualization
```
Load portfolio data → Aggregate statistics →
Render Tableau embedded dashboards → Enable drill-down
```

## API Endpoints to Build

```
POST /api/documents           # Upload document
POST /api/documents/:id/extract   # Trigger AI extraction
PATCH /api/documents/:id/extraction   # Update after verification

GET /api/loans                # List loans
POST /api/loans               # Create loan
GET /api/loans/:id            # Get loan detail
GET /api/loans/:id/covenants  # Get loan covenants

POST /api/covenants/:id/test  # Run covenant test
GET /api/alerts               # List alerts
POST /api/memos               # Generate AI memo
```

## AI Extraction Approach

Use multi-pass extraction (like CovenantIQ):
1. **Pass 1**: Identify document structure (sections, definitions, exhibits)
2. **Pass 2**: Extract specific elements (EBITDA definition, thresholds, terms)
3. **Pass 3**: Validate consistency, flag ambiguities
4. **Pass 4**: Human review with confidence scores

## Tableau Integration

- Connect Tableau Cloud to Supabase PostgreSQL
- Build dashboards: Portfolio Overview, Covenant Monitor, Loan Detail, Risk Heatmap
- Embed using Tableau Embedding API v3
- Implement row-level security for multi-tenant

## Coding Standards

- TypeScript strict mode, no `any` types
- Server components by default, client only when needed
- Zod for runtime validation
- Always include created_at, updated_at on tables
- Soft delete with deleted_at where appropriate
- Complete audit trail for all changes
- Confidence scores on all AI extractions

## Environment Variables Needed

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
ANTHROPIC_API_KEY=
TABLEAU_SERVER_URL=
TABLEAU_SITE_ID=
TABLEAU_TOKEN_NAME=
TABLEAU_TOKEN_SECRET=
```

## Priority Order for Building

1. **Day 1**: Next.js setup, Supabase schema, auth, basic UI shell
2. **Day 2**: Document upload, AI extraction pipeline, verification UI
3. **Day 3**: Tableau connection, dashboard development, embedding
4. **Day 4**: Alert system, memo generation, audit trail
5. **Day 5**: Polish, demo video, Tableau submission
6. **Day 6**: Adjust for LMA, final submission

## Success Metrics

- AI extraction in <60 seconds with >90% accuracy
- Complete workflow: upload → verified data in <10 minutes
- Portfolio dashboard with real-time compliance status
- Functional alerts on covenant breaches
- Clean, professional UI suitable for enterprise users

## Important Notes

1. **Read CONTEXT.md first** - it has complete project context
2. **Check docs/specs/** for detailed technical specifications
3. **Use docs/research/** for domain knowledge when needed
4. **This is a hackathon** - focus on demo-able features, not perfection
5. **Same codebase, two submissions** - Tableau focus for first, LMA focus for second

## Getting Started

```bash
# Clone and setup
git clone https://github.com/brn-mwai/termly.git
cd termly
npm install

# Environment
cp .env.example .env.local
# Fill in API keys

# Database
npx supabase db push

# Development
npm run dev
```

---

**START BY READING**: `CONTEXT.md` and `docs/specs/TECHNICAL-ARCHITECTURE.md`

**THEN BUILD**: Follow the priority order above, starting with Next.js setup and Supabase schema.