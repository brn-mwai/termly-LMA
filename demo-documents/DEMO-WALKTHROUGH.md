# Termly Demo Walkthrough Guide

This guide provides a comprehensive walkthrough for demonstrating Termly's AI-powered loan covenant monitoring capabilities.

## Demo Portfolio Overview

| Borrower | Industry | Facility Size | Status | Key Story |
|----------|----------|---------------|--------|-----------|
| TechFlow Solutions | Technology | $25M Revolver | **COMPLIANT** | Strong performer, healthy headroom |
| Sunrise Healthcare | Healthcare | $40M Term Loan | **COMPLIANT** | Good margins, stable operations |
| Midwest Manufacturing | Manufacturing | $50M Term Loan | **WARNING** | Leverage at 4.8x vs 5.0x max (4% headroom) |
| Harbor Retail Group | Retail | $35M Senior Secured | **BREACH** | Interest Coverage at 1.8x vs 2.0x minimum |

---

## Demo Script

### Act 1: The Problem (2-3 minutes)

**Talking Points:**
- "Let me show you how lenders currently track loan covenants..."
- "Teams spend 20+ hours per quarter manually reading compliance certificates"
- "Critical covenant breaches can be missed due to human error"
- "There's no easy way to see portfolio-wide risk at a glance"

### Act 2: Document Upload (3-5 minutes)

**Demo Flow:**

1. **Navigate to Documents page**
   - Show the clean, organized document management interface

2. **Upload TechFlow Credit Agreement first**
   - Drag and drop `01-techflow-credit-agreement.tex.pdf`
   - Watch AI extract:
     - Borrower: TechFlow Solutions Inc.
     - Facility: $25,000,000 Revolving Credit
     - Lender: First National Bank, N.A.
     - Covenants identified automatically

3. **Upload TechFlow Compliance Certificate**
   - Show AI extracting:
     - Q3 2025 period
     - Leverage Ratio: 2.29x (Max 4.00x) - COMPLIANT
     - Interest Coverage: 5.83x (Min 2.50x) - COMPLIANT
     - EBITDA: $12.45M (Min $8M) - COMPLIANT

4. **Repeat for other borrowers** (can be pre-loaded for time)

**Key Talking Points:**
- "Notice how the AI automatically identifies the borrower, covenants, and compliance status"
- "No manual data entry required"
- "The system understands financial documents natively"

### Act 3: Dashboard Overview (2-3 minutes)

**Navigate to Dashboard**

**Highlight:**
- Portfolio summary showing 4 loans
- Quick status indicators: 2 Compliant, 1 Warning, 1 Breach
- Total portfolio exposure by risk category
- Upcoming compliance deadlines

**Key Talking Points:**
- "In one glance, you can see your entire portfolio's health"
- "The breach immediately stands out - no spreadsheets to dig through"
- "You can click into any loan for detailed analysis"

### Act 4: Deep Dive - The Breach (3-5 minutes)

**Click into Harbor Retail Group**

**Show:**
1. **Loan Overview**
   - $35M Senior Secured Facility
   - Commerce Bank & Trust
   - Maturity: June 15, 2027

2. **Covenant Status Summary**
   - Leverage Ratio: 4.36x (Max 4.50x) - **WARNING** (3.1% headroom)
   - Interest Coverage: 1.80x (Min 2.00x) - **BREACH** (-10.0%)
   - Fixed Charge Coverage: 0.75x (Min 1.10x) - **BREACH** (-31.8%)

3. **AI-Generated Memo**
   - Click "Generate Memo"
   - Show the AI drafting a professional credit memo that includes:
     - Executive summary of the breach
     - Root cause analysis (declining same-store sales, rising rates)
     - Recommended remediation steps
     - Risk rating recommendation

4. **Historical Trend**
   - Show how covenants have trended over past quarters
   - Highlight the deteriorating Interest Coverage (declining from above 2.0x)

**Key Talking Points:**
- "The AI doesn't just tell you there's a breach - it explains WHY"
- "Look at the memo - this would take an analyst 2+ hours to write manually"
- "Historical context helps you understand if this is a one-time issue or a trend"

### Act 5: The Warning Case (2-3 minutes)

**Navigate to Midwest Manufacturing**

**Show:**
- Leverage at 4.80x vs 5.00x maximum
- Only 4% headroom
- AI flagging this as elevated risk despite technical compliance
- Early warning allows proactive lender outreach

**Key Talking Points:**
- "Termly doesn't just catch breaches - it predicts problems"
- "With 4% headroom, one bad quarter could trigger a breach"
- "Proactive monitoring gives you time to work with the borrower"

### Act 6: AI Chat Interface (2-3 minutes)

**Open the AI Chat**

**Demo queries:**
1. "Which loans have the lowest covenant headroom?"
2. "Show me all borrowers with leverage above 4.0x"
3. "What's the trend for Harbor Retail's EBITDA?"
4. "Generate a portfolio risk summary"

**Key Talking Points:**
- "Ask questions in plain English - no SQL, no spreadsheets"
- "The AI has context on your entire portfolio"
- "It's like having a credit analyst available 24/7"

### Act 7: Analytics & Insights (2-3 minutes)

**Navigate to Analytics page**

**Show:**
- Portfolio risk distribution chart
- Compliance trends over time
- Sector concentration analysis
- AI-recommended actions

**Key Talking Points:**
- "Get board-ready analytics without manual work"
- "Track how your portfolio's risk profile changes over time"
- "AI recommendations help prioritize where to focus"

---

## Quick Demo (5 minutes)

For shorter demos, focus on:

1. **Upload one document** (TechFlow Compliance Certificate)
   - Show instant AI extraction

2. **Dashboard glance**
   - Highlight the breach indicator for Harbor Retail

3. **One AI query**
   - "Which loans have covenant breaches?"

4. **Generate memo**
   - Show AI writing a professional credit memo

---

## Handling Objections

**"How accurate is the AI?"**
- "The AI is trained on thousands of financial documents"
- "It flags uncertain extractions for human review"
- "Banks use it as a first pass, with human verification for critical decisions"

**"What about security?"**
- "All data is encrypted at rest and in transit"
- "We're SOC 2 compliant"
- "Documents never leave your organization's cloud environment"

**"How long to implement?"**
- "Most clients are live within 2-4 weeks"
- "No IT infrastructure needed - it's cloud-based"
- "We provide white-glove onboarding support"

---

## Demo Environment Setup

### Pre-Demo Checklist

- [ ] All 8 PDF documents compiled and ready
- [ ] Demo account credentials prepared
- [ ] Test upload working
- [ ] Dashboard showing correct portfolio summary
- [ ] AI chat responding properly
- [ ] Analytics page loading

### Compiling PDFs

To compile the LaTeX documents to PDF, run:

```bash
# On a system with pdflatex installed
cd demo-documents
for f in *.tex; do pdflatex "$f"; done
```

Or use an online LaTeX editor like Overleaf to compile each document.

---

## Document Summary

### 01 - TechFlow Credit Agreement
- $25M Revolving Credit Facility
- SOFR + 2.50%
- Max Leverage: 4.00x (stepping down from 4.50x)
- Min Interest Coverage: 2.50x
- Min EBITDA: $8,000,000

### 02 - TechFlow Compliance Certificate (Q3 2025)
- **Status: FULLY COMPLIANT**
- Leverage: 2.29x (42.8% headroom)
- Interest Coverage: 5.83x (133% headroom)
- EBITDA: $12.45M (55.6% headroom)

### 03 - Midwest Manufacturing Credit Agreement
- $50M Term Loan
- SOFR + 3.25%
- Max Leverage: 5.00x (for 2025)
- Min Interest Coverage: 2.00x
- Min EBITDA: $12,000,000

### 04 - Midwest Manufacturing Compliance Certificate (Q3 2025)
- **Status: WARNING - LOW HEADROOM**
- Leverage: 4.80x (only 4.0% headroom)
- Interest Coverage: 2.98x (compliant)
- EBITDA: $13.0M (8.3% headroom)

### 05 - Harbor Retail Credit Agreement
- $35M Senior Secured (Term + Revolver)
- SOFR + 4.00%
- Max Leverage: 4.50x
- Min Interest Coverage: 2.00x
- Min Fixed Charge Coverage: 1.10x

### 06 - Harbor Retail Compliance Certificate (Q3 2025)
- **Status: COVENANT BREACH**
- Leverage: 4.36x (3.1% headroom - WARNING)
- Interest Coverage: 1.80x (BREACH - 10% shortfall)
- Fixed Charge Coverage: 0.75x (BREACH - 31.8% shortfall)
- Root causes: Declining sales, rising rates, store closure costs

### 07 - Sunrise Healthcare Compliance Certificate (Q3 2025)
- **Status: FULLY COMPLIANT**
- Leverage: 2.44x (39% headroom)
- DSCR: 1.95x (56% headroom)
- EBITDA: $14.85M (48.5% headroom)
- Current Ratio: 2.08x (38.7% headroom)

### 08 - Sunrise Healthcare Credit Agreement
- $40M Term Loan
- SOFR + 2.75%
- Max Leverage: 4.00x
- Min DSCR: 1.25x
- Min EBITDA: $10,000,000
- Min Current Ratio: 1.50x
