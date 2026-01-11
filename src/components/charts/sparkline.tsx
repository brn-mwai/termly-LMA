"use client";

import {
  Area,
  AreaChart,
  Line,
  LineChart,
  ResponsiveContainer,
} from "recharts";
import { useChartTheme } from "./use-chart-theme";

interface SparklineProps {
  data: number[];
  height?: number;
  width?: number;
  color?: string;
  type?: "line" | "area";
  showPositiveNegative?: boolean;
}

export function Sparkline({
  data,
  height = 32,
  width = 80,
  color,
  type = "line",
  showPositiveNegative = false,
}: SparklineProps) {
  const theme = useChartTheme();

  // Convert simple number array to chart data format
  const chartData = data.map((value, index) => ({ index, value }));

  // Determine color based on trend (first vs last value)
  const defaultColor = color || theme.colors.chart1;
  const trendColor = showPositiveNegative
    ? data[data.length - 1] >= data[0]
      ? theme.colors.compliant
      : theme.colors.breach
    : defaultColor;

  if (type === "area") {
    return (
      <ResponsiveContainer width={width} height={height}>
        <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={`sparkline-gradient-${trendColor}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={trendColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={trendColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={trendColor}
            strokeWidth={1.5}
            fill={`url(#sparkline-gradient-${trendColor})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={trendColor}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface TrendSparklineProps {
  data: number[];
  height?: number;
  width?: number;
}

export function TrendSparkline({ data, height = 32, width = 80 }: TrendSparklineProps) {
  return (
    <Sparkline
      data={data}
      height={height}
      width={width}
      type="area"
      showPositiveNegative
    />
  );
}
