"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, CircleNotch, Download, X } from "@phosphor-icons/react";
import { toast } from "sonner";

interface DocumentPreviewButtonProps {
  documentId: string;
  documentName: string;
}

export function DocumentPreviewButton({
  documentId,
  documentName,
}: DocumentPreviewButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPreview = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/documents/${documentId}/preview`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to load preview");
      }

      const data = await response.json();
      setPreviewUrl(data.data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load preview");
      toast.error("Could not load document preview");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !previewUrl) {
      loadPreview();
    }
  };

  const handleDownload = async () => {
    if (!previewUrl) return;

    try {
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = documentName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      toast.error("Failed to download document");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
          <DialogTitle className="truncate pr-4">{documentName}</DialogTitle>
          <div className="flex items-center gap-2">
            {previewUrl && (
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <CircleNotch className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <X className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{error}</p>
              <Button variant="outline" className="mt-4" onClick={loadPreview}>
                Try Again
              </Button>
            </div>
          )}
          {previewUrl && !loading && !error && (
            <iframe
              src={previewUrl}
              className="w-full h-full border-0"
              title={documentName}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
