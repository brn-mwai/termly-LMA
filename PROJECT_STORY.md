# Termly

**AI-powered covenant monitoring that transforms hours of manual work into minutes.**

**Category:** Keeping Loans on Track

---

## The Problem

Every quarter, credit teams manually verify borrower compliance. The process:

| Step | Task | Pain Point |
|------|------|------------|
| 1 | Collect financial statements | Chasing borrowers |
| 2 | Find covenant definitions in 100+ page documents | Time-consuming |
| 3 | Extract financial data by hand | Error-prone |
| 4 | Calculate ratios in spreadsheets | Formula mistakes |
| 5 | Compare against thresholds | Inconsistent interpretation |
| 6 | Generate reports | Delayed insights |

**Current process: 5-11 hours per loan, every quarter.**

Breaches discovered weeks late. Errors go unnoticed. Teams can't scale.

---

## The Solution

Termly automates covenant monitoring from document to dashboard.

1. **Upload** - Drop a credit agreement or compliance certificate (PDF)
2. **Extract** - AI reads the document, pulls covenant terms, financials, thresholds
3. **Calculate** - System computes ratios and compares against thresholds
4. **Monitor** - Dashboard displays compliance status with real-time alerts

**Result: ~5 minutes per loan.**

---

## Key Features

### Document Intelligence
- Extracts covenant definitions and thresholds
- Handles EBITDA calculations with permitted add-backs
- Processes financial data from statements
- Identifies testing frequency and dates

### Automated Compliance Testing
- Calculates leverage, interest coverage, fixed charge ratios
- Determines status: Compliant, Warning, or Breach
- Shows headroom (distance to threshold)

### Real-Time Alerts
- **Critical:** Covenant breach detected
- **Warning:** Headroom below threshold
- **Info:** Upcoming test dates

### Portfolio Dashboard
Single view of all loans, compliance status, and risk indicators.

---

## Target Users

| User | Benefit |
|------|---------|
| **Credit Analysts** | Extract data in seconds, not hours |
| **Portfolio Managers** | See all loans at a glance |
| **Loan Operations** | Automate routine monitoring |
| **Risk Managers** | Real-time portfolio visibility |

---

## Value Proposition

| Before | After |
|--------|-------|
| 5-11 hours/loan | ~5 minutes/loan |
| Weeks to detect breaches | Real-time detection |
| Manual errors | Consistent calculations |
| Spreadsheet chaos | Centralized dashboard |
| More loans = more analysts | Scale without adding headcount |

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS |
| **UI Components** | Shadcn/ui, Radix UI |
| **Backend** | Supabase (PostgreSQL), Edge Functions |
| **AI** | Anthropic Claude, Groq |
| **Document Processing** | PDF.js, Tesseract.js (OCR) |
| **Auth** | Clerk |
| **Deployment** | Vercel |

---

## Links

| | |
|---|---|
| **Live Platform** | [termly.cc](https://termly.cc) |
| **Pitch Deck** | [pitch.com/v/termly-ai-hm3tqm](https://pitch.com/v/termly-ai-hm3tqm) |
| **Repository** | [github.com/brn-mwai/termly](https://github.com/brn-mwai/termly) |

---

## Summary

| | |
|---|---|
| **Problem** | Covenant monitoring is manual, slow, error-prone |
| **Solution** | AI-powered extraction and real-time monitoring |
| **Result** | Hours to Minutes |
| **Category** | Keeping Loans on Track |

---

*Built for the LMA EDGE Hackathon 2026*
