'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ChartBar, Clock } from '@phosphor-icons/react';

export default function AnalyticsPage() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-normal tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Portfolio analytics and reporting
        </p>
      </div>

      {/* Coming Soon Card */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <ChartBar className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Analytics Coming Soon</h2>
          <p className="text-muted-foreground max-w-md mb-4">
            We're building powerful analytics dashboards to help you visualize your portfolio performance,
            covenant trends, and compliance metrics.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Expected Q2 2026</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
