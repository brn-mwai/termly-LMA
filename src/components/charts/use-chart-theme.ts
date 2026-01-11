"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// Light mode colors
const lightColors = {
  foreground: "#18181b", // gray-900
  muted: "#71717a", // gray-500
  border: "#e4e4e7", // gray-200
  background: "#ffffff",
  popover: "#ffffff",
  popoverForeground: "#18181b",
  chart1: "#17A417", // Termly green
  chart2: "#0d9488", // Teal
  chart3: "#3b82f6", // Blue
  chart4: "#84cc16", // Lime
  chart5: "#eab308", // Yellow
};

// Dark mode colors
const darkColors = {
  foreground: "#fafafa", // gray-50
  muted: "#a1a1aa", // gray-400
  border: "#3f3f46", // gray-700
  background: "#18181b", // gray-900
  popover: "#27272a", // gray-800
  popoverForeground: "#fafafa",
  chart1: "#22c55e", // Brighter green for dark mode
  chart2: "#14b8a6", // Teal
  chart3: "#60a5fa", // Blue
  chart4: "#a3e635", // Lime
  chart5: "#facc15", // Yellow
};

// Status colors (same for both themes - they're designed to be visible)
const statusColors = {
  compliant: "#22c55e",
  warning: "#f59e0b",
  breach: "#ef4444",
  info: "#3b82f6",
};

export interface ChartThemeColors {
  foreground: string;
  muted: string;
  border: string;
  background: string;
  popover: string;
  popoverForeground: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  compliant: string;
  warning: string;
  breach: string;
  info: string;
}

export interface ChartThemeConfig {
  colors: ChartThemeColors;
  tooltip: {
    background: string;
    border: string;
    text: string;
    borderRadius: number;
  };
  grid: {
    stroke: string;
    strokeDasharray: string;
  };
  axis: {
    stroke: string;
    tickFill: string;
  };
  fontSize: number;
}

export function useChartTheme(): ChartThemeConfig {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Default to light theme colors during SSR and before mount
  const isDark = mounted && resolvedTheme === "dark";
  const themeColors = isDark ? darkColors : lightColors;

  const colors: ChartThemeColors = {
    ...themeColors,
    ...statusColors,
  };

  return {
    colors,
    tooltip: {
      background: colors.popover,
      border: colors.border,
      text: colors.popoverForeground,
      borderRadius: 8,
    },
    grid: {
      stroke: colors.border,
      strokeDasharray: "3 3",
    },
    axis: {
      stroke: colors.border,
      tickFill: colors.muted,
    },
    fontSize: 12,
  };
}

// Export static status colors for use in non-hook contexts
export { statusColors };
