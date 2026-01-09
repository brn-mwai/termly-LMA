import Link from "next/link";
import { notFound } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Upload,
  Calculator,
  History,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

async function getLoanDetails(loanId: string) {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = await createClient();

  // Get user's organization
  const userResult = await supabase
    .from("users")
    .select("organization_id")
    .eq("clerk_id", userId)
    .single();

  const userData = userResult.data as { organization_id: string } | null;
  if (!userData?.organization_id) return null;

  // Fetch loan with all related data
  const [loanResult, covenantsResult, financialsResult, documentsResult, auditResult] = await Promise.all([
    // Loan with borrower
    supabase
      .from("loans")
      .select(`
        *,
        borrowers (
          id,
          name,
          industry,
          rating
        )
      `)
      .eq("id", loanId)
      .eq("organization_id", userData.organization_id)
      .single(),

    // Covenants with latest tests
    supabase
      .from("covenants")
      .select(`
        id,
        name,
        type,
        operator,
        threshold,
        testing_frequency,
        covenant_tests (
          id,
          calculated_value,
          threshold_at_test,
          status,
          headroom_percentage,
          tested_at
        )
      `)
      .eq("loan_id", loanId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),

    // Financial periods
    supabase
      .from("financial_periods")
      .select("*")
      .eq("loan_id", loanId)
      .order("period_end_date", { ascending: false })
      .limit(4),

    // Documents
    supabase
      .from("documents")
      .select("*")
      .eq("loan_id", loanId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(10),

    // Audit logs
    supabase
      .from("audit_logs")
      .select("*")
      .eq("entity_type", "loan")
      .eq("entity_id", loanId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const loan = (loanResult as any).data;
  if ((loanResult as any).error || !loan) return null;

  return {
    loan,
    covenants: ((covenantsResult as any).data || []) as any[],
    financials: ((financialsResult as any).data || []) as any[],
    documents: ((documentsResult as any).data || []) as any[],
    auditLogs: ((auditResult as any).data || []) as any[],
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatValue(value: number): string {
  return `${value.toFixed(2)}x`;
}

function getStatusBadge(status: string) {
  const variants: Record<string, string> = {
    compliant: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    breach: "bg-red-100 text-red-800",
    pending: "bg-gray-100 text-gray-800",
  };

  return (
    <Badge variant="secondary" className={variants[status] || variants.pending}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function getHeadroomIndicator(headroom: number) {
  const isHealthy = headroom >= 15;
  const isWarning = headroom >= 0 && headroom < 15;

  return (
    <div
      className={`flex items-center gap-1 ${
        isHealthy
          ? "text-green-600"
          : isWarning
          ? "text-yellow-600"
          : "text-red-600"
      }`}
    >
      {headroom >= 0 ? (
        <TrendingUp className="h-4 w-4" />
      ) : (
        <TrendingDown className="h-4 w-4" />
      )}
      {headroom.toFixed(1)}%
    </div>
  );
}

function getDocumentIcon(type: string) {
  const colors: Record<string, string> = {
    credit_agreement: "text-red-500",
    compliance_certificate: "text-blue-500",
    financial_statement: "text-purple-500",
    amendment: "text-orange-500",
    other: "text-gray-500",
  };
  return <FileText className={`h-8 w-8 ${colors[type] || colors.other}`} />;
}

function getExtractionBadge(status: string) {
  const variants: Record<string, string> = {
    completed: "bg-green-100 text-green-800",
    processing: "bg-blue-100 text-blue-800",
    pending: "bg-yellow-100 text-yellow-800",
    failed: "bg-red-100 text-red-800",
    needs_review: "bg-orange-100 text-orange-800",
  };
  const labels: Record<string, string> = {
    completed: "Extracted",
    processing: "Processing",
    pending: "Pending",
    failed: "Failed",
    needs_review: "Review",
  };
  return (
    <Badge className={variants[status] || variants.pending}>
      {labels[status] || status}
    </Badge>
  );
}

export default async function LoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getLoanDetails(id);

  if (!data) {
    notFound();
  }

  const { loan, covenants, financials, documents, auditLogs } = data;

  // Get latest test for each covenant
  const covenantsWithLatestTest = covenants.map((covenant: any) => {
    const tests = covenant.covenant_tests || [];
    const latestTest = tests.sort((a: any, b: any) =>
      new Date(b.tested_at).getTime() - new Date(a.tested_at).getTime()
    )[0];
    return {
      ...covenant,
      latestTest,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/loans">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl tracking-tight">
            {loan.borrowers?.name || "Unknown Borrower"}
          </h1>
          <p className="text-muted-foreground">{loan.name}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/documents/upload?loan=${id}`}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Link>
        </Button>
        <Button>
          <Calculator className="h-4 w-4 mr-2" />
          Run Covenant Test
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Commitment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(loan.commitment_amount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {loan.facility_type}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(loan.outstanding_amount)}
            </div>
            <Progress
              value={(loan.outstanding_amount / loan.commitment_amount) * 100}
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Interest Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loan.interest_rate ? `${(loan.interest_rate * 100).toFixed(2)}%` : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {loan.interest_rate_type || "Fixed"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Maturity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(loan.maturity_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.max(0, Math.ceil(
                (new Date(loan.maturity_date).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24 * 30)
              ))}{" "}
              months remaining
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="covenants" className="space-y-4">
        <TabsList>
          <TabsTrigger value="covenants">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Covenants
          </TabsTrigger>
          <TabsTrigger value="financials">
            <TrendingUp className="h-4 w-4 mr-2" />
            Financials
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-2" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Covenants Tab */}
        <TabsContent value="covenants">
          <Card>
            <CardHeader>
              <CardTitle>Covenant Status</CardTitle>
            </CardHeader>
            <CardContent>
              {covenantsWithLatestTest.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p>No covenants configured for this loan</p>
                  <p className="text-sm mt-1">Upload a credit agreement to extract covenants</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Covenant</TableHead>
                      <TableHead className="text-right">Current Value</TableHead>
                      <TableHead className="text-right">Threshold</TableHead>
                      <TableHead className="text-right">Headroom</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Test</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {covenantsWithLatestTest.map((covenant: any) => (
                      <TableRow key={covenant.id}>
                        <TableCell className="font-medium">
                          {covenant.name}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {covenant.latestTest
                            ? formatValue(covenant.latestTest.calculated_value)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {covenant.operator === "max" ? "≤" : "≥"}{" "}
                          {formatValue(covenant.threshold)}
                        </TableCell>
                        <TableCell className="text-right">
                          {covenant.latestTest
                            ? getHeadroomIndicator(covenant.latestTest.headroom_percentage || 0)
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {covenant.latestTest
                            ? getStatusBadge(covenant.latestTest.status)
                            : getStatusBadge("pending")}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {covenant.latestTest
                            ? new Date(covenant.latestTest.tested_at).toLocaleDateString()
                            : "Never tested"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financials Tab */}
        <TabsContent value="financials">
          <Card>
            <CardHeader>
              <CardTitle>Financial History</CardTitle>
            </CardHeader>
            <CardContent>
              {financials.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p>No financial data available</p>
                  <p className="text-sm mt-1">Upload compliance certificates to extract financials</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period End</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">EBITDA</TableHead>
                      <TableHead className="text-right">Total Debt</TableHead>
                      <TableHead className="text-right">Interest Expense</TableHead>
                      <TableHead className="text-right">Leverage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {financials.map((period: any) => (
                      <TableRow key={period.id}>
                        <TableCell className="font-medium">
                          {new Date(period.period_end_date).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {period.revenue ? formatCurrency(period.revenue) : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {period.ebitda_adjusted
                            ? formatCurrency(period.ebitda_adjusted)
                            : period.ebitda_reported
                            ? formatCurrency(period.ebitda_reported)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {period.total_debt ? formatCurrency(period.total_debt) : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {period.interest_expense ? formatCurrency(period.interest_expense) : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {period.total_debt && period.ebitda_adjusted
                            ? `${(period.total_debt / period.ebitda_adjusted).toFixed(2)}x`
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Documents</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/documents/upload?loan=${id}`}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p>No documents uploaded</p>
                  <p className="text-sm mt-1">Upload credit agreements and compliance certificates</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-4">
                        {getDocumentIcon(doc.type)}
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Uploaded{" "}
                            {new Date(doc.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      {getExtractionBadge(doc.extraction_status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p>No audit history available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {auditLogs.map((log: any) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 p-4 rounded-lg border"
                    >
                      <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1">
                        <p className="font-medium capitalize">{log.action}</p>
                        <p className="text-sm text-muted-foreground">
                          {log.entity_type}
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>
                          {new Date(log.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
