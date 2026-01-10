import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { format, subDays } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30d";

    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("clerk_id", userId)
      .single();

    const orgId = (userData as { organization_id: string } | null)?.organization_id;
    if (!orgId) {
      return NextResponse.json({ data: [] });
    }

    // Calculate date range
    let days: number;
    switch (range) {
      case "7d":
        days = 7;
        break;
      case "30d":
        days = 30;
        break;
      case "90d":
        days = 90;
        break;
      case "1y":
        days = 365;
        break;
      default:
        days = 30;
    }

    // Get all loans with their creation dates and commitment amounts
    const { data: loansData } = await supabase
      .from("loans")
      .select("id, commitment_amount, created_at")
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    const loans = (loansData || []) as Array<{ id: string; commitment_amount: number; created_at: string }>;

    if (loans.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Build portfolio value over time
    const dataPoints: { date: string; value: number }[] = [];
    const now = new Date();

    for (let i = days; i >= 0; i--) {
      const date = subDays(now, i);

      // Sum commitment amounts for loans that existed at this point
      const portfolioValue = loans.reduce((sum, loan) => {
        const loanCreatedAt = new Date(loan.created_at);
        if (loanCreatedAt <= date) {
          return sum + (Number(loan.commitment_amount) || 0);
        }
        return sum;
      }, 0);

      // Only add data points at intervals to avoid too many points
      const interval = days <= 7 ? 1 : days <= 30 ? 1 : days <= 90 ? 3 : 7;
      if (i % interval === 0 || i === 0) {
        dataPoints.push({
          date: format(date, days <= 30 ? "MMM d" : "MMM d"),
          value: portfolioValue,
        });
      }
    }

    return NextResponse.json({ data: dataPoints });
  } catch (error) {
    console.error("Portfolio history error:", error);
    return NextResponse.json({ error: "Failed to fetch portfolio history" }, { status: 500 });
  }
}
