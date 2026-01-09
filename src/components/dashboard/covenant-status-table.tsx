"use client";

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
import { Eye, TrendDown, TrendUp } from "@phosphor-icons/react";
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

export function CovenantStatusTable({ data }: CovenantStatusTableProps) {
  const items = data || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Covenant Tests</CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link href="/loans">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No covenant tests yet</p>
            <p className="text-sm mt-1">Upload documents to run covenant tests</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Borrower</TableHead>
                <TableHead>Covenant</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Threshold</TableHead>
                <TableHead className="text-right">Headroom</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
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
                      {item.headroom.toFixed(1)}%
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
