import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractFromDocument, ExtractionResultSchema } from "@/lib/ai/extraction";
import { parsePDF, cleanupOCRWorker } from "@/lib/pdf/parser";
import { successResponse, errorResponse, handleApiError } from "@/lib/utils/api";
import { withRateLimit } from "@/lib/utils/rate-limit-middleware";
import { sendDocumentProcessedEmail } from "@/lib/email/service";

// Force Node.js runtime for pdf-parse and OCR support
export const runtime = "nodejs";
export const maxDuration = 120; // Allow up to 2 minutes for extraction

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Apply rate limiting for document extraction
    const rateLimitResult = await withRateLimit(request, { type: 'extract' });
    if (rateLimitResult) return rateLimitResult;

    const { userId } = await auth();
    if (!userId) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id: documentId } = await params;
    const supabase = createAdminClient();

    // Get user's organization
    const { data: userDataRaw } = await supabase
      .from("users")
      .select("id, organization_id")
      .eq("clerk_id", userId)
      .is("deleted_at", null)
      .single();

    const userData = userDataRaw as { id: string; organization_id: string } | null;
    if (!userData?.organization_id) {
      return errorResponse('NOT_FOUND', 'User not found', 404);
    }
    const orgId = userData.organization_id;

    // Get the document
    const { data: documentRaw, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("organization_id", orgId)
      .single();

    const document = documentRaw as {
      id: string;
      file_path: string;
      type: string;
      loan_id?: string;
    } | null;

    if (docError || !document) {
      return errorResponse('NOT_FOUND', 'Document not found', 404);
    }

    // Update status to processing
    await supabase
      .from("documents")
      .update({ extraction_status: "processing" } as never)
      .eq("id", documentId);

    let documentContent: string;

    // Check if content was provided in request (for re-extraction without re-downloading)
    const body = await request.json().catch(() => ({}));

    if (body.documentContent) {
      documentContent = body.documentContent;
    } else {
      // Download the file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("documents")
        .download(document.file_path);

      if (downloadError || !fileData) {
        await supabase
          .from("documents")
          .update({ extraction_status: "failed" } as never)
          .eq("id", documentId);
        return errorResponse('DOWNLOAD_FAILED', 'Failed to download document from storage', 500);
      }

      // Parse the PDF
      try {
        const buffer = Buffer.from(await fileData.arrayBuffer());
        console.log(`[Extract] Parsing PDF, size: ${buffer.length} bytes`);

        const pdfResult = await parsePDF(buffer);
        documentContent = pdfResult.text;

        console.log(`[Extract] PDF parsed successfully:`);
        console.log(`  - Method: ${pdfResult.extractionMethod}`);
        console.log(`  - Pages: ${pdfResult.numPages}`);
        console.log(`  - Text length: ${documentContent.length} chars`);

        // Update document with page count and extraction method
        await supabase
          .from("documents")
          .update({
            page_count: pdfResult.numPages,
            extraction_method: pdfResult.extractionMethod,
          } as never)
          .eq("id", documentId);

        // Cleanup OCR worker after use
        await cleanupOCRWorker().catch(() => {});
      } catch (parseError) {
        console.error("[Extract] PDF parse error:", parseError);
        await cleanupOCRWorker().catch(() => {});
        await supabase
          .from("documents")
          .update({ extraction_status: "failed" } as never)
          .eq("id", documentId);
        return errorResponse(
          'PDF_PARSE_FAILED',
          'Failed to parse PDF document',
          422,
          parseError instanceof Error ? parseError.message : undefined
        );
      }
    }

    // Perform multi-pass extraction
    const extractionResult = await extractFromDocument(
      documentContent,
      document.type || "credit_agreement"
    );

    // Validate the result
    const validated = ExtractionResultSchema.safeParse(extractionResult);

    if (!validated.success) {
      await supabase
        .from("documents")
        .update({ extraction_status: "needs_review" } as never)
        .eq("id", documentId);
      return errorResponse(
        'VALIDATION_FAILED',
        'Extraction result validation failed - document needs review',
        422,
        validated.error.issues
      );
    }

    // Store extracted data and update document
    await supabase
      .from("documents")
      .update({
        extraction_status: "completed",
        extracted_data: validated.data,
        confidence_scores: {
          overall: validated.data.overallConfidence,
          covenants: validated.data.covenants?.map((c) => c.confidence) || [],
          ebitda: validated.data.ebitdaAddbacks?.map((a) => a.confidence) || [],
        },
      } as never)
      .eq("id", documentId);

    // Create covenant records if covenants were extracted and loan_id exists
    if (validated.data.covenants && validated.data.covenants.length > 0 && document.loan_id) {
      for (const covenant of validated.data.covenants) {
        // Check if covenant already exists for this loan
        const { data: existingCovenant } = await supabase
          .from("covenants")
          .select("id")
          .eq("loan_id", document.loan_id)
          .eq("name", covenant.name)
          .single();

        if (!existingCovenant) {
          await supabase.from("covenants").insert({
            organization_id: orgId,
            loan_id: document.loan_id,
            name: covenant.name,
            type: covenant.type,
            operator: covenant.operator,
            threshold: covenant.threshold,
            testing_frequency: covenant.testingFrequency,
            grace_period_days: covenant.gracePeriodDays || null,
            definition_clause: covenant.sourceClause,
            extracted_from: documentId,
          } as never);
        }
      }
    }

    // Create financial period records if financial data was extracted
    if (validated.data.financialData && validated.data.financialData.length > 0 && document.loan_id) {
      for (const period of validated.data.financialData) {
        // Check if period already exists
        const { data: existingPeriod } = await supabase
          .from("financial_periods")
          .select("id")
          .eq("loan_id", document.loan_id)
          .eq("period_end_date", period.periodEndDate)
          .single();

        if (!existingPeriod) {
          await supabase.from("financial_periods").insert({
            organization_id: orgId,
            loan_id: document.loan_id,
            period_end_date: period.periodEndDate,
            period_type: period.periodType,
            revenue: period.revenue || null,
            ebitda_reported: period.ebitdaReported || null,
            total_debt: period.totalDebt || null,
            interest_expense: period.interestExpense || null,
            fixed_charges: period.fixedCharges || null,
            current_assets: period.currentAssets || null,
            current_liabilities: period.currentLiabilities || null,
            net_worth: period.netWorth || null,
            source_document_id: documentId,
          } as never);
        }
      }
    }

    // Log audit event
    await supabase.from("audit_logs").insert({
      organization_id: orgId,
      user_id: userData.id,
      action: "extract",
      entity_type: "document",
      entity_id: documentId,
      changes: {
        covenants_found: validated.data.covenants?.length || 0,
        financial_periods_found: validated.data.financialData?.length || 0,
        confidence: validated.data.overallConfidence,
      },
    } as never);

    // Send document processed email to the user who uploaded it
    const { data: fullUserData } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", userData.id)
      .single();

    const fullUser = fullUserData as { email: string; full_name: string | null } | null;

    // Get loan and borrower info for the email
    if (fullUser && document.loan_id) {
      const { data: loanData } = await supabase
        .from("loans")
        .select("name, borrowers(name)")
        .eq("id", document.loan_id)
        .single();

      const loan = loanData as { name: string; borrowers?: { name: string } } | null;

      // Get document name
      const { data: docNameData } = await supabase
        .from("documents")
        .select("name")
        .eq("id", documentId)
        .single();

      const docName = docNameData as { name: string } | null;

      // Determine extraction status based on confidence
      const extractionStatus = validated.data.overallConfidence >= 0.8 ? 'completed' : 'needs_review';

      sendDocumentProcessedEmail(fullUser.email, {
        userName: fullUser.full_name || fullUser.email.split('@')[0],
        documentId,
        documentName: docName?.name || 'Document',
        loanName: loan?.name || 'Unknown Loan',
        borrowerName: loan?.borrowers?.name || 'Unknown Borrower',
        extractionStatus,
        covenantsFound: validated.data.covenants?.length || 0,
        financialPeriodsFound: validated.data.financialData?.length || 0,
      }).catch((err) => {
        console.error('Failed to send document processed email:', err);
      });
    }

    return successResponse({
      documentId,
      extraction: validated.data,
      message: "Document extracted successfully",
    });
  } catch (error) {
    console.error("Extraction error:", error);

    // Try to update document status to failed
    try {
      const { id: documentId } = await params;
      const supabase = createAdminClient();
      await supabase
        .from("documents")
        .update({ extraction_status: "failed" } as never)
        .eq("id", documentId);
    } catch {
      // Ignore errors updating status
    }

    return errorResponse(
      'EXTRACTION_FAILED',
      'Failed to extract document',
      500,
      error instanceof Error ? error.message : undefined
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
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id: documentId } = await params;
    const supabase = createAdminClient();

    // Get user's organization
    const { data: userDataRaw } = await supabase
      .from("users")
      .select("organization_id")
      .eq("clerk_id", userId)
      .is("deleted_at", null)
      .single();

    const userData = userDataRaw as { organization_id: string } | null;
    if (!userData?.organization_id) {
      return errorResponse('NOT_FOUND', 'User not found', 404);
    }
    const orgId = userData.organization_id;

    // Get the document with extracted data
    const { data: docData, error } = await supabase
      .from("documents")
      .select("id, extraction_status, extracted_data, confidence_scores")
      .eq("id", documentId)
      .eq("organization_id", orgId)
      .single();

    const doc = docData as {
      id: string;
      extraction_status: string;
      extracted_data: unknown;
      confidence_scores: unknown;
    } | null;

    if (error || !doc) {
      return errorResponse('NOT_FOUND', 'Document not found', 404);
    }

    return successResponse({
      documentId: doc.id,
      status: doc.extraction_status,
      extraction: doc.extracted_data,
      confidenceScores: doc.confidence_scores,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
