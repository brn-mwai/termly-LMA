"use client";

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
  CurrencyDollar,
} from "@phosphor-icons/react";

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
}

interface StatsCardsProps {
  stats?: StatsData;
}

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div
            className={cn(
              "flex items-center text-xs mt-2",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}
          >
            <TrendDown
              className={cn(
                "h-3 w-3 mr-1",
                trend.isPositive && "rotate-180"
              )}
            />
            {trend.value}% from last quarter
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  } else if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Loans"
        value={totalLoans}
        description={`Across ${uniqueBorrowers} borrower${uniqueBorrowers !== 1 ? 's' : ''}`}
        icon={<Buildings className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        title="Portfolio Value"
        value={formatCurrency(portfolioValue)}
        description="Total commitment"
        icon={<CurrencyDollar className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        title="Compliant"
        value={compliantCount}
        description={`${complianceRate}% compliance rate`}
        icon={<CheckCircle className="h-4 w-4 text-green-600" />}
      />
      <StatCard
        title="Alerts"
        value={totalAlerts}
        description={`${criticalAlerts} critical, ${warningAlerts} warning${warningAlerts !== 1 ? 's' : ''}`}
        icon={<Warning className="h-4 w-4 text-red-600" />}
      />
    </div>
  );
}
