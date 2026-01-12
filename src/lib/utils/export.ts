/**
 * CSV Export Utilities
 */

type ExportableValue = string | number | boolean | null | undefined | Date;

/**
 * Convert array of objects to CSV string
 */
export function toCSV<T extends object>(
  data: T[],
  options?: {
    columns?: { key: keyof T; label: string }[];
    includeHeaders?: boolean;
  }
): string {
  if (data.length === 0) return "";

  const { columns, includeHeaders = true } = options || {};

  // Determine columns to export
  const cols = columns || (Object.keys(data[0]) as (keyof T)[]).map((key) => ({
    key,
    label: String(key),
  }));

  // Build CSV lines
  const lines: string[] = [];

  // Header row
  if (includeHeaders) {
    lines.push(cols.map((c) => escapeCSV(c.label)).join(","));
  }

  // Data rows
  for (const row of data) {
    const values = cols.map((c) => {
      const value = (row as Record<string, ExportableValue>)[c.key as string];
      return escapeCSV(formatValue(value));
    });
    lines.push(values.join(","));
  }

  return lines.join("\n");
}

/**
 * Escape a value for CSV (handle commas, quotes, newlines)
 */
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Format a value for CSV output
 */
function formatValue(value: ExportableValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

/**
 * Trigger a CSV file download in the browser
 */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format currency for export
 */
export function formatCurrencyForExport(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "";
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Format date for export
 */
export function formatDateForExport(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format percentage for export
 */
export function formatPercentForExport(value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return `${value.toFixed(1)}%`;
}
