"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StackedBarChart } from "@/components/charts/bar-chart";
import { statusColors } from "@/components/charts/chart-config";
import { chartAnimation } from "@/lib/animations";
import { ChartBar, SpinnerGap } from "@phosphor-icons/react";

type DateRange = "6m" | "12m";

interface ComplianceDataPoint {
  month: string;
  compliant: number;
  warning: number;
  breach: number;
  [key: string]: string | number;
}

export function ComplianceChart() {
  const [range, setRange] = useState<DateRange>("6m");
  const [chartData, setChartData] = useState<ComplianceDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/dashboard/compliance-history?range=${range}`);
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
            {chartData.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {complianceRate}% compliance rate over {range === "6m" ? "6 months" : "1 year"}
              </p>
            )}
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
          {loading ? (
            <div className="flex items-center justify-center h-[200px]">
              <SpinnerGap className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <ChartBar className="h-12 w-12 mb-2" />
              <p className="text-sm">No compliance history data</p>
              <p className="text-xs mt-1">Run covenant tests to see trends</p>
            </div>
          ) : (
            <>
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
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
