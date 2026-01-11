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
  TrendUp,
  TrendDown,
  Warning,
  Upload,
  ClockCounterClockwise,
} from "@phosphor-icons/react/dist/ssr";
import { RunCovenantTestButton } from "@/components/loans/run-covenant-test-button";
import { CovenantEditDialog } from "@/components/loans/covenant-edit-dialog";
import { AddCovenantDialog } from "@/components/loans/add-covenant-dialog";
import { AddFinancialPeriodDialog } from "@/components/loans/add-financial-period-dialog";
import { DocumentPreviewButton } from "@/components/documents/document-preview-button";
import { createAdminClient } from "@/lib/supabase/admin";
import { auth } from "@clerk/nextjs/server";

async function getLoanDetails(loanId: string) {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = createAdminClient();

  // Get user's organization
  const userResult = await supabase
    .from("users")
    .select("organization_id")
    .eq("clerk_id", userId)
    .is("deleted_at", null)
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
    compliant: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    breach: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    pending: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
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
        <TrendUp className="h-4 w-4" />
      ) : (
        <TrendDown className="h-4 w-4" />
      )}
      <span className="font-mono">{headroom.toFixed(1)}%</span>
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
    completed: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    failed: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    needs_review: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
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

  // Compute remaining months (calculated once per request)
  const maturityDate = new Date(loan.maturity_date);
  const monthsRemaining = Math.max(0, Math.ceil(
    (maturityDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)
  ));

  interface CovenantTest {
    id: string;
    calculated_value: number;
    threshold_at_test: number;
    status: string;
    headroom_percentage: number;
    tested_at: string;
  }

  interface CovenantData {
    id: string;
    name: string;
    type: string;
    operator: string;
    threshold: number;
    testing_frequency: string;
    covenant_tests?: CovenantTest[];
  }

  interface FinancialPeriod {
    id: string;
    period_end_date: string;
    revenue?: number;
    ebitda_reported?: number;
    ebitda_adjusted?: number;
    total_debt?: number;
    interest_expense?: number;
  }

  interface LoanDocument {
    id: string;
    name: string;
    type: string;
    extraction_status: string;
    created_at: string;
  }

  interface AuditLog {
    id: string;
    action: string;
    entity_type: string;
    created_at: string;
  }

  const typedFinancials = financials as FinancialPeriod[];
  const typedDocuments = documents as LoanDocument[];
  const typedAuditLogs = auditLogs as AuditLog[];

  // Get latest test for each covenant
  const covenantsWithLatestTest = (covenants as CovenantData[]).map((covenant) => {
    const tests = covenant.covenant_tests || [];
    const latestTest = [...tests].sort((a, b) =>
      new Date(b.tested_at).getTime() - new Date(a.tested_at).getTime()
    )[0];
    return {
      ...covenant,
      latestTest,
    };
  });

  return (
    <div className="space-y-4 min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Button variant="ghost" size="icon" asChild className="flex-shrink-0">
            <Link href="/loans">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-3xl font-normal tracking-tight truncate" title={loan.borrowers?.name || "Unknown Borrower"}>
              {loan.borrowers?.name || "Unknown Borrower"}
            </h1>
            <p className="text-muted-foreground truncate" title={loan.name}>{loan.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/documents/upload?loan=${id}`}>
              <Upload className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Upload</span>
            </Link>
          </Button>
          <RunCovenantTestButton loanId={id} />
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
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
              {monthsRemaining} months remaining
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="covenants" className="space-y-4">
        <TabsList>
          <TabsTrigger value="covenants">
            <Warning className="h-4 w-4 mr-2" />
            Covenants
          </TabsTrigger>
          <TabsTrigger value="financials">
            <TrendUp className="h-4 w-4 mr-2" />
            Financials
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-2" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="history">
            <ClockCounterClockwise className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Covenants Tab */}
        <TabsContent value="covenants">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle>Covenant Status</CardTitle>
              <AddCovenantDialog loanId={id} />
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {covenantsWithLatestTest.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground px-4">
                  <Warning className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p>No covenants configured for this loan</p>
                  <p className="text-sm mt-1">Upload a credit agreement to extract covenants</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Covenant</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Value</TableHead>
                        <TableHead className="text-right whitespace-nowrap hidden sm:table-cell">Threshold</TableHead>
                        <TableHead className="text-right whitespace-nowrap hidden md:table-cell">Headroom</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden lg:table-cell">Last Test</TableHead>
                        <TableHead className="text-right w-[60px]">Edit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {covenantsWithLatestTest.map((covenant) => (
                        <TableRow key={covenant.id}>
                          <TableCell className="font-medium max-w-[150px] truncate" title={covenant.name}>
                            {covenant.name}
                          </TableCell>
                          <TableCell className="text-right font-mono whitespace-nowrap">
                            {covenant.latestTest
                              ? formatValue(covenant.latestTest.calculated_value)
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground whitespace-nowrap hidden sm:table-cell">
                            {covenant.operator === "max" ? "≤" : "≥"}{" "}
                            {formatValue(covenant.threshold)}
                          </TableCell>
                          <TableCell className="text-right hidden md:table-cell">
                            {covenant.latestTest
                              ? getHeadroomIndicator(covenant.latestTest.headroom_percentage || 0)
                              : "—"}
                          </TableCell>
                          <TableCell>
                            {covenant.latestTest
                              ? getStatusBadge(covenant.latestTest.status)
                              : getStatusBadge("pending")}
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap hidden lg:table-cell">
                            {covenant.latestTest
                              ? new Date(covenant.latestTest.tested_at).toLocaleDateString()
                              : "Never"}
                          </TableCell>
                          <TableCell className="text-right">
                            <CovenantEditDialog covenant={covenant} loanId={id} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financials Tab */}
        <TabsContent value="financials">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle>Financial History</CardTitle>
              <AddFinancialPeriodDialog loanId={id} />
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {typedFinancials.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground px-4">
                  <TrendUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p>No financial data available</p>
                  <p className="text-sm mt-1">Upload compliance certificates to extract financials</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Period</TableHead>
                        <TableHead className="text-right whitespace-nowrap hidden sm:table-cell">Revenue</TableHead>
                        <TableHead className="text-right whitespace-nowrap">EBITDA</TableHead>
                        <TableHead className="text-right whitespace-nowrap hidden md:table-cell">Total Debt</TableHead>
                        <TableHead className="text-right whitespace-nowrap hidden lg:table-cell">Interest</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Leverage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {typedFinancials.map((period) => (
                        <TableRow key={period.id}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {new Date(period.period_end_date).toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric",
                            })}
                          </TableCell>
                          <TableCell className="text-right font-mono whitespace-nowrap hidden sm:table-cell">
                            {period.revenue ? formatCurrency(period.revenue) : "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono whitespace-nowrap">
                            {period.ebitda_adjusted
                              ? formatCurrency(period.ebitda_adjusted)
                              : period.ebitda_reported
                              ? formatCurrency(period.ebitda_reported)
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono whitespace-nowrap hidden md:table-cell">
                            {period.total_debt ? formatCurrency(period.total_debt) : "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono whitespace-nowrap hidden lg:table-cell">
                            {period.interest_expense ? formatCurrency(period.interest_expense) : "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono whitespace-nowrap">
                            {period.total_debt && period.ebitda_adjusted
                              ? `${(period.total_debt / period.ebitda_adjusted).toFixed(2)}x`
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle>Documents</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/documents/upload?loan=${id}`}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {typedDocuments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p>No documents uploaded</p>
                  <p className="text-sm mt-1">Upload credit agreements and compliance certificates</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {typedDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg border gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex-shrink-0">{getDocumentIcon(doc.type)}</div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate" title={doc.name}>{doc.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(doc.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getExtractionBadge(doc.extraction_status)}
                        <DocumentPreviewButton
                          documentId={doc.id}
                          documentName={doc.name}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              {typedAuditLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClockCounterClockwise className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p>No audit history available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {typedAuditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 sm:p-4 rounded-lg border"
                    >
                      <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium capitalize">{log.action}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {log.entity_type}
                        </p>
                      </div>
                      <div className="text-right text-xs sm:text-sm text-muted-foreground flex-shrink-0">
                        <p className="whitespace-nowrap">
                          {new Date(log.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
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
