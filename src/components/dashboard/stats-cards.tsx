"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Building2,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  DollarSign,
} from "lucide-react";

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
            <TrendingDown
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

export function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Loans"
        value="47"
        description="Across 23 borrowers"
        icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        title="Portfolio Value"
        value="$2.4B"
        description="Total commitment"
        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        title="Compliant"
        value="41"
        description="87% compliance rate"
        icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
        trend={{ value: 2.5, isPositive: true }}
      />
      <StatCard
        title="Alerts"
        value="6"
        description="3 breaches, 3 warnings"
        icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
        trend={{ value: 1.2, isPositive: false }}
      />
    </div>
  );
}
