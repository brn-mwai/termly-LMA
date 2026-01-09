import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Eye, FileText, Building2 } from "lucide-react";

interface Loan {
  id: string;
  borrower: string;
  name: string;
  facilityType: string;
  commitmentAmount: number;
  outstandingAmount: number;
  originationDate: string;
  maturityDate: string;
  covenantCount: number;
  complianceStatus: "compliant" | "warning" | "breach";
  industry: string;
}

const mockLoans: Loan[] = [
  {
    id: "1",
    borrower: "Acme Corporation",
    name: "Senior Term Loan",
    facilityType: "Term Loan",
    commitmentAmount: 250000000,
    outstandingAmount: 225000000,
    originationDate: "2023-06-15",
    maturityDate: "2028-06-15",
    covenantCount: 3,
    complianceStatus: "breach",
    industry: "Manufacturing",
  },
  {
    id: "2",
    borrower: "Beta Industries",
    name: "Revolving Credit Facility",
    facilityType: "Revolver",
    commitmentAmount: 100000000,
    outstandingAmount: 45000000,
    originationDate: "2024-01-10",
    maturityDate: "2029-01-10",
    covenantCount: 2,
    complianceStatus: "warning",
    industry: "Technology",
  },
  {
    id: "3",
    borrower: "Gamma Holdings",
    name: "Term Loan B",
    facilityType: "Term Loan B",
    commitmentAmount: 500000000,
    outstandingAmount: 485000000,
    originationDate: "2022-09-01",
    maturityDate: "2029-09-01",
    covenantCount: 4,
    complianceStatus: "compliant",
    industry: "Healthcare",
  },
  {
    id: "4",
    borrower: "Delta Manufacturing",
    name: "Senior Secured Facility",
    facilityType: "Term Loan",
    commitmentAmount: 175000000,
    outstandingAmount: 160000000,
    originationDate: "2023-03-20",
    maturityDate: "2028-03-20",
    covenantCount: 3,
    complianceStatus: "compliant",
    industry: "Manufacturing",
  },
  {
    id: "5",
    borrower: "Epsilon Tech",
    name: "Growth Facility",
    facilityType: "Delayed Draw",
    commitmentAmount: 300000000,
    outstandingAmount: 180000000,
    originationDate: "2024-02-15",
    maturityDate: "2030-02-15",
    covenantCount: 2,
    complianceStatus: "warning",
    industry: "Technology",
  },
];

function formatCurrency(amount: number): string {
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(1)}B`;
  }
  return `$${(amount / 1000000).toFixed(0)}M`;
}

function getStatusBadge(status: Loan["complianceStatus"]) {
  const variants = {
    compliant: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    breach: "bg-red-100 text-red-800",
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

export default function LoansPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loans</h1>
          <p className="text-muted-foreground">
            Manage and monitor your loan portfolio
          </p>
        </div>
        <Button asChild>
          <Link href="/loans/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Loan
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search loans or borrowers..." className="pl-9" />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="compliant">Compliant</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="breach">Breach</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Facility Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="term">Term Loan</SelectItem>
                <SelectItem value="revolver">Revolver</SelectItem>
                <SelectItem value="delayed">Delayed Draw</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loans Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Portfolio ({mockLoans.length} loans)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Borrower / Loan</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Commitment</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Covenants</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Maturity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLoans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{loan.borrower}</div>
                      <div className="text-sm text-muted-foreground">
                        {loan.name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{loan.facilityType}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(loan.commitmentAmount)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(loan.outstandingAmount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {loan.covenantCount}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(loan.complianceStatus)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(loan.maturityDate).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/loans/${loan.id}`}>
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
    </div>
  );
}
