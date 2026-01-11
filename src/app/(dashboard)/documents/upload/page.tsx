'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, UploadSimple, FileText, X, CircleNotch } from '@phosphor-icons/react';
import { DOCUMENT_TYPES } from '@/lib/constants';

function UploadDocumentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedLoanId = searchParams.get('loan');

  const [file, setFile] = useState<File | null>(null);
  const [loanId, setLoanId] = useState<string>(preselectedLoanId || '');
  const [documentType, setDocumentType] = useState<string>('');
  const [loans, setLoans] = useState<any[]>([]);
  const [loansLoading, setLoansLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch loans for dropdown
    setLoansLoading(true);
    fetch('/api/loans')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch loans');
        return res.json();
      })
      .then((data) => {
        console.log('Loans fetched:', data);
        setLoans(data.data || []);
      })
      .catch((err) => {
        console.error('Error fetching loans:', err);
        setLoans([]);
      })
      .finally(() => setLoansLoading(false));
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      setError('Please select a file');
      return;
    }
    if (!loanId) {
      setError('Please select a loan');
      return;
    }
    if (!documentType) {
      setError('Please select a document type');
      return;
    }

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

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Upload failed');
      }

      const { data: doc } = await res.json();
      router.push(`/documents/${doc.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/documents">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-normal tracking-tight">Upload Document</h1>
          <p className="text-sm text-muted-foreground">
            Upload a loan document for AI-powered extraction
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Document File</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="flex items-center justify-center gap-4">
                  <FileText className="h-10 w-10 text-red-500" />
                  <div className="text-left">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <UploadSimple className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-lg font-medium">
                    Drag and drop a PDF file
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse (max 50MB)
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Document Details */}
        <Card>
          <CardHeader>
            <CardTitle>Document Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="loan">Select Loan * {loans.length > 0 && <span className="text-xs text-muted-foreground">({loans.length} available)</span>}</Label>
              {loansLoading ? (
                <div className="flex items-center gap-2 h-9 px-3 py-2 border rounded-md">
                  <CircleNotch className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading loans...</span>
                </div>
              ) : loans.length === 0 ? (
                <div className="flex flex-col gap-2">
                  <div className="h-9 px-3 py-2 border rounded-md text-sm text-muted-foreground">
                    No loans available - <a href="/loans/new" className="text-primary underline">create one</a> or seed demo data
                  </div>
                </div>
              ) : (
                <Select value={loanId} onValueChange={setLoanId}>
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue placeholder="Select a loan" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4} className="z-[100]">
                    {loans.map((loan: any) => (
                      <SelectItem key={loan.id} value={loan.id}>
                        {loan.borrowers?.name || 'Unknown'} - {loan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Document Type *</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/documents">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <CircleNotch className="h-4 w-4 mr-2 animate-spin" />}
            Upload & Extract
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function UploadDocumentPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-96">
        <CircleNotch className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <UploadDocumentContent />
    </Suspense>
  );
}
