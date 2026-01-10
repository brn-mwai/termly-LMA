"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatValue?: (value: number) => string;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 1,
  formatValue = (v) => Math.round(v).toLocaleString(),
  className,
}: AnimatedNumberProps) {
  const spring = useSpring(0, { duration: duration * 1000 });
  const display = useTransform(spring, (current) => formatValue(current));
  const [displayValue, setDisplayValue] = useState(formatValue(0));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    return display.on("change", (latest) => {
      setDisplayValue(latest);
    });
  }, [display]);

  return (
    <motion.span className={className}>
      {displayValue}
    </motion.span>
  );
}

interface AnimatedCurrencyProps {
  value: number;
  duration?: number;
  className?: string;
}

export function AnimatedCurrency({
  value,
  duration = 1,
  className,
}: AnimatedCurrencyProps) {
  const formatCurrency = (v: number): string => {
    if (v >= 1_000_000_000) {
      return `$${(v / 1_000_000_000).toFixed(1)}B`;
    } else if (v >= 1_000_000) {
      return `$${(v / 1_000_000).toFixed(1)}M`;
    } else if (v >= 1_000) {
      return `$${(v / 1_000).toFixed(1)}K`;
    }
    return `$${v.toFixed(0)}`;
  };

  return (
    <AnimatedNumber
      value={value}
      duration={duration}
      formatValue={formatCurrency}
      className={className}
    />
  );
}

interface AnimatedPercentageProps {
  value: number;
  duration?: number;
  className?: string;
}

export function AnimatedPercentage({
  value,
  duration = 1,
  className,
}: AnimatedPercentageProps) {
  return (
    <AnimatedNumber
      value={value}
      duration={duration}
      formatValue={(v) => `${Math.round(v)}%`}
      className={className}
    />
  );
}
