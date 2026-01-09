# Termly - One Day Build Guide (Part 2)

> **Continuation of the full build guide with complete code implementations**

---

## Phase 6: Documents & Extraction (Continued)

### Documents List Page

**src/app/(dashboard)/documents/page.tsx**
```typescript
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils/format';
import { Upload, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default async function DocumentsPage() {
  const { userId } = await auth();
  const supabase = await createClient();

  const { data: user } = await supabase
    .from('users')
    .select('org_id')
    .eq('clerk_id', userId)
    .single();

  const { data: documents } = await supabase
    .from('documents')
    .select('*, loans(borrower_name)')
    .eq('org_id', user?.org_id)
    .order('created_at', { ascending: false });

  const statusIcons: Record<string, any> = {
    uploaded: Clock,
    processing: Clock,
    processed: CheckCircle,
    error: AlertCircle,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="mt-1 text-sm text-gray-500">Upload and manage loan documents</p>
        </div>
        <Link
          href="/documents/upload"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Upload className="h-4 w-4" />
          Upload Document
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        {documents?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No documents uploaded yet
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Document</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Loan</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Uploaded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {documents?.map((doc: any) => {
                const StatusIcon = statusIcons[doc.status] || Clock;
                return (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link href={`/documents/${doc.id}`} className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <span className="font-medium text-blue-600 hover:text-blue-800">{doc.name}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{doc.loans?.borrower_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{doc.document_type}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-sm">
                        <StatusIcon className="h-4 w-4" />
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(doc.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
```

### Upload Page

**src/app/(dashboard)/documents/upload/page.tsx**
```typescript
'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedLoanId = searchParams.get('loan_id');

  const [file, setFile] = useState<File | null>(null);
  const [loanId, setLoanId] = useState(preselectedLoanId || '');
  const [documentType, setDocumentType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !loanId || !documentType) return;

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('loan_id', loanId);
    formData.append('document_type', documentType);

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const { data: doc } = await res.json();
      router.push(`/documents/${doc.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Document</h1>
        <p className="mt-1 text-sm text-gray-500">Upload a loan document for AI extraction</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow">
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {/* Drop Zone */}
        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="font-medium">{file.name}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="rounded p-1 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Drag and drop a PDF, or click to select
              </p>
            </>
          )}
        </div>

        {/* Loan Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Loan ID *</label>
          <input
            type="text"
            value={loanId}
            onChange={(e) => setLoanId(e.target.value)}
            placeholder="Enter loan ID or select from list"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Document Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Document Type *</label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Select type</option>
            <option value="credit_agreement">Credit Agreement</option>
            <option value="amendment">Amendment</option>
            <option value="financial_statement">Financial Statement</option>
            <option value="compliance_certificate">Compliance Certificate</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !file}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

### Document Detail with Extraction

**src/app/(dashboard)/documents/[id]/page.tsx**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/lib/utils/format';
import { ArrowLeft, FileText, Wand2, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function DocumentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [document, setDocument] = useState<any>(null);
  const [extraction, setExtraction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  async function fetchDocument() {
    const res = await fetch(`/api/documents/${id}`);
    const { data } = await res.json();
    setDocument(data);

    if (data.extractions?.length > 0) {
      setExtraction(data.extractions[0]);
    }
    setLoading(false);
  }

  async function triggerExtraction() {
    setExtracting(true);
    try {
      const res = await fetch(`/api/documents/${id}/extract`, { method: 'POST' });
      if (res.ok) {
        const { data } = await res.json();
        setExtraction(data);
        setDocument((prev: any) => ({ ...prev, extraction_status: 'review' }));
      }
    } finally {
      setExtracting(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!document) {
    return <div className="p-8 text-center">Document not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{document.name}</h1>
          <p className="text-sm text-gray-500">{document.document_type}</p>
        </div>
        {document.extraction_status === 'pending' && (
          <button
            onClick={triggerExtraction}
            disabled={extracting}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Wand2 className="h-4 w-4" />
            {extracting ? 'Extracting...' : 'Extract with AI'}
          </button>
        )}
      </div>

      {/* Document Info */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-medium text-gray-900">Document Info</h2>
          <dl className="mt-4 space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">File</dt>
              <dd className="text-sm font-medium">{document.original_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Type</dt>
              <dd className="text-sm font-medium">{document.document_type}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Status</dt>
              <dd className="text-sm font-medium">{document.status}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Extraction</dt>
              <dd className="text-sm font-medium">{document.extraction_status}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Uploaded</dt>
              <dd className="text-sm font-medium">{formatDate(document.created_at)}</dd>
            </div>
          </dl>
        </div>

        {/* Extraction Results */}
        {extraction && (
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Extracted Data</h2>
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                {(extraction.confidence_score * 100).toFixed(0)}% confidence
              </span>
            </div>
            <div className="mt-4 max-h-96 overflow-auto">
              <pre className="text-xs text-gray-700">
                {JSON.stringify(extraction.extracted_data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Phase 7: Alerts

### Alerts API

**src/app/api/alerts/route.ts**
```typescript
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';

    const { data: user } = await supabase
      .from('users')
      .select('org_id')
      .eq('clerk_id', userId)
      .single();

    if (!user) return errorResponse('NOT_FOUND', 'User not found', 404);

    let query = supabase
      .from('alerts')
      .select('*, loans(borrower_name), covenants(name)')
      .eq('org_id', user.org_id)
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
```

**src/app/api/alerts/[id]/route.ts**
```typescript
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    const updateData: any = { ...body };

    if (body.status === 'acknowledged') {
      updateData.acknowledged_by = user?.id;
      updateData.acknowledged_at = new Date().toISOString();
    }

    if (body.status === 'resolved') {
      updateData.resolved_by = user?.id;
      updateData.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('alerts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Alerts Page

**src/app/(dashboard)/alerts/page.tsx**
```typescript
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { AlertTable } from '@/components/alerts/alert-table';

export default async function AlertsPage() {
  const { userId } = await auth();
  const supabase = await createClient();

  const { data: user } = await supabase
    .from('users')
    .select('org_id')
    .eq('clerk_id', userId)
    .single();

  const { data: alerts } = await supabase
    .from('alerts')
    .select('*, loans(borrower_name), covenants(name)')
    .eq('org_id', user?.org_id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
        <p className="mt-1 text-sm text-gray-500">Monitor covenant breaches and warnings</p>
      </div>
      <AlertTable alerts={alerts || []} />
    </div>
  );
}
```

### Alert Table Component

**src/components/alerts/alert-table.tsx**
```typescript
'use client';

import Link from 'next/link';
import { formatDate } from '@/lib/utils/format';
import { SEVERITY_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils/cn';

interface Alert {
  id: string;
  type: string;
  severity: string;
  status: string;
  title: string;
  message: string;
  created_at: string;
  loans?: { borrower_name: string };
  covenants?: { name: string };
}

export function AlertTable({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-lg bg-white p-8 text-center shadow">
        <p className="text-gray-500">No alerts found</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Alert</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Loan</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Severity</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {alerts.map((alert) => (
            <tr key={alert.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <Link href={`/alerts/${alert.id}`} className="text-blue-600 hover:text-blue-800">
                  <div className="font-medium">{alert.title}</div>
                  <div className="text-sm text-gray-500">{alert.message}</div>
                </Link>
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">{alert.loans?.borrower_name}</td>
              <td className="px-6 py-4">
                <span className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-medium',
                  SEVERITY_COLORS[alert.severity as keyof typeof SEVERITY_COLORS]
                )}>
                  {alert.severity}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">{alert.status}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{formatDate(alert.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Phase 8: AI Chat Assistant

### Groq Client

**src/lib/ai/groq.ts**
```typescript
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chat(messages: ChatMessage[]) {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages,
    temperature: 0.1,
    max_tokens: 2048,
  });

  return {
    message: response.choices[0]?.message?.content || '',
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
    },
  };
}
```

### Chat System Prompt

**src/lib/ai/prompts/chat-system.ts**
```typescript
export const CHAT_SYSTEM_PROMPT = `You are Termly Assistant, an AI that helps credit analysts query their loan portfolio.

You can convert natural language questions into SQL queries and explain results.

Database tables:
- loans: id, borrower_name, borrower_industry, facility_name, commitment_amount, outstanding_amount, covenant_status, maturity_date
- covenants: id, loan_id, name, category (leverage/coverage/liquidity/capex), threshold_type (max/min), threshold_value, current_status
- covenant_tests: id, covenant_id, loan_id, test_date, actual_value, threshold_value, status, headroom_percent
- alerts: id, loan_id, type, severity, status, title, message
- financial_periods: id, loan_id, period_end, revenue, ebitda, total_debt

Guidelines:
1. Convert questions to SELECT queries only
2. Limit results to 20 rows
3. Format results clearly
4. Explain what the data means

Example:
User: "Show loans in breach"
\`\`\`sql
SELECT borrower_name, facility_name, covenant_status, outstanding_amount
FROM loans WHERE covenant_status = 'breach' AND deleted_at IS NULL
LIMIT 20
\`\`\``;
```

### Chat API

**src/app/api/chat/route.ts**
```typescript
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { chat, ChatMessage } from '@/lib/ai/groq';
import { CHAT_SYSTEM_PROMPT } from '@/lib/ai/prompts/chat-system';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    const supabase = await createClient();
    const { message, history = [] } = await request.json();

    if (!message) return errorResponse('VALIDATION_ERROR', 'Message required', 400);

    const messages: ChatMessage[] = [
      { role: 'system', content: CHAT_SYSTEM_PROMPT },
      ...history.slice(-10),
      { role: 'user', content: message },
    ];

    const aiResponse = await chat(messages);
    let queryResults = null;
    let finalResponse = aiResponse.message;

    // Check for SQL in response
    const sqlMatch = aiResponse.message.match(/```sql\n([\s\S]*?)\n```/);

    if (sqlMatch) {
      const sql = sqlMatch[1].trim();

      if (sql.toLowerCase().startsWith('select')) {
        try {
          const { data, error } = await supabase.rpc('execute_safe_query', {
            query_text: sql,
          });

          if (!error && data) {
            queryResults = data;

            // Format results
            const formatMessages: ChatMessage[] = [
              { role: 'system', content: 'Format these results clearly and concisely.' },
              { role: 'user', content: `Results: ${JSON.stringify(data)}\n\nFormat these for the user.` },
            ];

            const formatted = await chat(formatMessages);
            finalResponse = formatted.message;
          }
        } catch (e) {
          console.error('Query failed:', e);
        }
      }
    }

    return successResponse({
      message: finalResponse,
      sql: sqlMatch ? sqlMatch[1] : null,
      data: queryResults,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Chat Assistant Component

**src/components/chat/chat-assistant.tsx**
```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const { data } = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-blue-600 p-4 text-white shadow-lg hover:bg-blue-700"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[500px] w-[400px] flex-col rounded-lg bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="font-semibold">Termly Assistant</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <p className="text-center text-sm text-gray-500">
                Ask me about your loans, covenants, or alerts!
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-gray-100 px-4 py-2">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your portfolio..."
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
```

---

## Phase 9-11: See CLAUDE-CODE-PROMPT.md

The complete Tableau integration code, Memos, Audit, and Deployment instructions are in the main `CLAUDE-CODE-PROMPT.md` file in Phase 9.

---

## You Did It! 🎉

You've built a complete AI-powered loan covenant monitoring platform:

- ✅ 11 database tables
- ✅ ~50 API endpoints
- ✅ 30 frontend pages
- ✅ AI document extraction (Anthropic)
- ✅ NLP chat assistant (Groq)
- ✅ 4 Tableau dashboards
- ✅ Real-time alerts
- ✅ Audit trail
- ✅ Multi-tenant security

**Total estimated lines of code: ~5,000+**

Good luck with the hackathons!
