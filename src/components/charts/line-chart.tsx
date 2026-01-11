"use client";

import {
  Line,
  LineChart as RechartsLineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { useChartTheme } from "./use-chart-theme";

interface LineChartProps<T extends Record<string, unknown>> {
  data: T[];
  xKey: keyof T;
  lines: Array<{ key: keyof T; color: string; name: string; dashed?: boolean }>;
  height?: number;
  showGrid?: boolean;
  showAxis?: boolean;
  showLegend?: boolean;
  formatXAxis?: (value: string) => string;
  formatYAxis?: (value: number) => string;
}

export function LineChart<T extends Record<string, unknown>>({
  data,
  xKey,
  lines,
  height = 300,
  showGrid = true,
  showAxis = true,
  showLegend = false,
  formatXAxis,
  formatYAxis,
}: LineChartProps<T>) {
  const theme = useChartTheme();

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        {showGrid && (
          <CartesianGrid
            strokeDasharray={theme.grid.strokeDasharray}
            stroke={theme.grid.stroke}
            vertical={false}
          />
        )}
        {showAxis && (
          <>
            <XAxis
              dataKey={String(xKey)}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: theme.fontSize, fill: theme.axis.tickFill }}
              tickFormatter={formatXAxis}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: theme.fontSize, fill: theme.axis.tickFill }}
              tickFormatter={formatYAxis}
              width={60}
            />
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: theme.tooltip.background,
            border: `1px solid ${theme.tooltip.border}`,
            borderRadius: theme.tooltip.borderRadius,
            fontSize: theme.fontSize,
            color: theme.tooltip.text,
          }}
          cursor={{ stroke: theme.colors.muted, strokeDasharray: "3 3" }}
        />
        {showLegend && (
          <Legend
            iconType="line"
            wrapperStyle={{ fontSize: theme.fontSize, color: theme.colors.muted }}
          />
        )}
        {lines.map((line) => (
          <Line
            key={String(line.key)}
            type="monotone"
            dataKey={String(line.key)}
            stroke={line.color}
            strokeWidth={2}
            strokeDasharray={line.dashed ? "5 5" : undefined}
            dot={false}
            activeDot={{ r: 4, fill: line.color }}
            name={line.name}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
