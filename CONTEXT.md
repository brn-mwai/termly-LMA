# Termly - AI-Powered Loan Covenant Monitoring

## Project Overview

Termly is an AI-powered platform for loan covenant monitoring that transforms manual, error-prone spreadsheet workflows into an automated, intelligent system. Built for the Tableau Hackathon (deadline: Jan 12, 2026) and LMA EDGE Hackathon (deadline: Jan 14, 2026).

## Problem Statement

Credit analysts in the $5.5 trillion loan market spend 60% of their time manually extracting data from PDF loan documents into Excel spreadsheets. This process:
- Takes 4-8 hours per loan per quarter
- Has 5-15% error rates
- Misses covenant breaches until they become crises
- Doesn't scale without proportional headcount

## Solution

Termly automates covenant monitoring through:
1. **AI Document Extraction** - Upload PDF → AI extracts covenant terms and financial data in 60 seconds
2. **Human Verification** - Side-by-side PDF view with confidence scores for review
3. **Automatic Calculation** - Apply bespoke EBITDA definitions, calculate all covenant ratios
4. **Real-Time Monitoring** - Track compliance status, generate alerts on breaches/warnings
5. **Tableau Dashboards** - Interactive portfolio visualization with embedded Tableau

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict mode) |
| Database | Supabase (PostgreSQL) |
| Auth | Clerk |
| Styling | Tailwind CSS + shadcn/ui |
| AI | Anthropic Claude API |
| Visualization | Tableau Cloud (embedded) |
| Deployment | Vercel |

## Project Structure

```
termly/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Authentication pages
│   │   ├── (dashboard)/        # Protected dashboard routes
│   │   │   ├── dashboard/      # Main dashboard
│   │   │   ├── loans/          # Loan management
│   │   │   ├── documents/      # Document management
│   │   │   ├── alerts/         # Alert notifications
│   │   │   └── upload/         # Document upload
│   │   └── api/                # API routes
│   │       └── documents/      # Document extraction API
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── layout/             # Sidebar, header
│   │   ├── dashboard/          # Dashboard widgets
│   │   └── upload/             # Upload components
│   ├── lib/
│   │   ├── supabase/           # Supabase clients
│   │   ├── ai/                 # AI extraction logic
│   │   └── utils.ts            # Utility functions
│   └── types/
│       └── database.ts         # TypeScript types
├── supabase/
│   └── migrations/             # Database schema
├── public/                     # Static assets
└── .env.example                # Environment template
```

## Key Domain Concepts

### Covenant Types
- **Leverage Ratio**: Total Debt ÷ EBITDA (max threshold, e.g., ≤ 5.0x)
- **Interest Coverage**: EBITDA ÷ Interest Expense (min threshold, e.g., ≥ 2.0x)
- **Fixed Charge Coverage**: EBITDA ÷ Fixed Charges (min threshold, e.g., ≥ 1.25x)

### EBITDA Complexity
Every loan has a custom EBITDA definition with specific add-backs (non-cash charges, restructuring costs, etc.). The AI extracts these bespoke definitions from credit agreements.

### Compliance Status
- **Compliant**: Headroom > 15%
- **Warning**: Headroom 0-15%
- **Breach**: Headroom < 0% (threshold violated)

## Database Schema

### Core Tables
- `organizations` - Multi-tenant organization management
- `users` - User accounts (synced with Clerk)
- `borrowers` - Loan borrower entities
- `loans` - Loan facilities with terms
- `documents` - Uploaded PDF documents
- `covenants` - Covenant definitions and thresholds
- `financial_periods` - Quarterly/annual financial data
- `covenant_tests` - Test results with compliance status
- `alerts` - Breach and warning notifications
- `memos` - AI-generated credit memos
- `audit_logs` - Complete audit trail

## AI Extraction Architecture

Multi-pass extraction approach:
1. **Pass 1**: Analyze document structure
2. **Pass 2**: Extract EBITDA definitions and add-backs
3. **Pass 3**: Extract covenant thresholds
4. **Pass 4**: Extract financial data

Each extraction includes confidence scores for human review.

## API Endpoints

```
POST /api/documents           # Upload document
POST /api/documents/:id/extract   # Trigger AI extraction
GET  /api/documents/:id/extract   # Get extraction result
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Tableau
TABLEAU_SERVER_URL=
TABLEAU_SITE_ID=
TABLEAU_TOKEN_NAME=
TABLEAU_TOKEN_SECRET=
```

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev

# Build for production
npm run build
```

## Current Status

### Completed
- [x] Next.js project setup with TypeScript
- [x] Supabase client configuration
- [x] Clerk authentication integration
- [x] Database schema design
- [x] Dashboard with stats cards
- [x] Loans list and detail pages
- [x] Document upload interface
- [x] Alerts management page
- [x] AI extraction API endpoint
- [x] Sidebar navigation

### In Progress
- [ ] Extraction verification UI
- [ ] Tableau dashboard integration
- [ ] Real-time alerts system

### Pending
- [ ] Complete API endpoints
- [ ] Supabase storage integration
- [ ] Credit memo generation
- [ ] Demo data seeding
- [ ] Hackathon submission materials

## Hackathon Targets

### Tableau Hackathon (Jan 12)
- Interactive covenant monitoring dashboards
- Portfolio risk heatmaps
- Drill-down from portfolio to loan level
- Real-time compliance visualization

### LMA EDGE Hackathon (Jan 14)
- Focus on document extraction quality
- Borrower/lender workflow efficiency
- Industry standardization potential
