"use client";

import * as React from "react";
import { DownloadSimple, Spinner, Check } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ExportOption {
  type: string;
  label: string;
}

interface ExportButtonProps {
  options?: ExportOption[];
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

const defaultOptions: ExportOption[] = [
  { type: "loans", label: "Export Loans" },
  { type: "covenants", label: "Export Covenants" },
  { type: "financial-periods", label: "Export Financial Data" },
  { type: "alerts", label: "Export Alerts" },
];

export function ExportButton({
  options = defaultOptions,
  className,
  variant = "outline",
  size = "default",
}: ExportButtonProps) {
  const [exporting, setExporting] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const handleExport = async (type: string) => {
    setExporting(type);
    setSuccess(null);

    try {
      const response = await fetch(`/api/export?type=${type}`);

      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `${type}-export.csv`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      // Download the file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess(type);
      setTimeout(() => setSuccess(null), 2000);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setExporting(null);
    }
  };

  if (options.length === 1) {
    const option = options[0];
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => handleExport(option.type)}
        disabled={exporting !== null}
        className={cn("gap-2", className)}
      >
        {exporting === option.type ? (
          <Spinner className="h-4 w-4 animate-spin" />
        ) : success === option.type ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <DownloadSimple className="h-4 w-4" />
        )}
        {option.label}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={exporting !== null}
          className={cn("gap-2", className)}
        >
          {exporting ? (
            <Spinner className="h-4 w-4 animate-spin" />
          ) : (
            <DownloadSimple className="h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.type}
            onClick={() => handleExport(option.type)}
            disabled={exporting !== null}
            className="gap-2"
          >
            {exporting === option.type ? (
              <Spinner className="h-4 w-4 animate-spin" />
            ) : success === option.type ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <DownloadSimple className="h-4 w-4" />
            )}
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
