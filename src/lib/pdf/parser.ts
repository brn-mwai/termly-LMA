import { PDFParse } from "pdf-parse";

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
 * Uses pdf-parse v2.x class-based API
 */
export async function parsePDF(buffer: Buffer): Promise<PDFParseResult> {
  let parser: PDFParse | null = null;

  try {
    console.log(`[PDF Parser] Starting to parse PDF, buffer size: ${buffer.length} bytes`);

    // Create parser instance with buffer data
    parser = new PDFParse({ data: buffer });

    // Get document info for metadata
    const info = await parser.getInfo();

    // Extract text content
    const textResult = await parser.getText();

    // Combine text from all pages
    const text = textResult.pages.map(page => page.text).join("\n\n");

    console.log(`[PDF Parser] Extracted ${textResult.total} pages, text length: ${text.length}`);

    return {
      text,
      numPages: textResult.total,
      metadata: {
        title: (info.info as Record<string, unknown>)?.Title as string | undefined,
        author: (info.info as Record<string, unknown>)?.Author as string | undefined,
        creationDate: (info.info as Record<string, unknown>)?.CreationDate
          ? new Date((info.info as Record<string, unknown>).CreationDate as string)
          : undefined,
      },
      extractionMethod: "text",
    };
  } catch (error) {
    console.error("[PDF Parser] PDF parsing error:", error);
    throw new Error(
      `Failed to parse PDF: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  } finally {
    // Clean up parser resources
    if (parser) {
      await parser.destroy().catch(() => {});
    }
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
  let parser: PDFParse | null = null;

  try {
    parser = new PDFParse({ data: buffer });
    const info = await parser.getInfo();
    return {
      numPages: info.total,
      title: (info.info as Record<string, unknown>)?.Title as string | undefined,
    };
  } catch (error) {
    console.error("[PDF Parser] PDF info extraction error:", error);
    return { numPages: 0 };
  } finally {
    if (parser) {
      await parser.destroy().catch(() => {});
    }
  }
}

/**
 * Cleanup function (kept for backwards compatibility)
 * No longer needed with pdf-parse v2.x as resources are cleaned up per-call
 */
export async function cleanupOCRWorker(): Promise<void> {
  // No-op - resources are now cleaned up per-call in parsePDF
}
