import { Suspense } from "react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { CovenantStatusTable } from "@/components/dashboard/covenant-status-table";
import { AlertsWidget } from "@/components/dashboard/alerts-widget";
import { UpcomingTests } from "@/components/dashboard/upcoming-tests";
import { PortfolioChart } from "@/components/dashboard/portfolio-chart";
import { ComplianceChart } from "@/components/dashboard/compliance-chart";
import { StatsCardsSkeleton } from "@/components/dashboard/stats-cards-skeleton";
import { CovenantTableSkeleton } from "@/components/dashboard/covenant-table-skeleton";
import { AlertsWidgetSkeleton } from "@/components/dashboard/alerts-widget-skeleton";
import { UpcomingTestsSkeleton } from "@/components/dashboard/upcoming-tests-skeleton";
import { ChartSkeleton } from "@/components/dashboard/chart-skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

async function getDashboardData() {
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

  const orgId = userData.organization_id;

  // Fetch all data in parallel
  const [loansResult, alertsResult, covenantTestsResult, upcomingCovenantsResult] = await Promise.all([
    // Get loans with borrowers
    supabase
      .from("loans")
      .select(`
        id,
        name,
        commitment_amount,
        status,
        borrowers (
          id,
          name
        )
      `)
      .eq("organization_id", orgId)
      .is("deleted_at", null),

    // Get unacknowledged alerts
    supabase
      .from("alerts")
      .select(`
        id,
        severity,
        title,
        message,
        created_at,
        loans (
          name,
          borrowers (
            name
          )
        )
      `)
      .eq("organization_id", orgId)
      .eq("acknowledged", false)
      .order("created_at", { ascending: false })
      .limit(5),

    // Get recent covenant tests with details
    supabase
      .from("covenant_tests")
      .select(`
        id,
        calculated_value,
        threshold_at_test,
        status,
        headroom_percentage,
        tested_at,
        covenants (
          id,
          name,
          type,
          operator,
          loans (
            id,
            name,
            borrowers (
              name
            )
          )
        )
      `)
      .order("tested_at", { ascending: false })
      .limit(10),

    // Get upcoming covenants with next test dates
    supabase
      .from("covenants")
      .select(`
        id,
        name,
        type,
        test_due_date,
        loans (
          id,
          name,
          borrowers (
            name
          )
        ),
        covenant_tests (
          status
        )
      `)
      .gte("test_due_date", new Date().toISOString().split('T')[0])
      .order("test_due_date", { ascending: true })
      .limit(5),
  ]);

  const loans = loansResult.data || [];
  const alerts = alertsResult.data || [];
  const covenantTests = covenantTestsResult.data || [];
  const upcomingCovenants = upcomingCovenantsResult.data || [];

  // Calculate stats
  const totalLoans = loans.length;
  const uniqueBorrowers = new Set(loans.map((l: any) => l.borrowers?.id)).size;
  const portfolioValue = loans.reduce(
    (sum: number, loan: any) => sum + (Number(loan.commitment_amount) || 0),
    0
  );

  // Count compliance statuses
  const compliantCount = covenantTests.filter(
    (t: any) => t.status === "compliant"
  ).length;
  const warningCount = covenantTests.filter(
    (t: any) => t.status === "warning"
  ).length;
  const breachCount = covenantTests.filter(
    (t: any) => t.status === "breach"
  ).length;

  // Alert counts by severity
  const criticalAlerts = alerts.filter(
    (a: any) => a.severity === "critical"
  ).length;
  const warningAlerts = alerts.filter(
    (a: any) => a.severity === "warning"
  ).length;

  return {
    stats: {
      totalLoans,
      uniqueBorrowers,
      portfolioValue,
      compliantCount,
      warningCount,
      breachCount,
      totalAlerts: alerts.length,
      criticalAlerts,
      warningAlerts,
    },
    alerts: alerts.map((a: any) => ({
      id: a.id,
      severity: a.severity as "critical" | "warning" | "info",
      title: a.title,
      message: a.message,
      borrower: a.loans?.borrowers?.name || "Unknown",
      createdAt: new Date(a.created_at),
    })),
    covenantTests: covenantTests.map((t: any) => ({
      id: t.id,
      borrower: t.covenants?.loans?.borrowers?.name || "Unknown",
      loanId: t.covenants?.loans?.id || "",
      loanName: t.covenants?.loans?.name || "Unknown",
      covenantType: t.covenants?.name || t.covenants?.type || "Unknown",
      currentValue: Number(t.calculated_value),
      threshold: Number(t.threshold_at_test),
      operator: t.covenants?.operator || "max",
      status: t.status as "compliant" | "warning" | "breach",
      headroom: Number(t.headroom_percentage) || 0,
      testDate: t.tested_at,
    })),
    upcomingTests: upcomingCovenants.map((c: any) => {
      // Get latest test status if any
      const tests = c.covenant_tests || [];
      const lastStatus = tests.length > 0 ? tests[tests.length - 1].status : "pending";
      return {
        id: c.id,
        loanId: c.loans?.id || "",
        borrower: c.loans?.borrowers?.name || "Unknown",
        loanName: c.loans?.name || "Unknown",
        covenantType: c.name || c.type || "Unknown",
        testDate: new Date(c.test_due_date),
        lastStatus: lastStatus as "compliant" | "warning" | "breach" | "pending",
      };
    }),
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your loan portfolio covenant compliance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/loans/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Loan
            </Link>
          </Button>
          <Button asChild>
            <Link href="/documents/upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards stats={data?.stats} />
      </Suspense>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <Suspense fallback={<ChartSkeleton height={250} />}>
          <PortfolioChart currentValue={data?.stats?.portfolioValue} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton height={200} />}>
          <ComplianceChart />
        </Suspense>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Covenant Status Table - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Suspense fallback={<CovenantTableSkeleton />}>
            <CovenantStatusTable data={data?.covenantTests} />
          </Suspense>
        </div>

        {/* Sidebar widgets */}
        <div className="space-y-6">
          <Suspense fallback={<AlertsWidgetSkeleton />}>
            <AlertsWidget alerts={data?.alerts} />
          </Suspense>
          <Suspense fallback={<UpcomingTestsSkeleton />}>
            <UpcomingTests tests={data?.upcomingTests} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
