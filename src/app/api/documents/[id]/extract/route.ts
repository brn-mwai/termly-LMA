import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { extractFromDocument, ExtractionResultSchema } from "@/lib/ai/extraction";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: documentId } = await params;
    const body = await request.json();
    const { documentContent, documentType } = body;

    if (!documentContent) {
      return NextResponse.json(
        { error: "Document content is required" },
        { status: 400 }
      );
    }

    // Perform multi-pass extraction
    const extractionResult = await extractFromDocument(
      documentContent,
      documentType || "credit_agreement"
    );

    // Validate the result
    const validated = ExtractionResultSchema.safeParse(extractionResult);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: "Extraction validation failed",
          details: validated.error.issues,
        },
        { status: 422 }
      );
    }

    // In a real implementation, you would:
    // 1. Update the document record with extraction status
    // 2. Store the extracted data
    // 3. Create covenant and financial period records
    // 4. Generate alerts if needed

    return NextResponse.json({
      success: true,
      documentId,
      extraction: validated.data,
      message: "Document extracted successfully",
    });
  } catch (error) {
    console.error("Extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract document" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: documentId } = await params;

    // In a real implementation, fetch the extraction result from the database
    // For now, return a mock response
    return NextResponse.json({
      documentId,
      status: "completed",
      extraction: {
        documentType: "credit_agreement",
        borrowerName: "Acme Corporation",
        facilityName: "Senior Term Loan",
        ebitdaDefinition:
          'Consolidated EBITDA means, for any period, Consolidated Net Income plus...',
        ebitdaAddbacks: [
          {
            category: "non-cash",
            description: "Non-cash stock compensation expense",
            cap: "5% of EBITDA",
            confidence: 0.95,
          },
          {
            category: "restructuring",
            description: "Restructuring charges",
            cap: "$10M per fiscal year",
            confidence: 0.92,
          },
        ],
        covenants: [
          {
            name: "Total Leverage Ratio",
            type: "leverage",
            operator: "max",
            threshold: 5.0,
            testingFrequency: "quarterly",
            sourceClause:
              "The Borrower shall not permit the Total Leverage Ratio as of the last day of any fiscal quarter to exceed 5.00 to 1.00.",
            confidence: 0.98,
          },
          {
            name: "Interest Coverage Ratio",
            type: "interest_coverage",
            operator: "min",
            threshold: 2.0,
            testingFrequency: "quarterly",
            sourceClause:
              "The Borrower shall not permit the Interest Coverage Ratio as of the last day of any fiscal quarter to be less than 2.00 to 1.00.",
            confidence: 0.97,
          },
        ],
        overallConfidence: 0.95,
      },
    });
  } catch (error) {
    console.error("Get extraction error:", error);
    return NextResponse.json(
      { error: "Failed to get extraction result" },
      { status: 500 }
    );
  }
}
