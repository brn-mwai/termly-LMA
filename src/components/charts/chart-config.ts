// Chart theme configuration
// This file re-exports from use-chart-theme for backwards compatibility
// For dynamic theme-aware colors, use the useChartTheme hook directly

export { statusColors } from "./use-chart-theme";

// Static colors for use in non-hook contexts (e.g., server components)
// Note: For proper dark mode support in client components, use useChartTheme hook
export const chartColors = {
  primary: "#17A417",
  chart1: "#17A417", // Termly green
  chart2: "#0d9488", // Teal
  chart3: "#3b82f6", // Blue
  chart4: "#84cc16", // Lime
  chart5: "#eab308", // Yellow
  compliant: "#22c55e",
  warning: "#f59e0b",
  breach: "#ef4444",
  info: "#3b82f6",
  muted: "#71717a",
} as const;

// Static theme for backwards compatibility
// For proper dark mode support, use useChartTheme hook
export const chartTheme = {
  fontSize: 12,
  fontFamily: "var(--font-sans)",
  axis: {
    stroke: "#e4e4e7",
    tickSize: 0,
  },
  grid: {
    stroke: "#e4e4e7",
    strokeDasharray: "3 3",
  },
  tooltip: {
    background: "#ffffff",
    border: "#e4e4e7",
    text: "#18181b",
    borderRadius: 8,
  },
} as const;
