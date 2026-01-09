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
import { Eye, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CovenantStatus {
  id: string;
  borrower: string;
  loanName: string;
  covenantType: string;
  currentValue: number;
  threshold: number;
  operator: "max" | "min";
  status: "compliant" | "warning" | "breach";
  headroom: number;
  testDate: string;
}

const mockData: CovenantStatus[] = [
  {
    id: "1",
    borrower: "Acme Corporation",
    loanName: "Senior Term Loan",
    covenantType: "Leverage",
    currentValue: 5.2,
    threshold: 5.0,
    operator: "max",
    status: "breach",
    headroom: -4.0,
    testDate: "2025-12-31",
  },
  {
    id: "2",
    borrower: "Beta Industries",
    loanName: "Revolver",
    covenantType: "Interest Coverage",
    currentValue: 2.3,
    threshold: 2.0,
    operator: "min",
    status: "warning",
    headroom: 15.0,
    testDate: "2025-12-31",
  },
  {
    id: "3",
    borrower: "Gamma Holdings",
    loanName: "Term Loan B",
    covenantType: "Leverage",
    currentValue: 3.8,
    threshold: 4.5,
    operator: "max",
    status: "compliant",
    headroom: 18.4,
    testDate: "2025-12-31",
  },
  {
    id: "4",
    borrower: "Delta Manufacturing",
    loanName: "Senior Secured",
    covenantType: "Fixed Charge",
    currentValue: 1.4,
    threshold: 1.25,
    operator: "min",
    status: "compliant",
    headroom: 12.0,
    testDate: "2025-12-31",
  },
  {
    id: "5",
    borrower: "Epsilon Tech",
    loanName: "Growth Facility",
    covenantType: "Leverage",
    currentValue: 4.9,
    threshold: 5.0,
    operator: "max",
    status: "warning",
    headroom: 2.0,
    testDate: "2025-12-31",
  },
];

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
    <Badge variant="secondary" className={variants[status]}>
      {labels[status]}
    </Badge>
  );
}

function formatValue(value: number, type: string): string {
  if (type === "Leverage" || type === "Interest Coverage" || type === "Fixed Charge") {
    return `${value.toFixed(1)}x`;
  }
  return value.toString();
}

export function CovenantStatusTable() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Covenant Tests</CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link href="/loans">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
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
            {mockData.map((item) => (
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
                  {item.operator === "max" ? "≤" : "≥"}{" "}
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
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {item.headroom.toFixed(1)}%
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(item.status)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/loans/${item.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
