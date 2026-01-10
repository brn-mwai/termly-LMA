import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateCovenantTest } from "@/lib/ai/extraction";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: loanId } = await params;
    const supabase = createAdminClient();

    // Get user's organization
    const { data: userDataRaw } = await supabase
      .from("users")
      .select("id, organization_id")
      .eq("clerk_id", userId)
      .is("deleted_at", null)
      .single();

    const userData = userDataRaw as { id: string; organization_id: string } | null;
    if (!userData?.organization_id) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const orgId = userData.organization_id;

    // Verify loan belongs to org
    const { data: loanData, error: loanError } = await supabase
      .from("loans")
      .select("id, organization_id")
      .eq("id", loanId)
      .eq("organization_id", orgId)
      .single();

    if (loanError || !loanData) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    // Get all covenants for this loan
    const { data: covenantsData, error: covenantsError } = await supabase
      .from("covenants")
      .select("*")
      .eq("loan_id", loanId)
      .is("deleted_at", null);

    const covenants = (covenantsData || []) as Array<{
      id: string;
      name: string;
      type: string;
      operator: string;
      threshold: number;
    }>;

    if (covenantsError || covenants.length === 0) {
      return NextResponse.json(
        { error: "No covenants found for this loan" },
        { status: 404 }
      );
    }

    // Get the latest financial period for this loan
    const { data: fpData, error: fpError } = await supabase
      .from("financial_periods")
      .select("*")
      .eq("loan_id", loanId)
      .order("period_end_date", { ascending: false })
      .limit(1)
      .single();

    const financialPeriod = fpData as {
      id: string;
      period_end_date: string;
      ebitda_adjusted?: number;
      ebitda_reported?: number;
      total_debt?: number;
      interest_expense?: number;
      fixed_charges?: number;
      current_assets?: number;
      current_liabilities?: number;
      net_worth?: number;
    } | null;

    if (fpError || !financialPeriod) {
      return NextResponse.json(
        { error: "No financial data available to run covenant tests" },
        { status: 400 }
      );
    }

    const testResults = [];
    const alerts = [];
    const testedAt = new Date().toISOString();

    for (const covenant of covenants) {
      // Calculate test result
      const financialData = {
        ebitda: financialPeriod.ebitda_adjusted || financialPeriod.ebitda_reported || 0,
        totalDebt: financialPeriod.total_debt || 0,
        interestExpense: financialPeriod.interest_expense || 0,
        fixedCharges: financialPeriod.fixed_charges || financialPeriod.interest_expense || 0,
        currentAssets: financialPeriod.current_assets || 0,
        currentLiabilities: financialPeriod.current_liabilities || 1,
        netWorth: financialPeriod.net_worth || 0,
      };

      const testResult = calculateCovenantTest(
        covenant.type,
        covenant.operator as "max" | "min",
        covenant.threshold,
        financialData
      );

      // Insert covenant test record
      const { data: testRecord, error: testError } = await supabase
        .from("covenant_tests")
        .insert({
          organization_id: orgId,
          covenant_id: covenant.id,
          financial_period_id: financialPeriod.id,
          calculated_value: testResult.calculatedValue,
          threshold_at_test: covenant.threshold,
          status: testResult.status,
          headroom_absolute: testResult.headroomAbsolute,
          headroom_percentage: testResult.headroomPercentage,
          tested_at: testedAt,
        } as never)
        .select()
        .single();

      if (testError) {
        console.error("Error creating test record:", testError);
        continue;
      }

      testResults.push({
        covenantId: covenant.id,
        covenantName: covenant.name,
        ...testResult,
      });

      // Create alert if breach or warning
      if (testResult.status === "breach" || testResult.status === "warning") {
        const alertData = {
          organization_id: orgId,
          loan_id: loanId,
          covenant_id: covenant.id,
          covenant_test_id: (testRecord as any).id,
          type: "covenant_test",
          severity: testResult.status === "breach" ? "critical" : "warning",
          title: `${covenant.name} ${testResult.status === "breach" ? "Breach" : "Warning"}`,
          message: `${covenant.name} is ${testResult.status === "breach" ? "in breach" : "at warning level"} with a calculated value of ${testResult.calculatedValue.toFixed(2)}x against a threshold of ${covenant.operator === "max" ? "≤" : "≥"} ${covenant.threshold}x (${Math.abs(testResult.headroomPercentage).toFixed(1)}% ${testResult.status === "breach" ? "over" : "headroom"}).`,
          acknowledged: false,
        };

        const { data: alertRecord, error: alertError } = await supabase
          .from("alerts")
          .insert(alertData as never)
          .select()
          .single();

        if (!alertError && alertRecord) {
          alerts.push(alertRecord);
        }
      }
    }

    // Log audit event
    await supabase.from("audit_logs").insert({
      organization_id: orgId,
      user_id: userData.id,
      action: "test",
      entity_type: "loan",
      entity_id: loanId,
      changes: {
        tests_run: testResults.length,
        alerts_created: alerts.length,
        period_end: financialPeriod.period_end_date,
      },
    } as never);

    return NextResponse.json({
      success: true,
      loanId,
      periodEndDate: financialPeriod.period_end_date,
      results: testResults,
      alertsCreated: alerts.length,
      message: `Successfully ran ${testResults.length} covenant tests`,
    });
  } catch (error) {
    console.error("Covenant test error:", error);
    return NextResponse.json(
      { error: "Failed to run covenant tests", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
