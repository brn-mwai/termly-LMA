import Anthropic from "@anthropic-ai/sdk";
import Groq from "groq-sdk";
import { z } from "zod";

// Lazy initialization for fallback support
let anthropicClient: Anthropic | null = null;
let groqClient: Groq | null = null;

function getAnthropicClient(): Anthropic | null {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey.includes('your_key_here')) {
      return null;
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

function getGroqClient(): Groq | null {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey.includes('your_key_here')) {
      return null;
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

// Unified extraction call with fallback
async function extractionCall(prompt: string, maxTokens: number = 3000): Promise<string> {
  const anthropic = getAnthropicClient();
  const groq = getGroqClient();

  // Try Anthropic first
  if (anthropic) {
    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      });
      return response.content[0].type === "text" ? response.content[0].text : "";
    } catch (error) {
      console.warn("Anthropic extraction failed, falling back to Groq:", error instanceof Error ? error.message : error);
    }
  }

  // Fallback to Groq
  if (groq) {
    try {
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: maxTokens,
        temperature: 0.1,
        messages: [{ role: "user", content: prompt }],
      });
      return response.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("Groq extraction also failed:", error instanceof Error ? error.message : error);
      throw new Error("All AI providers failed for extraction");
    }
  }

  throw new Error("No AI provider configured for extraction");
}

// Extraction schemas
export const EBITDAAddbackSchema = z.object({
  category: z.string(),
  description: z.string(),
  cap: z.string().nullish(), // Allow null or undefined
  confidence: z.number().min(0).max(1),
});

export const CovenantExtractionSchema = z.object({
  name: z.string(),
  type: z.enum([
    "leverage",
    "interest_coverage",
    "fixed_charge_coverage",
    "current_ratio",
    "min_net_worth",
    "custom",
  ]),
  operator: z.enum(["max", "min"]),
  threshold: z.number(),
  thresholdStepDowns: z
    .array(
      z.object({
        date: z.string(),
        threshold: z.number(),
      })
    )
    .nullish(), // Allow null or undefined
  testingFrequency: z.string(),
  gracePeriodDays: z.number().nullish(), // Allow null or undefined
  sourceClause: z.string(),
  confidence: z.number().min(0).max(1),
});

export const FinancialDataSchema = z.object({
  periodEndDate: z.string(),
  periodType: z.enum(["quarterly", "annual", "monthly"]),
  revenue: z.number().nullish(), // Allow null or undefined
  ebitdaReported: z.number().nullish(),
  totalDebt: z.number().nullish(),
  interestExpense: z.number().nullish(),
  fixedCharges: z.number().nullish(),
  currentAssets: z.number().nullish(),
  currentLiabilities: z.number().nullish(),
  netWorth: z.number().nullish(),
  confidence: z.number().min(0).max(1),
});

export const ExtractionResultSchema = z.object({
  documentType: z.enum([
    "credit_agreement",
    "compliance_certificate",
    "financial_statement",
    "amendment",
    "other",
  ]),
  borrowerName: z.string().optional(),
  facilityName: z.string().optional(),
  ebitdaDefinition: z.string().optional(),
  ebitdaAddbacks: z.array(EBITDAAddbackSchema).optional(),
  covenants: z.array(CovenantExtractionSchema).optional(),
  financialData: z.array(FinancialDataSchema).optional(),
  overallConfidence: z.number().min(0).max(1),
  extractionNotes: z.array(z.string()).optional(),
});

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

// Multi-pass extraction prompts
const PASS1_STRUCTURE_PROMPT = `You are analyzing a loan document. Identify the document structure and key sections.

For each section found, provide:
1. Section name/title
2. Page range (if available)
3. Key content type (definitions, covenants, financial data, etc.)

Return a JSON object with:
{
  "documentType": "credit_agreement" | "compliance_certificate" | "financial_statement" | "amendment" | "other",
  "sections": [
    {
      "name": "string",
      "pageRange": "string",
      "contentType": "string"
    }
  ],
  "hasEBITDADefinition": boolean,
  "hasFinancialCovenants": boolean,
  "hasFinancialData": boolean
}`;

const PASS2_EBITDA_PROMPT = `You are extracting the EBITDA definition from a credit agreement.

Extract:
1. The full EBITDA definition text
2. All permitted add-backs with:
   - Category (non-cash, restructuring, transaction, non-recurring, pro forma)
   - Description
   - Any caps or limitations
3. Any exclusions or limitations

Return JSON:
{
  "ebitdaDefinition": "full definition text",
  "addbacks": [
    {
      "category": "string",
      "description": "string",
      "cap": "string or null",
      "confidence": 0.0-1.0
    }
  ],
  "exclusions": ["string"],
  "confidence": 0.0-1.0
}`;

const PASS3_COVENANTS_PROMPT = `You are extracting financial covenant requirements from a loan document.

For each covenant found, extract:
1. Covenant name
2. Type (leverage, interest_coverage, fixed_charge_coverage, current_ratio, min_net_worth, custom)
3. Operator (max = must be less than or equal, min = must be greater than or equal)
4. Threshold value
5. Any step-downs over time
6. Testing frequency
7. Grace period if specified
8. The source clause text

Return JSON:
{
  "covenants": [
    {
      "name": "string",
      "type": "leverage" | "interest_coverage" | "fixed_charge_coverage" | "current_ratio" | "min_net_worth" | "custom",
      "operator": "max" | "min",
      "threshold": number,
      "thresholdStepDowns": [{"date": "YYYY-MM-DD", "threshold": number}] or null,
      "testingFrequency": "quarterly" | "monthly" | "annual",
      "gracePeriodDays": number or null,
      "sourceClause": "string",
      "confidence": 0.0-1.0
    }
  ]
}`;

const PASS4_FINANCIALS_PROMPT = `You are extracting financial data from a compliance certificate or financial statement.

For each period found, extract:
1. Period end date
2. Period type (quarterly, annual, monthly)
3. Revenue (if available)
4. EBITDA as reported
5. Total debt
6. Interest expense
7. Fixed charges (if available)
8. Current assets and liabilities (if available)
9. Net worth (if available)

Return JSON:
{
  "financialData": [
    {
      "periodEndDate": "YYYY-MM-DD",
      "periodType": "quarterly" | "annual" | "monthly",
      "revenue": number or null,
      "ebitdaReported": number or null,
      "totalDebt": number or null,
      "interestExpense": number or null,
      "fixedCharges": number or null,
      "currentAssets": number or null,
      "currentLiabilities": number or null,
      "netWorth": number or null,
      "confidence": 0.0-1.0
    }
  ]
}`;

export async function extractFromDocument(
  documentContent: string,
  documentType: string
): Promise<ExtractionResult> {
  // Pass 1: Analyze document structure
  const structureText = await extractionCall(
    `${PASS1_STRUCTURE_PROMPT}\n\nDocument content:\n${documentContent.slice(0, 50000)}`,
    2000
  );

  let structure;
  try {
    const jsonMatch = structureText.match(/\{[\s\S]*\}/);
    structure = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  } catch {
    structure = { hasEBITDADefinition: false, hasFinancialCovenants: false, hasFinancialData: false };
  }

  const result: Partial<ExtractionResult> = {
    documentType: structure.documentType || documentType,
    overallConfidence: 0,
    extractionNotes: [],
  };

  // Pass 2: Extract EBITDA definition (if applicable)
  if (
    structure.hasEBITDADefinition ||
    documentType === "credit_agreement"
  ) {
    const ebitdaText = await extractionCall(
      `${PASS2_EBITDA_PROMPT}\n\nDocument content:\n${documentContent.slice(0, 80000)}`,
      3000
    );

    try {
      const jsonMatch = ebitdaText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const ebitdaData = JSON.parse(jsonMatch[0]);
        result.ebitdaDefinition = ebitdaData.ebitdaDefinition;
        result.ebitdaAddbacks = ebitdaData.addbacks;
      }
    } catch {
      result.extractionNotes?.push("Failed to parse EBITDA definition");
    }
  }

  // Pass 3: Extract covenants
  if (
    structure.hasFinancialCovenants ||
    documentType === "credit_agreement"
  ) {
    const covenantsText = await extractionCall(
      `${PASS3_COVENANTS_PROMPT}\n\nDocument content:\n${documentContent.slice(0, 80000)}`,
      4000
    );

    try {
      const jsonMatch = covenantsText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const covenantsData = JSON.parse(jsonMatch[0]);
        result.covenants = covenantsData.covenants;
      }
    } catch {
      result.extractionNotes?.push("Failed to parse covenants");
    }
  }

  // Pass 4: Extract financial data
  if (
    structure.hasFinancialData ||
    documentType === "compliance_certificate" ||
    documentType === "financial_statement"
  ) {
    const financialsText = await extractionCall(
      `${PASS4_FINANCIALS_PROMPT}\n\nDocument content:\n${documentContent.slice(0, 80000)}`,
      3000
    );

    try {
      const jsonMatch = financialsText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const financialsData = JSON.parse(jsonMatch[0]);
        result.financialData = financialsData.financialData;
      }
    } catch {
      result.extractionNotes?.push("Failed to parse financial data");
    }
  }

  // Calculate overall confidence
  const confidences: number[] = [];
  if (result.ebitdaAddbacks) {
    confidences.push(
      ...result.ebitdaAddbacks.map((a) => a.confidence)
    );
  }
  if (result.covenants) {
    confidences.push(...result.covenants.map((c) => c.confidence));
  }
  if (result.financialData) {
    confidences.push(...result.financialData.map((f) => f.confidence));
  }

  result.overallConfidence =
    confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0.5;

  return result as ExtractionResult;
}

// Helper to calculate covenant test result
export function calculateCovenantTest(
  covenantType: string,
  operator: "max" | "min",
  threshold: number,
  financialData: {
    ebitda: number;
    totalDebt: number;
    interestExpense: number;
    fixedCharges?: number;
    currentAssets?: number;
    currentLiabilities?: number;
    netWorth?: number;
  }
): {
  calculatedValue: number;
  status: "compliant" | "warning" | "breach";
  headroomAbsolute: number;
  headroomPercentage: number;
} {
  let calculatedValue: number;

  switch (covenantType) {
    case "leverage":
      calculatedValue = financialData.totalDebt / financialData.ebitda;
      break;
    case "interest_coverage":
      calculatedValue = financialData.ebitda / financialData.interestExpense;
      break;
    case "fixed_charge_coverage":
      calculatedValue =
        financialData.ebitda / (financialData.fixedCharges || financialData.interestExpense);
      break;
    case "current_ratio":
      calculatedValue =
        (financialData.currentAssets || 0) /
        (financialData.currentLiabilities || 1);
      break;
    case "min_net_worth":
      calculatedValue = financialData.netWorth || 0;
      break;
    default:
      calculatedValue = 0;
  }

  // Calculate headroom
  let headroomAbsolute: number;
  let headroomPercentage: number;

  if (operator === "max") {
    headroomAbsolute = threshold - calculatedValue;
    headroomPercentage = ((threshold - calculatedValue) / threshold) * 100;
  } else {
    headroomAbsolute = calculatedValue - threshold;
    headroomPercentage = ((calculatedValue - threshold) / threshold) * 100;
  }

  // Determine status
  let status: "compliant" | "warning" | "breach";
  if (headroomPercentage < 0) {
    status = "breach";
  } else if (headroomPercentage < 15) {
    status = "warning";
  } else {
    status = "compliant";
  }

  return {
    calculatedValue,
    status,
    headroomAbsolute,
    headroomPercentage,
  };
}
