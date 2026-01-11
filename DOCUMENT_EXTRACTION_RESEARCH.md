# Document Extraction Research for Termly

## Executive Summary

After extensive research, **Claude's native PDF support with vision** is the best approach for Termly's covenant extraction needs. It provides:
- Direct PDF processing without intermediate text extraction
- Visual understanding of tables, charts, and complex layouts
- High accuracy for financial documents
- Simple implementation via base64 encoding

---

## Research Findings

### 1. OpenAI GPT-4 Vision

**Capabilities:**
- Native PDF file input support (announced late 2024)
- Extracts both text and images from PDFs
- Works with GPT-4o, GPT-4o-mini, and o1 models
- Can provide PDFs as base64 or file IDs

**Implementation:**
- Upload via `/v1/files` endpoint or send base64 directly
- Structured JSON extraction via prompt engineering
- No custom model training required

**Limitations:**
- Azure OpenAI does NOT support direct PDF input (requires workarounds)
- Requires image conversion for some use cases

**Sources:**
- [OpenAI PDF Files Guide](https://platform.openai.com/docs/guides/pdf-files)
- [Azure OpenAI PDF Extraction Sample](https://github.com/Azure-Samples/azure-openai-gpt-4-vision-pdf-extraction-sample)

---

### 2. Anthropic Claude (RECOMMENDED)

**Capabilities:**
- Native PDF support since late 2024
- Full multimodal processing (text + vision) since February 2025
- Each page converted to image + text extraction
- Up to 32MB file size, 100 pages per request
- URL source blocks for streaming documents directly

**Implementation Methods:**
1. **Base64 encoding** - Send PDF as base64 in document content block
2. **Files API** - Upload once, reference by file_id (Beta)
3. **URL reference** - Stream directly from public URL

**TypeScript Example:**
```typescript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

// Fetch and encode PDF
const pdfBuffer = await fetch(pdfUrl).then(r => r.arrayBuffer());
const base64Pdf = Buffer.from(pdfBuffer).toString("base64");

const response = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 4096,
  messages: [{
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
        text: "Extract all financial covenants from this document...",
      },
    ],
  }],
});
```

**Pricing (2025):**
- Sonnet 4: ~$3 per million image tokens, $0.30 per million text tokens
- 50-page document: ~$0.38 with full vision

**Sources:**
- [Claude PDF Support Docs](https://docs.claude.com/en/docs/build-with-claude/pdf-support)
- [Claude Vision Docs](https://platform.claude.com/docs/en/build-with-claude/vision)
- [Anthropic PDF Processing API](https://towardsdatascience.com/introducing-the-new-anthropic-pdf-processing-api-0010657f595f/)

---

### 3. Google Gemini

**Capabilities:**
- Native PDF processing with vision
- Up to 1,000 pages, 50MB file size
- Multimodal analysis of charts, diagrams, handwriting
- "Derendering" - converts visual documents to structured code (HTML, tables)
- Gemini 3 Pro: highly accurate OCR + visual reasoning

**Implementation:**
- Upload via Files API or Cloud Storage
- Direct UI upload (7MB limit)

**Key Feature - Gemini 3:**
- `media_resolution` parameter (low/medium/high)
- Native text extraction from PDFs
- Converts complex tables accurately

**Sources:**
- [Gemini Document Processing](https://ai.google.dev/gemini-api/docs/document-processing)
- [Gemini PDF Extraction with Genkit](https://peterfriese.dev/blog/2025/gemini-genkit-pdf-structured-data/)

---

### 4. Specialized APIs Comparison

| Provider | Accuracy | Price | Best For |
|----------|----------|-------|----------|
| **Reducto** | 99.24% | $0.015/page | Financial docs, complex tables |
| **LlamaParse** | Good | Free tier + paid | RAG pipelines |
| **Unstructured.io** | 75-100% | Varies | Enterprise pipelines |
| **Azure Doc Intelligence** | High | ~$0.03/page | Invoices, receipts |
| **Google Document AI** | High | 500 pages free/month | Structured forms |

---

### 5. Node.js PDF-to-Image Libraries

For vision-based processing, PDFs may need conversion to images:

| Library | Vercel Compatible | Notes |
|---------|-------------------|-------|
| **pdf-to-img** | Yes (Node runtime) | Latest v5.0.0, actively maintained |
| **pdf-to-img-vercel** | Yes | Fork for Vercel, older (2 years) |
| **pdf2pic** | Yes | Supports base64, buffer output |
| **pdftoimg-js** | Yes | Works in browser + Node |

**Note:** Claude and OpenAI now accept PDFs directly - no conversion needed.

---

## Recommended Architecture for Termly

### Option A: Claude Native PDF (RECOMMENDED)

```
User Upload → Supabase Storage → Fetch PDF → Base64 Encode → Claude API → Structured JSON
```

**Pros:**
- Highest accuracy for financial documents
- Visual understanding of tables and layouts
- No intermediate processing
- Simple implementation

**Cons:**
- Cost per document (~$0.10-0.50 for typical credit agreements)
- 100 page limit per request

### Option B: Hybrid (Claude + Fallback)

```
User Upload → Supabase Storage → Try Claude PDF → If fail → Text extraction + Groq
```

**Pros:**
- Cost optimization
- Fallback for edge cases

### Option C: Multi-Provider

```
User Upload → Supabase Storage → Reducto API → Structured Data
```

**Pros:**
- Highest accuracy (99%+)
- Specialized for financial documents

**Cons:**
- Additional API cost
- External dependency

---

## Implementation Plan for Termly

### Phase 1: Claude Native PDF Support

1. Update extraction to send PDF as base64 to Claude
2. Use `claude-sonnet-4-20250514` model with document type
3. Structured extraction prompt for covenants, EBITDA, financials
4. Store results in database

### Phase 2: Enhanced Extraction Prompts

1. Multi-pass extraction for different document sections
2. Validation with Zod schemas
3. Confidence scoring based on extraction quality

### Phase 3: User Experience

1. Upload progress indicator
2. Real-time extraction status
3. Manual review for low-confidence extractions
4. Edit/correct extracted data

---

## Code Implementation

### Key Files to Update:

1. `src/lib/ai/extraction.ts` - Use Claude PDF support
2. `src/app/api/documents/[id]/extract/route.ts` - Send base64 PDF
3. `src/lib/pdf/parser.ts` - Optional, keep for text fallback

### Claude PDF Extraction Function:

```typescript
import Anthropic from "@anthropic-ai/sdk";

export async function extractWithClaudePDF(
  pdfBuffer: Buffer,
  documentType: string
): Promise<ExtractionResult> {
  const anthropic = new Anthropic();
  const base64Pdf = pdfBuffer.toString("base64");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    messages: [{
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
          text: EXTRACTION_PROMPT_FOR_TYPE[documentType],
        },
      ],
    }],
  });

  // Parse and validate response
  return parseExtractionResponse(response);
}
```

---

## Conclusion

**Use Claude's native PDF support** for Termly's document extraction. It provides:

1. **Best accuracy** for financial documents with complex tables
2. **Visual understanding** of document layout and structure
3. **Simple implementation** via base64 encoding
4. **No additional dependencies** - uses existing Anthropic SDK

The estimated cost per document is $0.10-0.50, which is reasonable for the value provided (hours of manual work saved).

---

## Sources

- [OpenAI PDF Files Guide](https://platform.openai.com/docs/guides/pdf-files)
- [Claude PDF Support Docs](https://docs.claude.com/en/docs/build-with-claude/pdf-support)
- [Claude Vision Docs](https://platform.claude.com/docs/en/build-with-claude/vision)
- [Gemini Document Processing](https://ai.google.dev/gemini-api/docs/document-processing)
- [Reducto AI](https://reducto.ai/)
- [pdf-to-img npm](https://www.npmjs.com/package/pdf-to-img)
- [Anthropic PDF Processing API](https://towardsdatascience.com/introducing-the-new-anthropic-pdf-processing-api-0010657f595f/)
