"use client";

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { chartColors, chartTheme, statusColors } from "./chart-config";

interface BarChartProps<T extends Record<string, unknown>> {
  data: T[];
  xKey: keyof T;
  yKey: keyof T;
  height?: number;
  color?: string;
  showGrid?: boolean;
  showAxis?: boolean;
  colorByStatus?: boolean;
  statusKey?: keyof T;
  formatXAxis?: (value: string) => string;
  formatYAxis?: (value: number) => string;
  formatTooltip?: (value: number) => string;
}

export function BarChart<T extends Record<string, unknown>>({
  data,
  xKey,
  yKey,
  height = 300,
  color = chartColors.chart1,
  showGrid = true,
  showAxis = true,
  colorByStatus = false,
  statusKey,
  formatXAxis,
  formatYAxis,
  formatTooltip,
}: BarChartProps<T>) {
  const getBarColor = (entry: T) => {
    if (colorByStatus && statusKey) {
      const status = entry[statusKey] as keyof typeof statusColors;
      return statusColors[status] || color;
    }
    return color;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        {showGrid && (
          <CartesianGrid
            strokeDasharray={chartTheme.grid.strokeDasharray}
            stroke={chartTheme.grid.stroke}
            vertical={false}
          />
        )}
        {showAxis && (
          <>
            <XAxis
              dataKey={String(xKey)}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: chartTheme.fontSize, fill: chartColors.muted }}
              tickFormatter={formatXAxis}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: chartTheme.fontSize, fill: chartColors.muted }}
              tickFormatter={formatYAxis}
              width={60}
            />
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: chartTheme.tooltip.background,
            border: `1px solid ${chartTheme.tooltip.border}`,
            borderRadius: chartTheme.tooltip.borderRadius,
            fontSize: chartTheme.fontSize,
          }}
          formatter={(value) => [
            formatTooltip ? formatTooltip(value as number) : value,
            String(yKey),
          ]}
          cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }}
        />
        <Bar dataKey={String(yKey)} radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

interface StackedBarChartProps<T extends Record<string, unknown>> {
  data: T[];
  xKey: keyof T;
  bars: Array<{ key: keyof T; color: string; name: string }>;
  height?: number;
  showGrid?: boolean;
  showAxis?: boolean;
  formatXAxis?: (value: string) => string;
  formatYAxis?: (value: number) => string;
}

export function StackedBarChart<T extends Record<string, unknown>>({
  data,
  xKey,
  bars,
  height = 300,
  showGrid = true,
  showAxis = true,
  formatXAxis,
  formatYAxis,
}: StackedBarChartProps<T>) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        {showGrid && (
          <CartesianGrid
            strokeDasharray={chartTheme.grid.strokeDasharray}
            stroke={chartTheme.grid.stroke}
            vertical={false}
          />
        )}
        {showAxis && (
          <>
            <XAxis
              dataKey={String(xKey)}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: chartTheme.fontSize, fill: chartColors.muted }}
              tickFormatter={formatXAxis}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: chartTheme.fontSize, fill: chartColors.muted }}
              tickFormatter={formatYAxis}
              width={60}
            />
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: chartTheme.tooltip.background,
            border: `1px solid ${chartTheme.tooltip.border}`,
            borderRadius: chartTheme.tooltip.borderRadius,
            fontSize: chartTheme.fontSize,
          }}
          cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }}
        />
        {bars.map((bar) => (
          <Bar
            key={String(bar.key)}
            dataKey={String(bar.key)}
            stackId="stack"
            fill={bar.color}
            name={bar.name}
            radius={[0, 0, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
