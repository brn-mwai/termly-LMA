"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, TrendDown, TrendUp, CaretUp, CaretDown, Funnel, FileText } from "@phosphor-icons/react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CovenantStatus {
  id: string;
  borrower: string;
  loanId: string;
  loanName: string;
  covenantType: string;
  currentValue: number;
  threshold: number;
  operator: "max" | "min" | string;
  status: "compliant" | "warning" | "breach";
  headroom: number;
  testDate: string;
}

interface CovenantStatusTableProps {
  data?: CovenantStatus[];
}

type SortField = "borrower" | "covenantType" | "currentValue" | "headroom" | "status";
type SortOrder = "asc" | "desc";
type StatusFilter = "all" | "compliant" | "warning" | "breach";

function getStatusBadge(status: CovenantStatus["status"]) {
  const variants = {
    compliant: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    breach: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  };

  const labels = {
    compliant: "Compliant",
    warning: "Warning",
    breach: "Breach",
  };

  return (
    <Badge variant="secondary" className={variants[status] || variants.compliant}>
      {labels[status] || "Unknown"}
    </Badge>
  );
}

function formatValue(value: number, type: string): string {
  const ratioTypes = ["leverage", "interest_coverage", "fixed_charge", "debt_service", "current_ratio"];
  if (ratioTypes.some(t => type.toLowerCase().includes(t))) {
    return `${value.toFixed(2)}x`;
  }
  return value.toFixed(2);
}

function SortIcon({ field, sortField, sortOrder }: { field: SortField; sortField: SortField; sortOrder: SortOrder }) {
  if (field !== sortField) {
    return <CaretUp className="h-3 w-3 text-muted-foreground/40" />;
  }
  return sortOrder === "asc" ? (
    <CaretUp className="h-3 w-3" />
  ) : (
    <CaretDown className="h-3 w-3" />
  );
}

export function CovenantStatusTable({ data }: CovenantStatusTableProps) {
  const [sortField, setSortField] = useState<SortField>("headroom");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const items = data || [];

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(item => item.status === statusFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "borrower":
          comparison = a.borrower.localeCompare(b.borrower);
          break;
        case "covenantType":
          comparison = a.covenantType.localeCompare(b.covenantType);
          break;
        case "currentValue":
          comparison = a.currentValue - b.currentValue;
          break;
        case "headroom":
          comparison = a.headroom - b.headroom;
          break;
        case "status":
          const statusOrder = { breach: 0, warning: 1, compliant: 2 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [items, sortField, sortOrder, statusFilter]);

  const statusCounts = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc[item.status]++;
        return acc;
      },
      { compliant: 0, warning: 0, breach: 0 }
    );
  }, [items]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
        <CardTitle className="text-base font-medium">Covenant Status</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[130px] h-8 text-sm">
              <Funnel className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({items.length})</SelectItem>
              <SelectItem value="compliant">
                Compliant ({statusCounts.compliant})
              </SelectItem>
              <SelectItem value="warning">
                Warning ({statusCounts.warning})
              </SelectItem>
              <SelectItem value="breach">
                Breach ({statusCounts.breach})
              </SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 text-sm" asChild>
            <Link href="/loans">View All</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:px-6 sm:pb-6">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No covenant tests yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Upload documents to extract and test covenants</p>
          </div>
        ) : filteredAndSortedItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground px-4">
            <p>No {statusFilter} covenants found</p>
            <Button
              variant="link"
              className="mt-2"
              onClick={() => setStatusFilter("all")}
            >
              Clear filter
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 transition-colors min-w-[120px]"
                    onClick={() => handleSort("borrower")}
                  >
                    <div className="flex items-center gap-1">
                      Borrower
                      <SortIcon field="borrower" sortField={sortField} sortOrder={sortOrder} />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 transition-colors hidden sm:table-cell"
                    onClick={() => handleSort("covenantType")}
                  >
                    <div className="flex items-center gap-1">
                      Covenant
                      <SortIcon field="covenantType" sortField={sortField} sortOrder={sortOrder} />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-muted/50 transition-colors hidden md:table-cell"
                    onClick={() => handleSort("currentValue")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Actual
                      <SortIcon field="currentValue" sortField={sortField} sortOrder={sortOrder} />
                    </div>
                  </TableHead>
                  <TableHead className="text-right hidden lg:table-cell">Threshold</TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort("headroom")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Headroom
                      <SortIcon field="headroom" sortField={sortField} sortOrder={sortOrder} />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      <SortIcon field="status" sortField={sortField} sortOrder={sortOrder} />
                    </div>
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedItems.map((item) => (
                  <TableRow key={item.id} className="group">
                    <TableCell className="max-w-[160px]">
                      <div className="min-w-0">
                        <div className="font-medium truncate" title={item.borrower}>
                          {item.borrower}
                        </div>
                        <div className="text-xs text-muted-foreground truncate sm:hidden" title={item.covenantType}>
                          {item.covenantType}
                        </div>
                        <div className="text-xs text-muted-foreground truncate hidden sm:block" title={item.loanName}>
                          {item.loanName}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell max-w-[120px]">
                      <span className="truncate block text-sm" title={item.covenantType}>
                        {item.covenantType}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm hidden md:table-cell">
                      {formatValue(item.currentValue, item.covenantType)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground hidden lg:table-cell">
                      {item.operator === "max" || item.operator === "lte" ? "≤" : "≥"}{" "}
                      {formatValue(item.threshold, item.covenantType)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        className={cn(
                          "flex items-center justify-end gap-1 text-sm",
                          item.headroom >= 15
                            ? "text-green-600 dark:text-green-400"
                            : item.headroom >= 0
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-red-600 dark:text-red-400"
                        )}
                      >
                        {item.headroom >= 0 ? (
                          <TrendUp className="h-3.5 w-3.5 flex-shrink-0" />
                        ) : (
                          <TrendDown className="h-3.5 w-3.5 flex-shrink-0" />
                        )}
                        <span className="font-mono">{item.headroom.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        asChild
                      >
                        <Link href={`/loans/${item.loanId}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
