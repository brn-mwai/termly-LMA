"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StackedBarChart } from "@/components/charts/bar-chart";
import { statusColors } from "@/components/charts/chart-config";
import { chartAnimation } from "@/lib/animations";
import { format, subMonths } from "date-fns";

type DateRange = "6m" | "12m";

interface ComplianceDataPoint {
  month: string;
  compliant: number;
  warning: number;
  breach: number;
  [key: string]: string | number;
}

interface ComplianceChartProps {
  data?: ComplianceDataPoint[];
}

// Generate mock data if not provided
function generateMockData(months: number): ComplianceDataPoint[] {
  const now = new Date();
  const points: ComplianceDataPoint[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(now, i);
    const total = 20 + Math.floor(Math.random() * 10);
    const breachRate = Math.random() * 0.15;
    const warningRate = Math.random() * 0.2;

    const breach = Math.floor(total * breachRate);
    const warning = Math.floor(total * warningRate);
    const compliant = total - breach - warning;

    points.push({
      month: format(date, "MMM"),
      compliant,
      warning,
      breach,
    });
  }

  return points;
}

export function ComplianceChart({ data }: ComplianceChartProps) {
  const [range, setRange] = useState<DateRange>("6m");

  const months = range === "6m" ? 6 : 12;
  const chartData = data || generateMockData(months);

  const bars = [
    { key: "compliant" as const, color: statusColors.compliant, name: "Compliant" },
    { key: "warning" as const, color: statusColors.warning, name: "Warning" },
    { key: "breach" as const, color: statusColors.breach, name: "Breach" },
  ];

  // Calculate totals for summary
  const totals = chartData.reduce(
    (acc, point) => ({
      compliant: acc.compliant + point.compliant,
      warning: acc.warning + point.warning,
      breach: acc.breach + point.breach,
    }),
    { compliant: 0, warning: 0, breach: 0 }
  );

  const total = totals.compliant + totals.warning + totals.breach;
  const complianceRate = total > 0 ? Math.round((totals.compliant / total) * 100) : 0;

  return (
    <motion.div {...chartAnimation}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-medium">Compliance Trend</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {complianceRate}% compliance rate over {range === "6m" ? "6 months" : "1 year"}
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              variant={range === "6m" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setRange("6m")}
            >
              6M
            </Button>
            <Button
              variant={range === "12m" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setRange("12m")}
            >
              1Y
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            {bars.map((bar) => (
              <div key={bar.key} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: bar.color }}
                />
                <span className="text-xs text-muted-foreground">{bar.name}</span>
              </div>
            ))}
          </div>
          <StackedBarChart
            data={chartData}
            xKey="month"
            bars={bars}
            height={200}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
