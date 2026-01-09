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
import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { LoansFilters } from "@/components/loans/loans-filters";

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
  // Calculated field for compliance status based on latest covenant tests
  complianceStatus?: "compliant" | "warning" | "breach";
}

async function getLoans() {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = await createClient();

  // Get user's organization
  const userResult = await supabase
    .from("users")
    .select("organization_id")
    .eq("clerk_id", userId)
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
    compliant: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    breach: "bg-red-100 text-red-800",
    active: "bg-blue-100 text-blue-800",
    closed: "bg-gray-100 text-gray-800",
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

export default async function LoansPage() {
  const loans = await getLoans();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Loans</h1>
          <p className="text-sm text-muted-foreground">
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
      <LoansFilters />

      {/* Loans Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Buildings className="h-5 w-5" />
            Portfolio ({loans.length} loan{loans.length !== 1 ? 's' : ''})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loans.length === 0 ? (
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
          ) : (
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
                {loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{loan.borrowers?.name || "Unknown"}</div>
                        <div className="text-sm text-muted-foreground">
                          {loan.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{loan.facility_type}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(loan.commitment_amount)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(loan.outstanding_amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {loan.covenants?.length || 0}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(loan.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
