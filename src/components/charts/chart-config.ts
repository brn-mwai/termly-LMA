// Chart theme configuration using CSS variables from globals.css
// These CSS variables automatically adapt to light/dark mode

export const chartColors = {
  primary: "hsl(var(--primary))",
  foreground: "hsl(var(--foreground))",
  chart1: "hsl(var(--chart-1))", // Uses theme chart colors
  chart2: "hsl(var(--chart-2))",
  chart3: "hsl(var(--chart-3))",
  chart4: "hsl(var(--chart-4))",
  chart5: "hsl(var(--chart-5))",
  compliant: "#22c55e",
  warning: "#f59e0b",
  breach: "#ef4444",
  info: "#3b82f6",
  muted: "hsl(var(--muted-foreground))",
} as const;

export const chartTheme = {
  fontSize: 12,
  fontFamily: "var(--font-sans)",
  axis: {
    stroke: "hsl(var(--border))",
    tickSize: 0,
  },
  grid: {
    stroke: "hsl(var(--border))",
    strokeDasharray: "3 3",
  },
  tooltip: {
    background: "hsl(var(--popover))",
    border: "hsl(var(--border))",
    text: "hsl(var(--popover-foreground))",
    borderRadius: 8,
  },
} as const;

export const statusColors = {
  compliant: chartColors.compliant,
  warning: chartColors.warning,
  breach: chartColors.breach,
  pending: chartColors.muted,
} as const;
