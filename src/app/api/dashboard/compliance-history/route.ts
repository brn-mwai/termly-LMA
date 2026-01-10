import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { format, subMonths } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use admin client to bypass RLS
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "6m";

    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("clerk_id", userId)
      .is("deleted_at", null)
      .single();

    const orgId = (userData as { organization_id: string } | null)?.organization_id;
    if (!orgId) {
      return NextResponse.json({ data: [] });
    }

    // Calculate months to fetch
    const months = range === "6m" ? 6 : 12;
    const startDate = subMonths(new Date(), months);

    // Get all covenant tests in the date range
    const { data: covenantTests } = await supabase
      .from("covenant_tests")
      .select(`
        id,
        status,
        tested_at,
        covenants!inner (
          organization_id
        )
      `)
      .gte("tested_at", startDate.toISOString())
      .order("tested_at", { ascending: true });

    if (!covenantTests || covenantTests.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Filter by organization (since we can't filter nested in supabase easily)
    const orgTests = (covenantTests as any[]).filter((test) =>
      test.covenants?.organization_id === orgId
    );

    if (orgTests.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Group by month
    const monthlyData: Record<string, { compliant: number; warning: number; breach: number }> = {};

    // Initialize all months
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthKey = format(monthDate, "MMM yyyy");
      monthlyData[monthKey] = { compliant: 0, warning: 0, breach: 0 };
    }

    // Count tests by month and status
    for (const test of orgTests) {
      const testDate = new Date(test.tested_at);
      const monthKey = format(testDate, "MMM yyyy");

      if (monthlyData[monthKey]) {
        const status = test.status as "compliant" | "warning" | "breach";
        if (status in monthlyData[monthKey]) {
          monthlyData[monthKey][status]++;
        }
      }
    }

    // Convert to array format for chart
    const dataPoints = Object.entries(monthlyData).map(([month, counts]) => ({
      month: month.split(" ")[0], // Just "Jan", "Feb", etc.
      ...counts,
    }));

    return NextResponse.json({ data: dataPoints });
  } catch (error) {
    console.error("Compliance history error:", error);
    return NextResponse.json({ error: "Failed to fetch compliance history" }, { status: 500 });
  }
}
