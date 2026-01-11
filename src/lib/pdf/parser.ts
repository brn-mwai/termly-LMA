import { extractText, getDocumentProxy } from "unpdf";

export interface PDFParseResult {
  text: string;
  numPages: number;
  metadata: {
    title?: string;
    author?: string;
    creationDate?: Date;
  };
  extractionMethod: "text" | "ocr" | "hybrid";
}

/**
 * Extract text content from a PDF buffer
 * Uses unpdf which is serverless-compatible (works on Vercel)
 */
export async function parsePDF(buffer: Buffer): Promise<PDFParseResult> {
  try {
    console.log(`[PDF Parser] Starting to parse PDF, buffer size: ${buffer.length} bytes`);

    // Convert Buffer to Uint8Array for unpdf
    const uint8Array = new Uint8Array(buffer);

    // Extract text from PDF
    const { text, totalPages } = await extractText(uint8Array, { mergePages: true });

    console.log(`[PDF Parser] Extracted ${totalPages} pages, text length: ${text.length}`);

    // Try to get metadata
    let metadata: PDFParseResult["metadata"] = {};
    try {
      const pdf = await getDocumentProxy(uint8Array);
      const pdfMetadata = await pdf.getMetadata();
      if (pdfMetadata?.info) {
        const info = pdfMetadata.info as Record<string, unknown>;
        metadata = {
          title: info.Title as string | undefined,
          author: info.Author as string | undefined,
          creationDate: info.CreationDate
            ? new Date(info.CreationDate as string)
            : undefined,
        };
      }
    } catch (metaError) {
      console.warn("[PDF Parser] Could not extract metadata:", metaError);
    }

    return {
      text: String(text),
      numPages: totalPages,
      metadata,
      extractionMethod: "text",
    };
  } catch (error) {
    console.error("[PDF Parser] PDF parsing error:", error);
    throw new Error(
      `Failed to parse PDF: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Check if a buffer is a valid PDF
 */
export function isPDF(buffer: Buffer): boolean {
  // PDF files start with %PDF-
  const header = buffer.subarray(0, 5).toString();
  return header === "%PDF-";
}

/**
 * Get basic PDF info without full text extraction
 */
export async function getPDFInfo(buffer: Buffer): Promise<{
  numPages: number;
  title?: string;
}> {
  try {
    const uint8Array = new Uint8Array(buffer);
    const pdf = await getDocumentProxy(uint8Array);
    const metadata = await pdf.getMetadata();

    return {
      numPages: pdf.numPages,
      title: (metadata?.info as Record<string, unknown>)?.Title as string | undefined,
    };
  } catch (error) {
    console.error("[PDF Parser] PDF info extraction error:", error);
    return { numPages: 0 };
  }
}

/**
 * Cleanup function (kept for backwards compatibility)
 */
export async function cleanupOCRWorker(): Promise<void> {
  // No-op - unpdf doesn't need cleanup
}
