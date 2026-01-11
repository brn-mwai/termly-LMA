"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UploadSimple,
  FileText,
  X,
  CheckCircle,
  CircleNotch,
  WarningCircle,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type DocumentType =
  | "credit_agreement"
  | "compliance_certificate"
  | "financial_statement"
  | "amendment"
  | "other";

type UploadStatus = "pending" | "uploading" | "processing" | "complete" | "error";

interface UploadedFile {
  id: string;
  file: File;
  documentType: DocumentType;
  status: UploadStatus;
  progress: number;
  error?: string;
  documentId?: string;
}

interface Loan {
  id: string;
  name: string;
  borrowers?: { name: string } | null;
}

const documentTypeLabels: Record<DocumentType, string> = {
  credit_agreement: "Credit Agreement",
  compliance_certificate: "Compliance Certificate",
  financial_statement: "Financial Statement",
  amendment: "Amendment",
  other: "Other",
};

interface DocumentUploaderProps {
  loanId?: string;
  onComplete?: () => void;
}

export function DocumentUploader({ loanId: initialLoanId, onComplete }: DocumentUploaderProps) {
  const router = useRouter();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<string>(initialLoanId || "");
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(true);

  // Fetch loans on mount
  useEffect(() => {
    async function fetchLoans() {
      try {
        const res = await fetch("/api/loans");
        if (res.ok) {
          const { data } = await res.json();
          setLoans(data || []);
        }
      } catch (error) {
        console.error("Failed to fetch loans:", error);
      } finally {
        setLoadingLoans(false);
      }
    }
    fetchLoans();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      documentType: "credit_agreement" as DocumentType,
      status: "pending" as UploadStatus,
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateDocumentType = (id: string, type: DocumentType) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, documentType: type } : f))
    );
  };

  const uploadAndExtract = async (fileData: UploadedFile) => {
    const fileId = fileData.id;

    // Update to uploading
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, status: "uploading" as UploadStatus, progress: 10 } : f
      )
    );

    try {
      // Step 1: Upload the file
      const formData = new FormData();
      formData.append("file", fileData.file);
      formData.append("loan_id", selectedLoan);
      formData.append("document_type", fileData.documentType);

      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, progress: 30 } : f))
      );

      const uploadRes = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const error = await uploadRes.json();
        throw new Error(error.error?.message || "Upload failed");
      }

      const { data: uploadedDoc } = await uploadRes.json();
      const documentId = uploadedDoc.id;

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, progress: 50, documentId, status: "processing" as UploadStatus }
            : f
        )
      );

      // Step 2: Trigger extraction
      const extractRes = await fetch(`/api/documents/${documentId}/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, progress: 80 } : f))
      );

      if (!extractRes.ok) {
        // Try to parse error as JSON, fallback to status text
        let errorMessage = `Extraction failed (${extractRes.status})`;
        try {
          const errorData = await extractRes.json();
          errorMessage = errorData.error?.message || errorData.error || errorMessage;
        } catch {
          // Response is not JSON (e.g., 405 returns plain text)
          errorMessage = `Extraction failed: ${extractRes.statusText || extractRes.status}`;
        }
        // Even if extraction fails, the upload succeeded
        console.warn("Extraction warning:", errorMessage);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? { ...f, status: "complete" as UploadStatus, progress: 100 }
              : f
          )
        );
        return;
      }

      // Success
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, status: "complete" as UploadStatus, progress: 100 }
            : f
        )
      );
    } catch (error) {
      console.error("Upload/extract error:", error);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: "error" as UploadStatus,
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : f
        )
      );
    }
  };

  const handleUploadAll = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending");
    for (const file of pendingFiles) {
      await uploadAndExtract(file);
    }

    // Callback when complete
    if (onComplete) {
      onComplete();
    }

    // Refresh the page data
    router.refresh();
  };

  const getStatusIcon = (status: UploadStatus) => {
    switch (status) {
      case "pending":
        return <FileText className="h-5 w-5 text-muted-foreground" />;
      case "uploading":
        return <CircleNotch className="h-5 w-5 text-blue-500 animate-spin" />;
      case "processing":
        return <CircleNotch className="h-5 w-5 text-yellow-500 animate-spin" />;
      case "complete":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <WarningCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: UploadStatus) => {
    const variants = {
      pending: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
      uploading: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
      processing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
      complete: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
      error: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    };

    const labels = {
      pending: "Ready",
      uploading: "Uploading",
      processing: "Extracting",
      complete: "Complete",
      error: "Error",
    };

    return (
      <Badge variant="secondary" className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const isUploading = files.some((f) => f.status === "uploading" || f.status === "processing");

  return (
    <div className="space-y-6">
      {/* Loan Selection - only show if not pre-selected */}
      {!initialLoanId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Loan</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedLoan} onValueChange={setSelectedLoan}>
              <SelectTrigger className="w-full md:w-[400px]">
                <SelectValue placeholder={loadingLoans ? "Loading loans..." : "Select a loan to upload documents for"} />
              </SelectTrigger>
              <SelectContent>
                {loans.map((loan) => (
                  <SelectItem key={loan.id} value={loan.id}>
                    {loan.borrowers?.name ? `${loan.borrowers.name} - ` : ""}{loan.name}
                  </SelectItem>
                ))}
                {loans.length === 0 && !loadingLoans && (
                  <SelectItem value="" disabled>
                    No loans found. Create a loan first.
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Dropzone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 sm:p-12 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50",
              isUploading && "pointer-events-none opacity-50"
            )}
          >
            <input {...getInputProps()} disabled={isUploading} />
            <UploadSimple className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-4" />
            {isDragActive ? (
              <p className="text-lg font-medium">Drop files here...</p>
            ) : (
              <>
                <p className="text-base sm:text-lg font-medium mb-2">
                  Drag & drop PDF files here
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports: Credit Agreements, Compliance Certificates,
                  Financial Statements (PDF, max 50MB)
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base">Files ({files.length})</CardTitle>
            <Button
              onClick={handleUploadAll}
              disabled={!selectedLoan || pendingCount === 0 || isUploading}
            >
              {isUploading ? (
                <>
                  <CircleNotch className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <UploadSimple className="h-4 w-4 mr-2" />
                  Upload {pendingCount > 0 ? `(${pendingCount})` : "All"}
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getStatusIcon(file.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-medium truncate text-sm">{file.file.name}</p>
                        <span className="text-xs text-muted-foreground">
                          ({formatFileSize(file.file.size)})
                        </span>
                      </div>
                      {(file.status === "uploading" || file.status === "processing") && (
                        <Progress value={file.progress} className="h-1.5" />
                      )}
                      {file.status === "processing" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          AI extracting covenant terms...
                        </p>
                      )}
                      {file.status === "error" && file.error && (
                        <p className="text-xs text-red-500 mt-1">{file.error}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-8 sm:ml-0">
                    <Select
                      value={file.documentType}
                      onValueChange={(v) =>
                        updateDocumentType(file.id, v as DocumentType)
                      }
                      disabled={file.status !== "pending"}
                    >
                      <SelectTrigger className="w-[160px] h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(documentTypeLabels).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    {getStatusBadge(file.status)}
                    {file.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
