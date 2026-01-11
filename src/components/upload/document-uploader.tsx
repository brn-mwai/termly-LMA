"use client";

import { useState, useCallback } from "react";
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
}

const documentTypeLabels: Record<DocumentType, string> = {
  credit_agreement: "Credit Agreement",
  compliance_certificate: "Compliance Certificate",
  financial_statement: "Financial Statement",
  amendment: "Amendment",
  other: "Other",
};

export function DocumentUploader() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<string>("");

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

  const simulateUpload = async (fileId: string) => {
    // Update to uploading
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, status: "uploading" as UploadStatus } : f
      )
    );

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((r) => setTimeout(r, 200));
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, progress: i } : f))
      );
    }

    // Update to processing
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, status: "processing" as UploadStatus } : f
      )
    );

    // Simulate processing
    await new Promise((r) => setTimeout(r, 2000));

    // Complete
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, status: "complete" as UploadStatus } : f
      )
    );
  };

  const handleUploadAll = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending");
    for (const file of pendingFiles) {
      await simulateUpload(file.id);
    }
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
      processing: "AI Extracting",
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

  return (
    <div className="space-y-6">
      {/* Loan Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Loan</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedLoan} onValueChange={setSelectedLoan}>
            <SelectTrigger className="w-full md:w-[400px]">
              <SelectValue placeholder="Select a loan to upload documents for" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="loan-1">
                Acme Corporation - Senior Term Loan
              </SelectItem>
              <SelectItem value="loan-2">
                Beta Industries - Revolver
              </SelectItem>
              <SelectItem value="loan-3">
                Gamma Holdings - Term Loan B
              </SelectItem>
              <SelectItem value="loan-4">
                Delta Manufacturing - Senior Secured
              </SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Dropzone */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            )}
          >
            <input {...getInputProps()} />
            <UploadSimple className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            {isDragActive ? (
              <p className="text-lg font-medium">Drop files here...</p>
            ) : (
              <>
                <p className="text-lg font-medium mb-2">
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Files ({files.length})</CardTitle>
            <Button
              onClick={handleUploadAll}
              disabled={
                !selectedLoan || files.every((f) => f.status !== "pending")
              }
            >
              <UploadSimple className="h-4 w-4 mr-2" />
              Upload All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-4 p-4 rounded-lg border"
                >
                  {getStatusIcon(file.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{file.file.name}</p>
                      <span className="text-sm text-muted-foreground">
                        ({formatFileSize(file.file.size)})
                      </span>
                    </div>
                    {file.status === "uploading" && (
                      <Progress value={file.progress} className="h-2" />
                    )}
                    {file.status === "processing" && (
                      <p className="text-sm text-muted-foreground">
                        AI is extracting covenant terms and financial data...
                      </p>
                    )}
                  </div>
                  <Select
                    value={file.documentType}
                    onValueChange={(v) =>
                      updateDocumentType(file.id, v as DocumentType)
                    }
                    disabled={file.status !== "pending"}
                  >
                    <SelectTrigger className="w-[180px]">
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
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
