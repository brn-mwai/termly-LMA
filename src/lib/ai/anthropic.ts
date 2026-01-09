import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ExtractionResult {
  covenants: Array<{
    name: string;
    type: string;
    operator: 'max' | 'min';
    threshold: number;
    testingFrequency: string;
    definition?: string;
    addbacks?: string[];
    sourceClause?: string;
  }>;
  financials?: {
    periodEnd: string;
    revenue?: number;
    ebitda?: number;
    totalDebt?: number;
    interestExpense?: number;
    currentAssets?: number;
    currentLiabilities?: number;
  };
  metadata: {
    borrowerName?: string;
    facilityName?: string;
    facilityAmount?: number;
    maturityDate?: string;
    effectiveDate?: string;
  };
  confidence: number;
}

export async function extractFromDocument(
  documentText: string,
  documentType: string
): Promise<ExtractionResult> {
  const systemPrompt = `You are an expert credit analyst specializing in loan document analysis. Your task is to extract covenant definitions, financial data, and key terms from loan documents.

For each covenant found, extract:
- Name (e.g., "Total Leverage Ratio", "Interest Coverage Ratio")
- Type (leverage, interest_coverage, fixed_charge_coverage, current_ratio, min_net_worth, custom)
- Operator (max or min - whether the ratio must be at most or at least the threshold)
- Threshold value (the numeric limit)
- Testing frequency (monthly, quarterly, semi-annual, annual)
- EBITDA definition details if applicable
- Permitted addbacks
- Source clause reference

For financial statements, extract:
- Period end date
- Revenue
- EBITDA (reported and adjusted)
- Total debt
- Interest expense
- Current assets/liabilities

Always respond in valid JSON format.`;

  const userPrompt = `Extract all covenant definitions, financial data, and key terms from this ${documentType} document:

${documentText}

Respond with a JSON object containing:
{
  "covenants": [...],
  "financials": {...},
  "metadata": {...},
  "confidence": 0.0-1.0
}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  // Parse JSON from response
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  return JSON.parse(jsonMatch[0]) as ExtractionResult;
}

export { anthropic };
