import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Extraction schemas
export const EBITDAAddbackSchema = z.object({
  category: z.string(),
  description: z.string(),
  cap: z.string().nullish(),
  confidence: z.number().min(0).max(1).default(0.85),
});

export const CovenantExtractionSchema = z.object({
  name: z.string(),
  type: z.enum([
    "leverage",
    "interest_coverage",
    "fixed_charge_coverage",
    "current_ratio",
    "min_net_worth",
    "debt_service_coverage",
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
    .nullish(),
  testingFrequency: z.string(),
  gracePeriodDays: z.number().nullish(),
  sourceClause: z.string(),
  confidence: z.number().min(0).max(1).default(0.85),
});

export const FinancialDataSchema = z.object({
  periodEndDate: z.string(),
  periodType: z.enum(["quarterly", "annual", "monthly"]),
  revenue: z.number().nullish(),
  ebitdaReported: z.number().nullish(),
  totalDebt: z.number().nullish(),
  interestExpense: z.number().nullish(),
  fixedCharges: z.number().nullish(),
  currentAssets: z.number().nullish(),
  currentLiabilities: z.number().nullish(),
  netWorth: z.number().nullish(),
  confidence: z.number().min(0).max(1).default(0.85),
});

export const PDFExtractionResultSchema = z.object({
  documentType: z.enum([
    "credit_agreement",
    "compliance_certificate",
    "financial_statement",
    "amendment",
    "other",
  ]),
  borrowerName: z.string().nullish(),
  facilityName: z.string().nullish(),
  ebitdaDefinition: z.string().nullish(),
  ebitdaAddbacks: z.array(EBITDAAddbackSchema).nullish(),
  covenants: z.array(CovenantExtractionSchema).nullish(),
  financialData: z.array(FinancialDataSchema).nullish(),
  overallConfidence: z.number().min(0).max(1),
  extractionNotes: z.array(z.string()).nullish(),
});

export type PDFExtractionResult = z.infer<typeof PDFExtractionResultSchema>;

// Extraction prompts for different document types
const CREDIT_AGREEMENT_PROMPT = `You are an expert financial analyst specializing in loan documentation. Analyze this credit agreement and extract structured data.

EXTRACT THE FOLLOWING:

1. **BORROWER & FACILITY INFO**
   - Borrower name
   - Facility name/type

2. **FINANCIAL COVENANTS** (CRITICAL - extract ALL covenants)
   For each covenant found, extract:
   - Name (e.g., "Maximum Leverage Ratio", "Minimum Interest Coverage")
   - Type: leverage | interest_coverage | fixed_charge_coverage | current_ratio | min_net_worth | debt_service_coverage | custom
   - Operator: "max" (must not exceed) or "min" (must not be less than)
   - Threshold value (the numeric limit, e.g., 4.0 for "4.0x" or "4.00 to 1.00")
   - Testing frequency (quarterly, monthly, annual)
   - Grace period in days (if specified)
   - Source clause (quote the exact text defining this covenant)
   - Confidence score (0.0-1.0)

3. **EBITDA DEFINITION**
   - Full EBITDA/Adjusted EBITDA definition text
   - All permitted add-backs with:
     - Category (non-cash, restructuring, transaction, non-recurring, pro forma)
     - Description
     - Cap/limitation (if any)

Return ONLY valid JSON in this exact format:
{
  "documentType": "credit_agreement",
  "borrowerName": "string or null",
  "facilityName": "string or null",
  "ebitdaDefinition": "full definition text or null",
  "ebitdaAddbacks": [
    {"category": "string", "description": "string", "cap": "string or null", "confidence": 0.85}
  ],
  "covenants": [
    {
      "name": "string",
      "type": "leverage|interest_coverage|fixed_charge_coverage|current_ratio|min_net_worth|debt_service_coverage|custom",
      "operator": "max|min",
      "threshold": number,
      "thresholdStepDowns": [{"date": "YYYY-MM-DD", "threshold": number}] or null,
      "testingFrequency": "quarterly|monthly|annual",
      "gracePeriodDays": number or null,
      "sourceClause": "exact quoted text from document",
      "confidence": 0.85
    }
  ],
  "financialData": null,
  "overallConfidence": 0.85,
  "extractionNotes": ["any notes about the extraction"]
}`;

const COMPLIANCE_CERTIFICATE_PROMPT = `You are an expert financial analyst. Analyze this compliance certificate and extract the financial data and covenant test results.

EXTRACT THE FOLLOWING:

1. **FINANCIAL DATA** for each period reported:
   - Period end date (YYYY-MM-DD format)
   - Period type (quarterly, annual, monthly)
   - Revenue
   - EBITDA (as reported)
   - Total Debt
   - Interest Expense
   - Fixed Charges
   - Current Assets
   - Current Liabilities
   - Net Worth

2. **COVENANT TEST RESULTS** (if shown):
   - Each covenant tested
   - Calculated value
   - Threshold
   - Status (compliant/breach)

Return ONLY valid JSON in this exact format:
{
  "documentType": "compliance_certificate",
  "borrowerName": "string or null",
  "facilityName": "string or null",
  "ebitdaDefinition": null,
  "ebitdaAddbacks": null,
  "covenants": null,
  "financialData": [
    {
      "periodEndDate": "YYYY-MM-DD",
      "periodType": "quarterly|annual|monthly",
      "revenue": number or null,
      "ebitdaReported": number or null,
      "totalDebt": number or null,
      "interestExpense": number or null,
      "fixedCharges": number or null,
      "currentAssets": number or null,
      "currentLiabilities": number or null,
      "netWorth": number or null,
      "confidence": 0.85
    }
  ],
  "overallConfidence": 0.85,
  "extractionNotes": ["any notes about the extraction"]
}`;

const FINANCIAL_STATEMENT_PROMPT = `You are an expert financial analyst. Analyze this financial statement and extract key financial metrics.

EXTRACT THE FOLLOWING for each period:
- Period end date
- Revenue/Net Sales
- EBITDA or Operating Income
- Total Debt/Liabilities
- Interest Expense
- Current Assets
- Current Liabilities
- Net Worth/Shareholders' Equity

Return ONLY valid JSON in this exact format:
{
  "documentType": "financial_statement",
  "borrowerName": "string or null",
  "facilityName": null,
  "ebitdaDefinition": null,
  "ebitdaAddbacks": null,
  "covenants": null,
  "financialData": [
    {
      "periodEndDate": "YYYY-MM-DD",
      "periodType": "quarterly|annual|monthly",
      "revenue": number or null,
      "ebitdaReported": number or null,
      "totalDebt": number or null,
      "interestExpense": number or null,
      "fixedCharges": number or null,
      "currentAssets": number or null,
      "currentLiabilities": number or null,
      "netWorth": number or null,
      "confidence": 0.85
    }
  ],
  "overallConfidence": 0.85,
  "extractionNotes": []
}`;

const PROMPTS: Record<string, string> = {
  credit_agreement: CREDIT_AGREEMENT_PROMPT,
  compliance_certificate: COMPLIANCE_CERTIFICATE_PROMPT,
  financial_statement: FINANCIAL_STATEMENT_PROMPT,
  amendment: CREDIT_AGREEMENT_PROMPT, // Use same as credit agreement
  other: CREDIT_AGREEMENT_PROMPT,
};

/**
 * Extract data from a PDF using Claude's native PDF vision support
 * This sends the actual PDF to Claude which can "see" the document
 */
export async function extractFromPDFWithVision(
  pdfBuffer: Buffer,
  documentType: string
): Promise<PDFExtractionResult> {
  console.log(`[PDF Vision] Starting extraction for document type: ${documentType}`);
  console.log(`[PDF Vision] PDF size: ${pdfBuffer.length} bytes`);

  // Convert PDF to base64
  const base64Pdf = pdfBuffer.toString("base64");

  // Get the appropriate prompt
  const prompt = PROMPTS[documentType] || PROMPTS.credit_agreement;

  try {
    console.log(`[PDF Vision] Sending to Claude API...`);

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64Pdf,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    });

    console.log(`[PDF Vision] Received response from Claude`);

    // Extract the text content from the response
    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from Claude");
    }

    const responseText = textContent.text;
    console.log(`[PDF Vision] Response length: ${responseText.length} chars`);

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(`[PDF Vision] No JSON found in response: ${responseText.substring(0, 500)}`);
      throw new Error("No JSON found in Claude response");
    }

    const extractedData = JSON.parse(jsonMatch[0]);
    console.log(`[PDF Vision] Parsed extraction data, keys: ${Object.keys(extractedData).join(", ")}`);

    // Validate with schema
    const validated = PDFExtractionResultSchema.safeParse(extractedData);

    if (!validated.success) {
      console.error(`[PDF Vision] Validation errors:`, validated.error.issues);
      // Return partial data with lower confidence
      return {
        ...extractedData,
        documentType: documentType as PDFExtractionResult["documentType"],
        overallConfidence: 0.5,
        extractionNotes: [
          ...(extractedData.extractionNotes || []),
          "Validation warnings - some fields may be incomplete",
        ],
      };
    }

    console.log(`[PDF Vision] Extraction successful!`);
    console.log(`[PDF Vision] - Covenants found: ${validated.data.covenants?.length || 0}`);
    console.log(`[PDF Vision] - Financial periods: ${validated.data.financialData?.length || 0}`);
    console.log(`[PDF Vision] - Confidence: ${validated.data.overallConfidence}`);

    return validated.data;
  } catch (error) {
    console.error(`[PDF Vision] Extraction error:`, error);
    throw error;
  }
}

/**
 * Fallback text-based extraction using Claude
 * Used when PDF vision is not available or fails
 */
export async function extractFromTextWithClaude(
  documentText: string,
  documentType: string
): Promise<PDFExtractionResult> {
  console.log(`[Text Extraction] Starting text-based extraction`);
  console.log(`[Text Extraction] Text length: ${documentText.length} chars`);

  const prompt = PROMPTS[documentType] || PROMPTS.credit_agreement;

  // Truncate text if too long (Claude context limit)
  const maxLength = 100000;
  const truncatedText = documentText.length > maxLength
    ? documentText.substring(0, maxLength) + "\n\n[Document truncated...]"
    : documentText;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: `${prompt}\n\n---\nDOCUMENT TEXT:\n${truncatedText}`,
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from Claude");
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in Claude response");
    }

    const extractedData = JSON.parse(jsonMatch[0]);
    const validated = PDFExtractionResultSchema.safeParse(extractedData);

    if (!validated.success) {
      return {
        ...extractedData,
        documentType: documentType as PDFExtractionResult["documentType"],
        overallConfidence: 0.5,
        extractionNotes: ["Text-based extraction - lower confidence"],
      };
    }

    return validated.data;
  } catch (error) {
    console.error(`[Text Extraction] Error:`, error);
    throw error;
  }
}
