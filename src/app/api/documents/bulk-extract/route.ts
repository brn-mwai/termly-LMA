import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { successResponse, errorResponse, handleApiError } from "@/lib/utils/api";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for bulk operations

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return errorResponse("UNAUTHORIZED", "Authentication required", 401);
    }

    const { documentIds } = await request.json();

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return errorResponse("BAD_REQUEST", "documentIds array is required", 400);
    }

    if (documentIds.length > 10) {
      return errorResponse("BAD_REQUEST", "Maximum 10 documents can be extracted at once", 400);
    }

    const supabase = createAdminClient();

    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("clerk_id", userId)
      .is("deleted_at", null)
      .single();

    if (!userData?.organization_id) {
      return errorResponse("NOT_FOUND", "User not found", 404);
    }

    const orgId = userData.organization_id;

    // Verify all documents belong to this organization and are pending
    const { data: documents, error: docError } = await supabase
      .from("documents")
      .select("id, name, extraction_status")
      .in("id", documentIds)
      .eq("organization_id", orgId)
      .is("deleted_at", null);

    if (docError) {
      return errorResponse("DATABASE_ERROR", docError.message, 500);
    }

    if (!documents || documents.length === 0) {
      return errorResponse("NOT_FOUND", "No documents found", 404);
    }

    // Filter to only pending documents
    interface DocumentRecord {
      id: string;
      name: string;
      extraction_status: string;
    }

    const pendingDocs = (documents as DocumentRecord[]).filter(
      (d) => d.extraction_status === "pending" || d.extraction_status === "failed"
    );

    const alreadyProcessed = (documents as DocumentRecord[]).filter(
      (d) => d.extraction_status === "completed" || d.extraction_status === "processing"
    );

    if (pendingDocs.length === 0) {
      return successResponse({
        queued: 0,
        skipped: alreadyProcessed.length,
        message: "All documents are already processed or processing",
        documents: alreadyProcessed.map((d) => ({
          id: d.id,
          name: d.name,
          status: d.extraction_status,
        })),
      });
    }

    // Mark all pending documents as "processing"
    const pendingIds = pendingDocs.map((d) => d.id);
    await supabase
      .from("documents")
      .update({ extraction_status: "queued" } as never)
      .in("id", pendingIds);

    // Get the base URL for calling the extraction API
    const baseUrl = request.headers.get("origin") || `https://${request.headers.get("host")}`;

    // Queue extractions (fire and forget - they run async)
    const extractionPromises = pendingIds.map(async (docId) => {
      try {
        // Update to processing
        await supabase
          .from("documents")
          .update({ extraction_status: "processing" } as never)
          .eq("id", docId);

        // Call the extraction endpoint
        const response = await fetch(`${baseUrl}/api/documents/${docId}/extract`, {
          method: "POST",
          headers: {
            Cookie: request.headers.get("cookie") || "",
          },
        });

        return {
          documentId: docId,
          success: response.ok,
          status: response.status,
        };
      } catch (error) {
        console.error(`Bulk extract error for ${docId}:`, error);
        return {
          documentId: docId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    // Don't await all - just start them and return
    // The extractions will run in the background
    Promise.all(extractionPromises).catch((err) => {
      console.error("Bulk extraction batch error:", err);
    });

    return successResponse({
      queued: pendingDocs.length,
      skipped: alreadyProcessed.length,
      message: `${pendingDocs.length} documents queued for extraction`,
      documents: [
        ...pendingDocs.map((d) => ({
          id: d.id,
          name: d.name,
          status: "queued",
        })),
        ...alreadyProcessed.map((d) => ({
          id: d.id,
          name: d.name,
          status: d.extraction_status,
          skipped: true,
        })),
      ],
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// GET endpoint to check bulk extraction status
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return errorResponse("UNAUTHORIZED", "Authentication required", 401);
    }

    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      return errorResponse("BAD_REQUEST", "ids parameter is required", 400);
    }

    const documentIds = idsParam.split(",");
    const supabase = createAdminClient();

    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("clerk_id", userId)
      .is("deleted_at", null)
      .single();

    if (!userData?.organization_id) {
      return errorResponse("NOT_FOUND", "User not found", 404);
    }

    const orgId = userData.organization_id;

    // Get document statuses
    const { data: documents } = await supabase
      .from("documents")
      .select("id, name, extraction_status, extraction_method")
      .in("id", documentIds)
      .eq("organization_id", orgId);

    interface DocumentStatus {
      id: string;
      name: string;
      extraction_status: string;
      extraction_method?: string;
    }

    const docs = (documents || []) as DocumentStatus[];
    const completed = docs.filter((d) => d.extraction_status === "completed").length;
    const processing = docs.filter(
      (d) => d.extraction_status === "processing" || d.extraction_status === "queued"
    ).length;
    const failed = docs.filter((d) => d.extraction_status === "failed").length;

    return successResponse({
      total: docs.length,
      completed,
      processing,
      failed,
      allComplete: processing === 0,
      documents: docs.map((d) => ({
        id: d.id,
        name: d.name,
        status: d.extraction_status,
        method: d.extraction_method,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
