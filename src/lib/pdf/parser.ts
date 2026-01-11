import { PDFParse } from "pdf-parse";
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
 */
async function extractTextWithOCR(buffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: buffer });
    const imageResult = await parser.getImage();

    if (!imageResult.pages || imageResult.pages.length === 0) {
      return "";
    }

    const worker = await getOCRWorker();
    const textParts: string[] = [];

    // Process each page's images with OCR
    let processedImages = 0;
    for (const page of imageResult.pages) {
      if (processedImages >= 20) break; // Limit to 20 images total

      for (const image of page.images) {
        if (processedImages >= 20) break;

        try {
          if (image.data && image.data.length > 0) {
            // Convert Uint8Array to Buffer for tesseract.js
            const imageBuffer = Buffer.from(image.data);
            const { data } = await worker.recognize(imageBuffer);
            if (data.text && data.text.trim().length > 0) {
              textParts.push(data.text);
            }
            processedImages++;
          }
        } catch (imgError) {
          console.warn("Failed to OCR image:", imgError);
        }
      }
    }

    return textParts.join("\n\n");
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
    const parser = new PDFParse({ data: buffer });

    // Get text and info in parallel
    const [textResult, infoResult] = await Promise.all([
      parser.getText().catch((err) => {
        console.warn("Text extraction failed:", err);
        return { text: "", pages: [], total: 0 };
      }),
      parser.getInfo().catch((err) => {
        console.warn("Info extraction failed:", err);
        return { total: 0, info: {} };
      }),
    ]);

    let text = textResult.text || "";
    let extractionMethod: "text" | "ocr" | "hybrid" = "text";

    // Check if text extraction yielded meaningful content
    const cleanedText = text.replace(/\s+/g, " ").trim();
    const hasMinimalText = cleanedText.length < 100;

    // If minimal text, try OCR for scanned documents
    if (hasMinimalText) {
      console.log("Minimal text found, attempting OCR...");
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

    // Clean up the parser
    await parser.destroy().catch(() => {});

    return {
      text,
      numPages: infoResult.total || 0,
      metadata: {
        title: infoResult.info?.Title as string | undefined,
        author: infoResult.info?.Author as string | undefined,
        creationDate: infoResult.info?.CreationDate
          ? new Date(infoResult.info.CreationDate as string)
          : undefined,
      },
      extractionMethod,
    };
  } catch (error) {
    console.error("PDF parsing error:", error);

    // Last resort: Try pure OCR
    try {
      console.log("Attempting pure OCR extraction...");
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
      console.error("OCR fallback also failed:", ocrError);
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
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getInfo();
    await parser.destroy().catch(() => {});

    return {
      numPages: result.total || 0,
      title: result.info?.Title as string | undefined,
    };
  } catch (error) {
    console.error("PDF info extraction error:", error);
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
