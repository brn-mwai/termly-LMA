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
import { useChartTheme, statusColors } from "./use-chart-theme";

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
  color,
  showGrid = true,
  showAxis = true,
  colorByStatus = false,
  statusKey,
  formatXAxis,
  formatYAxis,
  formatTooltip,
}: BarChartProps<T>) {
  const theme = useChartTheme();
  const chartColor = color || theme.colors.chart1;

  const getBarColor = (entry: T) => {
    if (colorByStatus && statusKey) {
      const status = entry[statusKey] as keyof typeof statusColors;
      return statusColors[status] || chartColor;
    }
    return chartColor;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
          formatter={(value) => [
            formatTooltip ? formatTooltip(value as number) : value,
            String(yKey),
          ]}
          cursor={{ fill: theme.colors.muted, opacity: 0.1 }}
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
  const theme = useChartTheme();

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
          cursor={{ fill: theme.colors.muted, opacity: 0.1 }}
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
