"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Buildings,
  Warning,
  CheckCircle,
  TrendDown,
  TrendUp,
  CurrencyDollar,
} from "@phosphor-icons/react";
import { TrendSparkline } from "@/components/charts/sparkline";
import { AnimatedNumber, AnimatedCurrency, AnimatedPercentage } from "@/components/ui/animated-number";
import { staggerContainer, staggerItem } from "@/lib/animations";

interface StatsData {
  totalLoans: number;
  uniqueBorrowers: number;
  portfolioValue: number;
  compliantCount: number;
  warningCount: number;
  breachCount: number;
  totalAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  // Optional trend data
  loansTrend?: number[];
  portfolioTrend?: number[];
  complianceTrend?: number[];
  alertsTrend?: number[];
}

interface StatsCardsProps {
  stats?: StatsData;
}

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  description?: React.ReactNode;
  icon: React.ReactNode;
  iconBgClass?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  sparklineData?: number[];
  href?: string;
  className?: string;
}

function StatCard({
  title,
  value,
  description,
  icon,
  iconBgClass = "bg-muted",
  trend,
  sparklineData,
  href,
  className,
}: StatCardProps) {
  const content = (
    <Card className={cn(
      "transition-all duration-200",
      href && "cursor-pointer hover:shadow-md hover:border-primary/20",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", iconBgClass)}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl font-bold">{value}</div>
            {description && (
              <div className="text-xs text-muted-foreground mt-1">{description}</div>
            )}
            {trend && (
              <div
                className={cn(
                  "flex items-center text-xs mt-2",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}
              >
                {trend.isPositive ? (
                  <TrendUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendDown className="h-3 w-3 mr-1" />
                )}
                {trend.value}% from last month
              </div>
            )}
          </div>
          {sparklineData && sparklineData.length > 0 && (
            <div className="ml-4">
              <TrendSparkline data={sparklineData} width={64} height={32} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

// Generate mock trend data if not provided
function generateMockTrend(baseValue: number, length: number = 7): number[] {
  const trend: number[] = [];
  let current = baseValue * 0.8;
  for (let i = 0; i < length; i++) {
    current = current + (Math.random() - 0.4) * (baseValue * 0.1);
    current = Math.max(0, current);
    trend.push(current);
  }
  trend[length - 1] = baseValue; // End at current value
  return trend;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const totalLoans = stats?.totalLoans ?? 0;
  const uniqueBorrowers = stats?.uniqueBorrowers ?? 0;
  const portfolioValue = stats?.portfolioValue ?? 0;
  const compliantCount = stats?.compliantCount ?? 0;
  const warningCount = stats?.warningCount ?? 0;
  const breachCount = stats?.breachCount ?? 0;
  const totalAlerts = stats?.totalAlerts ?? 0;
  const criticalAlerts = stats?.criticalAlerts ?? 0;
  const warningAlerts = stats?.warningAlerts ?? 0;

  const totalTests = compliantCount + warningCount + breachCount;
  const complianceRate = totalTests > 0
    ? Math.round((compliantCount / totalTests) * 100)
    : 0;

  // Use provided trends or generate mock data
  const loansTrend = stats?.loansTrend || generateMockTrend(totalLoans);
  const portfolioTrend = stats?.portfolioTrend || generateMockTrend(portfolioValue);
  const complianceTrend = stats?.complianceTrend || generateMockTrend(compliantCount);
  const alertsTrend = stats?.alertsTrend || generateMockTrend(totalAlerts);

  return (
    <motion.div
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <motion.div variants={staggerItem}>
        <StatCard
          title="Total Loans"
          value={<AnimatedNumber value={totalLoans} />}
          description={`Across ${uniqueBorrowers} borrower${uniqueBorrowers !== 1 ? 's' : ''}`}
          icon={<Buildings className="h-4 w-4 text-muted-foreground" />}
          sparklineData={loansTrend}
          href="/loans"
        />
      </motion.div>
      <motion.div variants={staggerItem}>
        <StatCard
          title="Portfolio Value"
          value={<AnimatedCurrency value={portfolioValue} />}
          description="Total commitment"
          icon={<CurrencyDollar className="h-4 w-4 text-muted-foreground" />}
          sparklineData={portfolioTrend}
          href="/loans"
        />
      </motion.div>
      <motion.div variants={staggerItem}>
        <StatCard
          title="Compliant"
          value={<AnimatedNumber value={compliantCount} />}
          description={
            <span className="flex items-center gap-1">
              <AnimatedPercentage value={complianceRate} /> compliance rate
            </span>
          }
          icon={<CheckCircle className="h-4 w-4 text-green-600" />}
          iconBgClass="bg-green-100 dark:bg-green-900/30"
          sparklineData={complianceTrend}
          href="/loans?status=compliant"
        />
      </motion.div>
      <motion.div variants={staggerItem}>
        <StatCard
          title="Alerts"
          value={<AnimatedNumber value={totalAlerts} />}
          description={`${criticalAlerts} critical, ${warningAlerts} warning${warningAlerts !== 1 ? 's' : ''}`}
          icon={<Warning className="h-4 w-4 text-red-600" />}
          iconBgClass={totalAlerts > 0 ? "bg-red-100 dark:bg-red-900/30" : "bg-muted"}
          sparklineData={alertsTrend}
          href="/alerts"
        />
      </motion.div>
    </motion.div>
  );
}
