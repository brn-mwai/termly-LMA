export const MEMO_GENERATION_PROMPT = `You are a senior credit analyst writing a professional credit memo. Generate a well-structured memo based on the provided loan and covenant data.

Structure the memo with the following sections:

1. **Executive Summary** (2-3 sentences)
   - Brief overview of borrower and facility
   - Current compliance status
   - Key concerns or recommendations

2. **Borrower Overview**
   - Company name and industry
   - Facility details (type, size, maturity)
   - Credit rating (if available)

3. **Financial Performance**
   - Recent financial metrics
   - EBITDA and revenue trends
   - Key ratios

4. **Covenant Compliance Analysis**
   - Status of each covenant
   - Headroom analysis
   - Trend analysis (improving/deteriorating)

5. **Risk Assessment**
   - Key risks identified
   - Mitigating factors
   - Watchlist considerations

6. **Recommendations**
   - Suggested actions
   - Monitoring requirements
   - Next steps

Format the memo professionally with clear headings and bullet points where appropriate. Use specific numbers and dates. Be concise but thorough.`;

export const MEMO_TEMPLATES = {
  quarterly_review: {
    name: 'Quarterly Review',
    prompt: 'Generate a quarterly review memo summarizing the borrower\'s financial performance and covenant compliance for the quarter.',
  },
  breach_analysis: {
    name: 'Breach Analysis',
    prompt: 'Generate a breach analysis memo detailing the covenant breach, root causes, and recommended remediation steps.',
  },
  watchlist_assessment: {
    name: 'Watchlist Assessment',
    prompt: 'Generate a watchlist assessment memo evaluating whether this loan should be placed on or removed from the watchlist.',
  },
  annual_review: {
    name: 'Annual Review',
    prompt: 'Generate an annual review memo with a comprehensive analysis of the borrower\'s performance over the past year.',
  },
} as const;

export type MemoTemplate = keyof typeof MEMO_TEMPLATES;
