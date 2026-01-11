"use client";

import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useChartTheme } from "./use-chart-theme";

interface AreaChartProps<T extends Record<string, unknown>> {
  data: T[];
  xKey: keyof T;
  yKey: keyof T;
  height?: number;
  color?: string;
  gradient?: boolean;
  showGrid?: boolean;
  showAxis?: boolean;
  formatXAxis?: (value: string) => string;
  formatYAxis?: (value: number) => string;
  formatTooltip?: (value: number) => string;
}

export function AreaChart<T extends Record<string, unknown>>({
  data,
  xKey,
  yKey,
  height = 300,
  color,
  gradient = true,
  showGrid = true,
  showAxis = true,
  formatXAxis,
  formatYAxis,
  formatTooltip,
}: AreaChartProps<T>) {
  const theme = useChartTheme();
  const chartColor = color || theme.colors.chart1;
  const gradientId = `gradient-${String(yKey)}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        {gradient && (
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
            </linearGradient>
          </defs>
        )}
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
        />
        <Area
          type="monotone"
          dataKey={String(yKey)}
          stroke={chartColor}
          strokeWidth={2}
          fill={gradient ? `url(#${gradientId})` : chartColor}
          fillOpacity={gradient ? 1 : 0.1}
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
