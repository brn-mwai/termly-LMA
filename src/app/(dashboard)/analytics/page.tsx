'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartBar,
  TrendUp,
  TrendDown,
  Warning,
  ShieldCheck,
  Lightning,
  Sparkle,
  ArrowClockwise,
  CaretRight,
  Buildings,
  ChartLine,
  Target,
  Eye,
} from '@phosphor-icons/react';
import Link from 'next/link';

interface AnalyticsData {
  metrics: {
    totalLoans: number;
    totalBorrowers: number;
    portfolioValue: number;
    outstandingValue: number;
    complianceRate: number;
    breachCount: number;
    warningCount: number;
    compliantCount: number;
    criticalAlerts: number;
    warningAlerts: number;
    avgHeadroom: number;
    industryBreakdown: { industry: string; count: number; value: number }[];
    upcomingTests: number;
    documentsNeedingReview: number;
  };
  trends: { period: string; compliant: number; warning: number; breach: number }[];
  highRiskBorrowers: {
    id: string;
    name: string;
    loanCount: number;
    breachCount: number;
    warningCount: number;
    totalExposure: number;
    riskScore: number;
  }[];
  insights: {
    summary: string;
    recommendations: string[];
    riskAssessment: string;
    outlook: string;
  };
  generatedAt: string;
}

function formatCurrency(value: number): string {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

function getRiskColor(score: number): string {
  if (score >= 70) return 'text-red-600 bg-red-50';
  if (score >= 40) return 'text-amber-600 bg-amber-50';
  return 'text-green-600 bg-green-50';
}

function getRiskLabel(score: number): string {
  if (score >= 70) return 'High Risk';
  if (score >= 40) return 'Medium Risk';
  return 'Low Risk';
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setError(null);
      const response = await fetch('/api/analytics/summary');
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-normal tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">AI-powered portfolio insights</p>
        </div>
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Warning className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Failed to load analytics</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRefresh}>
              <ArrowClockwise className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { metrics, trends, highRiskBorrowers, insights } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-normal tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            AI-powered portfolio insights and performance metrics
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <ArrowClockwise className={`h-4 w-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* AI Summary Card */}
      <Card className="bg-gradient-to-br from-primary/5 via-background to-primary/5 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkle className="h-5 w-5 text-primary" weight="fill" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Portfolio Summary</CardTitle>
              <CardDescription>
                Generated {new Date(data.generatedAt).toLocaleString()}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">{insights.summary}</p>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Risk Assessment */}
            <div className="p-3 rounded-lg bg-background/80 border">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium">Risk Assessment</span>
              </div>
              <p className="text-sm text-muted-foreground">{insights.riskAssessment}</p>
            </div>

            {/* Outlook */}
            <div className="p-3 rounded-lg bg-background/80 border">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Outlook</span>
              </div>
              <p className="text-sm text-muted-foreground">{insights.outlook}</p>
            </div>
          </div>

          {/* Recommendations */}
          {insights.recommendations.length > 0 && (
            <div className="pt-2">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Lightning className="h-4 w-4 text-primary" weight="fill" />
                Recommended Actions
              </h4>
              <ul className="space-y-1.5">
                {insights.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CaretRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Portfolio Health"
          value={`${metrics.complianceRate}%`}
          subtitle="Compliance rate"
          icon={<ShieldCheck className="h-5 w-5" weight="fill" />}
          trend={metrics.complianceRate >= 80 ? 'up' : 'down'}
          color={metrics.complianceRate >= 80 ? 'green' : metrics.complianceRate >= 60 ? 'amber' : 'red'}
        />
        <MetricCard
          title="Average Headroom"
          value={`${metrics.avgHeadroom}%`}
          subtitle="Across all covenants"
          icon={<ChartBar className="h-5 w-5" />}
          trend={metrics.avgHeadroom >= 15 ? 'up' : 'down'}
          color={metrics.avgHeadroom >= 15 ? 'green' : metrics.avgHeadroom >= 5 ? 'amber' : 'red'}
        />
        <MetricCard
          title="Active Alerts"
          value={String(metrics.criticalAlerts + metrics.warningAlerts)}
          subtitle={`${metrics.criticalAlerts} critical, ${metrics.warningAlerts} warning`}
          icon={<Warning className="h-5 w-5" />}
          color={metrics.criticalAlerts > 0 ? 'red' : metrics.warningAlerts > 0 ? 'amber' : 'green'}
        />
        <MetricCard
          title="Upcoming Tests"
          value={String(metrics.upcomingTests)}
          subtitle="Next 30 days"
          icon={<ChartLine className="h-5 w-5" />}
          color="blue"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Compliance Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compliance Trend</CardTitle>
            <CardDescription>Monthly covenant test results</CardDescription>
          </CardHeader>
          <CardContent>
            {trends.length > 0 ? (
              <div className="space-y-3">
                {trends.slice(-6).map((trend) => {
                  const total = trend.compliant + trend.warning + trend.breach;
                  if (total === 0) return null;
                  return (
                    <div key={trend.period} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{formatPeriod(trend.period)}</span>
                        <span className="font-medium">{total} tests</span>
                      </div>
                      <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                        <div
                          className="bg-green-500 transition-all"
                          style={{ width: `${(trend.compliant / total) * 100}%` }}
                        />
                        <div
                          className="bg-amber-500 transition-all"
                          style={{ width: `${(trend.warning / total) * 100}%` }}
                        />
                        <div
                          className="bg-red-500 transition-all"
                          style={{ width: `${(trend.breach / total) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500" /> Compliant
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Warning
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" /> Breach
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                No trend data available yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Industry Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Industry Exposure</CardTitle>
            <CardDescription>Portfolio distribution by sector</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.industryBreakdown.length > 0 ? (
              <div className="space-y-3">
                {metrics.industryBreakdown.slice(0, 5).map((industry) => {
                  const percentage = metrics.portfolioValue > 0
                    ? (industry.value / metrics.portfolioValue) * 100
                    : 0;
                  return (
                    <div key={industry.industry} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Buildings className="h-4 w-4 text-muted-foreground" />
                          {industry.industry}
                        </span>
                        <span className="font-medium">{formatCurrency(industry.value)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={percentage} className="h-2" />
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                No industry data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* High Risk Borrowers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Risk Monitor</CardTitle>
          <CardDescription>Borrowers requiring attention based on AI risk scoring</CardDescription>
        </CardHeader>
        <CardContent>
          {highRiskBorrowers.length > 0 ? (
            <div className="space-y-3">
              {highRiskBorrowers.map((borrower) => (
                <div
                  key={borrower.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getRiskColor(borrower.riskScore)}`}>
                      <Warning className="h-4 w-4" weight="fill" />
                    </div>
                    <div>
                      <p className="font-medium">{borrower.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {borrower.loanCount} loan{borrower.loanCount !== 1 ? 's' : ''} &middot;{' '}
                        {formatCurrency(borrower.totalExposure)} exposure
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        {borrower.breachCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {borrower.breachCount} breach
                          </Badge>
                        )}
                        {borrower.warningCount > 0 && (
                          <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                            {borrower.warningCount} warning
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <p className={`text-sm font-medium ${getRiskColor(borrower.riskScore).split(' ')[0]}`}>
                        {borrower.riskScore}/100
                      </p>
                      <p className="text-xs text-muted-foreground">{getRiskLabel(borrower.riskScore)}</p>
                    </div>
                    <Link href={`/loans?borrower=${borrower.id}`}>
                      <Button variant="ghost" size="sm">
                        <CaretRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ShieldCheck className="h-12 w-12 text-green-500 mb-3" weight="fill" />
              <p className="font-medium text-green-600">All borrowers in good standing</p>
              <p className="text-sm text-muted-foreground">No high-risk borrowers identified</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrency(metrics.portfolioValue)}</p>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(metrics.outstandingValue)} outstanding
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{metrics.totalLoans}</p>
            <p className="text-sm text-muted-foreground">
              {metrics.totalBorrowers} borrower{metrics.totalBorrowers !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Covenant Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold text-green-600">{metrics.compliantCount}</span>
              <span className="text-2xl text-muted-foreground">/</span>
              <span className="text-2xl font-semibold text-amber-600">{metrics.warningCount}</span>
              <span className="text-2xl text-muted-foreground">/</span>
              <span className="text-2xl font-semibold text-red-600">{metrics.breachCount}</span>
            </div>
            <p className="text-sm text-muted-foreground">Compliant / Warning / Breach</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  color: 'green' | 'amber' | 'red' | 'blue';
}) {
  const colorClasses = {
    green: 'text-green-600 bg-green-50',
    amber: 'text-amber-600 bg-amber-50',
    red: 'text-red-600 bg-red-50',
    blue: 'text-blue-600 bg-blue-50',
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
          {trend && (
            <div className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>
              {trend === 'up' ? <TrendUp className="h-4 w-4" /> : <TrendDown className="h-4 w-4" />}
            </div>
          )}
        </div>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function formatPeriod(period: string): string {
  const [year, month] = period.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-normal tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">AI-powered portfolio insights</p>
      </div>

      {/* AI Summary Skeleton */}
      <Card className="bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div>
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
          </div>
        </CardContent>
      </Card>

      {/* Metrics Skeleton */}
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-9 w-9 rounded-lg mb-2" />
              <Skeleton className="h-8 w-20 mb-1" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
