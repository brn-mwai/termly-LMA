"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// Chart colors - SAME for both themes (these are designed to be visible on any background)
const chartColors = {
  chart1: "#17A417", // Termly green
  chart2: "#0d9488", // Teal
  chart3: "#3b82f6", // Blue
  chart4: "#84cc16", // Lime
  chart5: "#eab308", // Yellow
};

// Status colors - SAME for both themes (designed for visibility)
const statusColors = {
  compliant: "#22c55e",
  warning: "#f59e0b",
  breach: "#ef4444",
  info: "#3b82f6",
};

// Text/UI colors - DIFFERENT per theme for readability
const lightTextColors = {
  foreground: "#18181b", // gray-900
  muted: "#71717a", // gray-500
  border: "#e4e4e7", // gray-200
  background: "#ffffff",
  popover: "#ffffff",
  popoverForeground: "#18181b",
};

const darkTextColors = {
  foreground: "#fafafa", // gray-50
  muted: "#a1a1aa", // gray-400
  border: "#3f3f46", // gray-700
  background: "#18181b", // gray-900
  popover: "#27272a", // gray-800
  popoverForeground: "#fafafa",
};

export interface ChartThemeColors {
  // Text/UI colors (theme-dependent)
  foreground: string;
  muted: string;
  border: string;
  background: string;
  popover: string;
  popoverForeground: string;
  // Chart colors (same for both themes)
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  // Status colors (same for both themes)
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
  const textColors = isDark ? darkTextColors : lightTextColors;

  // Combine: text colors adapt to theme, chart/status colors stay the same
  const colors: ChartThemeColors = {
    ...textColors,
    ...chartColors,
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

// Export static colors for use in non-hook contexts
export { statusColors, chartColors };
