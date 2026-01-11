import { Suspense } from "react";
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
import { Plus, Eye, FileText, Buildings } from "@phosphor-icons/react/dist/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { auth } from "@clerk/nextjs/server";
import { LoansFilters } from "@/components/loans/loans-filters";
import { LoansTableSkeleton } from "@/components/loans/loans-table-skeleton";

interface LoanWithRelations {
  id: string;
  name: string;
  facility_type: string;
  commitment_amount: number;
  outstanding_amount: number;
  origination_date: string;
  maturity_date: string;
  status: string;
  borrowers: {
    id: string;
    name: string;
    industry: string | null;
  } | null;
  covenants: Array<{
    id: string;
    name: string;
  }>;
  complianceStatus?: "compliant" | "warning" | "breach";
}

async function getLoans() {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = createAdminClient();

  const userResult = await supabase
    .from("users")
    .select("organization_id")
    .eq("clerk_id", userId)
    .is("deleted_at", null)
    .single();

  const userData = userResult.data as { organization_id: string } | null;
  if (!userData?.organization_id) return [];

  const { data, error } = await supabase
    .from("loans")
    .select(`
      id,
      name,
      facility_type,
      commitment_amount,
      outstanding_amount,
      origination_date,
      maturity_date,
      status,
      borrowers (
        id,
        name,
        industry
      ),
      covenants (
        id,
        name
      )
    `)
    .eq("organization_id", userData.organization_id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching loans:", error);
    return [];
  }

  return (data || []) as unknown as LoanWithRelations[];
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(1)}B`;
  }
  return `$${(amount / 1000000).toFixed(0)}M`;
}

function getStatusBadge(status: string) {
  const variants: Record<string, string> = {
    compliant: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    breach: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    active: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    closed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  };

  const labels: Record<string, string> = {
    compliant: "Compliant",
    warning: "Warning",
    breach: "Breach",
    active: "Active",
    closed: "Closed",
  };

  return (
    <Badge variant="secondary" className={variants[status] || variants.active}>
      {labels[status] || status}
    </Badge>
  );
}

async function LoansTable() {
  const loans = await getLoans();

  if (loans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Buildings className="h-5 w-5" />
            Portfolio (0 loans)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Buildings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No loans yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first loan to the portfolio.
            </p>
            <Button asChild>
              <Link href="/loans/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Loan
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Buildings className="h-5 w-5" />
          Portfolio ({loans.length} loan{loans.length !== 1 ? 's' : ''})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Borrower / Loan</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="text-right whitespace-nowrap">Commitment</TableHead>
                <TableHead className="text-right whitespace-nowrap hidden md:table-cell">Outstanding</TableHead>
                <TableHead className="hidden lg:table-cell">Covenants</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Maturity</TableHead>
                <TableHead className="text-right w-[60px]">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell className="max-w-[200px]">
                    <div className="min-w-0">
                      <div className="font-medium truncate" title={loan.borrowers?.name || "Unknown"}>{loan.borrowers?.name || "Unknown"}</div>
                      <div className="text-sm text-muted-foreground truncate" title={loan.name}>
                        {loan.name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline">{loan.facility_type}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono whitespace-nowrap">
                    {formatCurrency(loan.commitment_amount)}
                  </TableCell>
                  <TableCell className="text-right font-mono whitespace-nowrap hidden md:table-cell">
                    {formatCurrency(loan.outstanding_amount)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {loan.covenants?.length || 0}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(loan.status)}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap hidden md:table-cell">
                    {new Date(loan.maturity_date).toLocaleDateString("en-US", {
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
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoansPage() {
  return (
    <div className="space-y-4 min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-normal tracking-tight">Loans</h1>
          <p className="text-sm text-muted-foreground">
            Manage and monitor your loan portfolio
          </p>
        </div>
        <Button asChild className="w-fit">
          <Link href="/loans/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Loan
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <LoansFilters />

      {/* Loans Table with Suspense */}
      <div className="min-w-0 overflow-hidden">
        <Suspense fallback={<LoansTableSkeleton />}>
          <LoansTable />
        </Suspense>
      </div>
    </div>
  );
}
