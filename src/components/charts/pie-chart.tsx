"use client";

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useChartTheme, statusColors } from "./use-chart-theme";

interface PieChartData {
  name: string;
  value: number;
  color?: string;
  status?: keyof typeof statusColors;
  [key: string]: string | number | undefined;
}

interface PieChartProps {
  data: PieChartData[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  colors?: string[];
  formatValue?: (value: number) => string;
}

export function PieChart({
  data,
  height = 300,
  innerRadius = 0,
  outerRadius = 80,
  showLegend = true,
  showLabels = false,
  colors,
  formatValue,
}: PieChartProps) {
  const theme = useChartTheme();

  const defaultColors = colors || [
    theme.colors.chart1,
    theme.colors.chart2,
    theme.colors.chart3,
    theme.colors.chart4,
    theme.colors.chart5,
  ];

  const getColor = (entry: PieChartData, index: number) => {
    if (entry.color) return entry.color;
    if (entry.status) return statusColors[entry.status];
    return defaultColors[index % defaultColors.length];
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
          label={showLabels ? ({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)` : undefined}
          labelLine={showLabels}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={getColor(entry, index)}
              stroke="transparent"
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: theme.tooltip.background,
            border: `1px solid ${theme.tooltip.border}`,
            borderRadius: theme.tooltip.borderRadius,
            fontSize: theme.fontSize,
            color: theme.tooltip.text,
          }}
          formatter={(value) => [
            formatValue ? formatValue(value as number) : value,
          ]}
        />
        {showLegend && (
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            iconType="circle"
            wrapperStyle={{ fontSize: theme.fontSize, color: theme.colors.muted }}
          />
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}

export function DonutChart(props: PieChartProps) {
  return <PieChart {...props} innerRadius={60} outerRadius={80} />;
}
