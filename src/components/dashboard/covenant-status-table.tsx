"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { staggerContainer, staggerItem } from "@/lib/animations";

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
    compliant: "bg-green-100 text-green-800 hover:bg-green-100",
    warning: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    breach: "bg-red-100 text-red-800 hover:bg-red-100",
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Covenant Tests</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[140px] h-9">
              <Funnel className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
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
          <Button variant="outline" size="sm" asChild>
            <Link href="/loans">View All</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No covenant tests yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Upload documents to extract and test covenants</p>
          </div>
        ) : filteredAndSortedItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No {statusFilter} covenant tests found</p>
            <Button
              variant="link"
              className="mt-2"
              onClick={() => setStatusFilter("all")}
            >
              Clear filter
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort("borrower")}
                >
                  <div className="flex items-center gap-1">
                    Borrower
                    <SortIcon field="borrower" sortField={sortField} sortOrder={sortOrder} />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort("covenantType")}
                >
                  <div className="flex items-center gap-1">
                    Covenant
                    <SortIcon field="covenantType" sortField={sortField} sortOrder={sortOrder} />
                  </div>
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort("currentValue")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Actual
                    <SortIcon field="currentValue" sortField={sortField} sortOrder={sortOrder} />
                  </div>
                </TableHead>
                <TableHead className="text-right">Threshold</TableHead>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {filteredAndSortedItems.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors"
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.borrower}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.loanName}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{item.covenantType}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatValue(item.currentValue, item.covenantType)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {item.operator === "max" || item.operator === "lte" ? "≤" : "≥"}{" "}
                      {formatValue(item.threshold, item.covenantType)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        className={cn(
                          "flex items-center justify-end gap-1",
                          item.headroom >= 15
                            ? "text-green-600"
                            : item.headroom >= 0
                            ? "text-yellow-600"
                            : "text-red-600"
                        )}
                      >
                        {item.headroom >= 0 ? (
                          <TrendUp className="h-3 w-3" />
                        ) : (
                          <TrendDown className="h-3 w-3" />
                        )}
                        <span className="font-mono">{item.headroom.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/loans/${item.loanId}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
