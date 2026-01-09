// Chart theme configuration using CSS variables from globals.css

export const chartColors = {
  primary: "hsl(var(--primary))",
  chart1: "hsl(142 60% 45%)", // Termly green
  chart2: "hsl(185 50% 50%)", // Teal
  chart3: "hsl(227 30% 40%)", // Dark blue
  chart4: "hsl(84 60% 55%)",  // Yellow-green
  chart5: "hsl(70 60% 55%)",  // Yellow
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
