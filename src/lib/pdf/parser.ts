import { PDFParse } from "pdf-parse";

export interface PDFParseResult {
  text: string;
  numPages: number;
  metadata: {
    title?: string;
    author?: string;
    creationDate?: Date;
  };
}

/**
 * Extract text content from a PDF buffer
 */
export async function parsePDF(buffer: Buffer): Promise<PDFParseResult> {
  try {
    const parser = new PDFParse({ data: buffer });
    const [textResult, infoResult] = await Promise.all([
      parser.getText(),
      parser.getInfo(),
    ]);

    return {
      text: textResult.text || "",
      numPages: infoResult.total || 0,
      metadata: {
        title: infoResult.info?.Title as string | undefined,
        author: infoResult.info?.Author as string | undefined,
        creationDate: infoResult.info?.CreationDate
          ? new Date(infoResult.info.CreationDate as string)
          : undefined,
      },
    };
  } catch (error) {
    console.error("PDF parsing error:", error);
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
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getInfo();

  return {
    numPages: result.total || 0,
    title: result.info?.Title as string | undefined,
  };
}
