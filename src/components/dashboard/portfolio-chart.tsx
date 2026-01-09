"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart } from "@/components/charts/area-chart";
import { chartColors } from "@/components/charts/chart-config";
import { chartAnimation } from "@/lib/animations";
import { format, subDays, subMonths } from "date-fns";

type DateRange = "7d" | "30d" | "90d" | "1y";

interface PortfolioDataPoint {
  date: string;
  value: number;
  [key: string]: string | number;
}

interface PortfolioChartProps {
  data?: PortfolioDataPoint[];
  currentValue?: number;
}

// Generate mock data if not provided
function generateMockData(range: DateRange, baseValue: number): PortfolioDataPoint[] {
  const now = new Date();
  const points: PortfolioDataPoint[] = [];

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
  }

  let value = baseValue * 0.85;
  for (let i = days; i >= 0; i--) {
    const date = subDays(now, i);
    value = value + (Math.random() - 0.45) * (baseValue * 0.02);
    value = Math.max(baseValue * 0.7, Math.min(baseValue * 1.1, value));
    points.push({
      date: format(date, "MMM d"),
      value: Math.round(value),
    });
  }

  // Ensure last point is the current value
  points[points.length - 1].value = baseValue;

  return points;
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  } else if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

export function PortfolioChart({ data, currentValue = 500000000 }: PortfolioChartProps) {
  const [range, setRange] = useState<DateRange>("30d");

  const chartData = data || generateMockData(range, currentValue);

  const ranges: { value: DateRange; label: string }[] = [
    { value: "7d", label: "7D" },
    { value: "30d", label: "30D" },
    { value: "90d", label: "90D" },
    { value: "1y", label: "1Y" },
  ];

  return (
    <motion.div {...chartAnimation}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-medium">Portfolio Value</CardTitle>
          <div className="flex gap-1">
            {ranges.map((r) => (
              <Button
                key={r.value}
                variant={range === r.value ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setRange(r.value)}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <AreaChart
            data={chartData}
            xKey="date"
            yKey="value"
            height={250}
            color={chartColors.chart1}
            formatYAxis={formatCurrency}
            formatTooltip={formatCurrency}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
