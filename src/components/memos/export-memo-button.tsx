"use client";

import { Button } from "@/components/ui/button";
import { FilePdf } from "@phosphor-icons/react";
import { exportMemoToPDF, downloadPDF } from "@/lib/pdf/export";

interface ExportMemoButtonProps {
  memo: {
    title: string;
    content: string;
    created_at: string;
    generated_by_ai?: boolean;
    users?: { full_name?: string };
    loans?: {
      name?: string;
      borrowers?: { name?: string };
    };
  };
}

export function ExportMemoButton({ memo }: ExportMemoButtonProps) {
  const handleExport = () => {
    const doc = exportMemoToPDF({
      title: memo.title,
      content: memo.content,
      author: memo.users?.full_name || "System",
      createdAt: new Date(memo.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      borrowerName: memo.loans?.borrowers?.name,
      loanName: memo.loans?.name,
      generatedByAi: memo.generated_by_ai,
    });

    // Create a safe filename
    const safeTitle = memo.title
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 50);
    downloadPDF(doc, `Termly_Memo_${safeTitle}`);
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <FilePdf className="h-4 w-4 mr-2" />
      Export PDF
    </Button>
  );
}
