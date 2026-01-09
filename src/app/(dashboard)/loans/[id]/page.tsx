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

interface CovenantTest {
  id: string;
  name: string;
  type: string;
  currentValue: number;
  threshold: number;
  operator: "max" | "min";
  status: "compliant" | "warning" | "breach";
  headroom: number;
  lastTestDate: string;
}

interface FinancialPeriod {
  id: string;
  periodEnd: string;
  ebitda: number;
  totalDebt: number;
  interestExpense: number;
  revenue: number;
}

const mockLoan = {
  id: "1",
  borrower: "Acme Corporation",
  name: "Senior Term Loan",
  facilityType: "Term Loan",
  commitmentAmount: 250000000,
  outstandingAmount: 225000000,
  currency: "USD",
  originationDate: "2023-06-15",
  maturityDate: "2028-06-15",
  interestRate: 0.0875,
  interestRateType: "SOFR + 350bps",
  industry: "Manufacturing",
  rating: "B+",
};

const mockCovenants: CovenantTest[] = [
  {
    id: "1",
    name: "Total Leverage Ratio",
    type: "leverage",
    currentValue: 5.2,
    threshold: 5.0,
    operator: "max",
    status: "breach",
    headroom: -4.0,
    lastTestDate: "2025-12-31",
  },
  {
    id: "2",
    name: "Interest Coverage Ratio",
    type: "interest_coverage",
    currentValue: 2.8,
    threshold: 2.0,
    operator: "min",
    status: "compliant",
    headroom: 40.0,
    lastTestDate: "2025-12-31",
  },
  {
    id: "3",
    name: "Fixed Charge Coverage",
    type: "fixed_charge",
    currentValue: 1.35,
    threshold: 1.25,
    operator: "min",
    status: "warning",
    headroom: 8.0,
    lastTestDate: "2025-12-31",
  },
];

const mockFinancials: FinancialPeriod[] = [
  {
    id: "1",
    periodEnd: "2025-12-31",
    ebitda: 43269231,
    totalDebt: 225000000,
    interestExpense: 15468750,
    revenue: 312500000,
  },
  {
    id: "2",
    periodEnd: "2025-09-30",
    ebitda: 48750000,
    totalDebt: 230000000,
    interestExpense: 15750000,
    revenue: 325000000,
  },
  {
    id: "3",
    periodEnd: "2025-06-30",
    ebitda: 52500000,
    totalDebt: 235000000,
    interestExpense: 16000000,
    revenue: 340000000,
  },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatValue(value: number, type: string): string {
  return `${value.toFixed(2)}x`;
}

function getStatusBadge(status: CovenantTest["status"]) {
  const variants = {
    compliant: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    breach: "bg-red-100 text-red-800",
  };

  return (
    <Badge variant="secondary" className={variants[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function getHeadroomIndicator(headroom: number, operator: "max" | "min") {
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

export default async function LoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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
          <h1 className="text-3xl font-bold tracking-tight">
            {mockLoan.borrower}
          </h1>
          <p className="text-muted-foreground">{mockLoan.name}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/upload?loan=${id}`}>
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
              {formatCurrency(mockLoan.commitmentAmount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {mockLoan.facilityType}
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
              {formatCurrency(mockLoan.outstandingAmount)}
            </div>
            <Progress
              value={
                (mockLoan.outstandingAmount / mockLoan.commitmentAmount) * 100
              }
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
              {(mockLoan.interestRate * 100).toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {mockLoan.interestRateType}
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
              {new Date(mockLoan.maturityDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.ceil(
                (new Date(mockLoan.maturityDate).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24 * 30)
              )}{" "}
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
                  {mockCovenants.map((covenant) => (
                    <TableRow key={covenant.id}>
                      <TableCell className="font-medium">
                        {covenant.name}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatValue(covenant.currentValue, covenant.type)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {covenant.operator === "max" ? "≤" : "≥"}{" "}
                        {formatValue(covenant.threshold, covenant.type)}
                      </TableCell>
                      <TableCell className="text-right">
                        {getHeadroomIndicator(covenant.headroom, covenant.operator)}
                      </TableCell>
                      <TableCell>{getStatusBadge(covenant.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(covenant.lastTestDate).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* EBITDA Definition */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>EBITDA Definition</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground">
                  <strong>Consolidated EBITDA</strong> means, for any period,
                  Consolidated Net Income for such period plus (a) the following
                  to the extent deducted in calculating such Consolidated Net
                  Income:
                </p>
                <ul className="text-muted-foreground text-sm space-y-1 mt-2">
                  <li>Interest Expense</li>
                  <li>Provision for income taxes</li>
                  <li>Depreciation and amortization expense</li>
                  <li>
                    Non-cash stock compensation expense (up to 5% of EBITDA)
                  </li>
                  <li>Restructuring charges (up to $10M per fiscal year)</li>
                  <li>Non-recurring transaction costs</li>
                </ul>
              </div>
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
                  {mockFinancials.map((period) => (
                    <TableRow key={period.id}>
                      <TableCell className="font-medium">
                        {new Date(period.periodEnd).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(period.revenue)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(period.ebitda)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(period.totalDebt)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(period.interestExpense)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {(period.totalDebt / period.ebitda).toFixed(2)}x
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Documents</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/upload?loan=${id}`}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <FileText className="h-8 w-8 text-red-500" />
                    <div>
                      <p className="font-medium">Credit Agreement</p>
                      <p className="text-sm text-muted-foreground">
                        Uploaded Jun 15, 2023 - 245 pages
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Extracted</Badge>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium">Q4 2025 Compliance Certificate</p>
                      <p className="text-sm text-muted-foreground">
                        Uploaded Jan 5, 2026 - 12 pages
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Extracted</Badge>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <FileText className="h-8 w-8 text-purple-500" />
                    <div>
                      <p className="font-medium">Q4 2025 Financial Statements</p>
                      <p className="text-sm text-muted-foreground">
                        Uploaded Jan 5, 2026 - 35 pages
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Extracted</Badge>
                </div>
              </div>
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
              <div className="space-y-4">
                {[
                  {
                    action: "Covenant test completed",
                    details: "Q4 2025 - Leverage breach detected",
                    user: "System",
                    date: "Jan 6, 2026 10:30 AM",
                  },
                  {
                    action: "Document extracted",
                    details: "Q4 2025 Compliance Certificate",
                    user: "AI Extraction",
                    date: "Jan 5, 2026 3:45 PM",
                  },
                  {
                    action: "Document uploaded",
                    details: "Q4 2025 Financial Statements",
                    user: "John Smith",
                    date: "Jan 5, 2026 3:30 PM",
                  },
                  {
                    action: "Covenant test completed",
                    details: "Q3 2025 - All covenants compliant",
                    user: "System",
                    date: "Oct 15, 2025 11:00 AM",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-lg border"
                  >
                    <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                    <div className="flex-1">
                      <p className="font-medium">{item.action}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.details}
                      </p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>{item.user}</p>
                      <p>{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
