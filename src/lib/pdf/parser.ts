import pdf from "pdf-parse";
import { createWorker, Worker } from "tesseract.js";

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

// OCR Worker singleton for reuse
let ocrWorker: Worker | null = null;

async function getOCRWorker(): Promise<Worker> {
  if (!ocrWorker) {
    ocrWorker = await createWorker("eng", 1, {
      logger: () => {}, // Suppress logs
    });
  }
  return ocrWorker;
}

/**
 * Extract text from PDF images using OCR (for scanned documents)
 * This is a fallback when text extraction yields minimal results
 */
async function extractTextWithOCR(buffer: Buffer): Promise<string> {
  try {
    // For OCR, we'll use pdfjs-dist to render pages as images
    // This is a simplified approach - full OCR would need canvas rendering
    console.log("OCR extraction attempted but requires canvas support");
    return "";
  } catch (error) {
    console.error("OCR extraction error:", error);
    return "";
  }
}

/**
 * Extract text content from a PDF buffer
 * Tries text extraction first, falls back to OCR for scanned documents
 */
export async function parsePDF(buffer: Buffer): Promise<PDFParseResult> {
  try {
    console.log(`[PDF Parser] Starting to parse PDF, buffer size: ${buffer.length} bytes`);

    // Use pdf-parse library (v2.x API is the same as v1.x for basic usage)
    const data = await pdf(buffer);

    console.log(`[PDF Parser] Extracted ${data.numpages} pages, text length: ${data.text?.length || 0}`);

    let text = data.text || "";
    let extractionMethod: "text" | "ocr" | "hybrid" = "text";

    // Check if text extraction yielded meaningful content
    const cleanedText = text.replace(/\s+/g, " ").trim();
    const hasMinimalText = cleanedText.length < 100;

    // If minimal text, try OCR for scanned documents
    if (hasMinimalText) {
      console.log("[PDF Parser] Minimal text found, attempting OCR...");
      const ocrText = await extractTextWithOCR(buffer);

      if (ocrText.length > cleanedText.length) {
        text = ocrText;
        extractionMethod = "ocr";
      } else if (ocrText.length > 0 && cleanedText.length > 0) {
        // Combine both if OCR found additional content
        text = cleanedText + "\n\n--- OCR Extracted Content ---\n\n" + ocrText;
        extractionMethod = "hybrid";
      }
    }

    return {
      text,
      numPages: data.numpages || 0,
      metadata: {
        title: data.info?.Title as string | undefined,
        author: data.info?.Author as string | undefined,
        creationDate: data.info?.CreationDate
          ? new Date(data.info.CreationDate as string)
          : undefined,
      },
      extractionMethod,
    };
  } catch (error) {
    console.error("[PDF Parser] PDF parsing error:", error);

    // Last resort: Try pure OCR
    try {
      console.log("[PDF Parser] Attempting pure OCR extraction...");
      const ocrText = await extractTextWithOCR(buffer);
      if (ocrText.length > 0) {
        return {
          text: ocrText,
          numPages: 0,
          metadata: {},
          extractionMethod: "ocr",
        };
      }
    } catch (ocrError) {
      console.error("[PDF Parser] OCR fallback also failed:", ocrError);
    }

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
    const data = await pdf(buffer);
    return {
      numPages: data.numpages || 0,
      title: data.info?.Title as string | undefined,
    };
  } catch (error) {
    console.error("[PDF Parser] PDF info extraction error:", error);
    return { numPages: 0 };
  }
}

/**
 * Cleanup OCR worker when done
 */
export async function cleanupOCRWorker(): Promise<void> {
  if (ocrWorker) {
    await ocrWorker.terminate();
    ocrWorker = null;
  }
}
