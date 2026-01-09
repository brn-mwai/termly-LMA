"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart } from "@/components/charts/area-chart";
import { chartColors } from "@/components/charts/chart-config";
import { chartAnimation } from "@/lib/animations";
import { ChartLine, SpinnerGap } from "@phosphor-icons/react";

type DateRange = "7d" | "30d" | "90d" | "1y";

interface PortfolioDataPoint {
  date: string;
  value: number;
  [key: string]: string | number;
}

interface PortfolioChartProps {
  currentValue?: number;
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

export function PortfolioChart({ currentValue = 0 }: PortfolioChartProps) {
  const [range, setRange] = useState<DateRange>("30d");
  const [chartData, setChartData] = useState<PortfolioDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/dashboard/portfolio-history?range=${range}`);
        if (res.ok) {
          const { data } = await res.json();
          setChartData(data || []);
        } else {
          setChartData([]);
        }
      } catch {
        setChartData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [range]);

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
          {loading ? (
            <div className="flex items-center justify-center h-[220px]">
              <SpinnerGap className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground">
              <ChartLine className="h-12 w-12 mb-2" />
              <p className="text-sm">No portfolio history data</p>
              <p className="text-xs mt-1">Current value: {formatCurrency(currentValue)}</p>
            </div>
          ) : (
            <AreaChart
              data={chartData}
              xKey="date"
              yKey="value"
              height={220}
              color={chartColors.chart1}
              formatYAxis={formatCurrency}
              formatTooltip={formatCurrency}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
