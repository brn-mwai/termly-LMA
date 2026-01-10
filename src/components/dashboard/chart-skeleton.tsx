"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartSkeletonProps {
  title?: boolean;
  height?: number;
}

// Stable pre-computed heights for consistent rendering
const BAR_HEIGHTS = [65, 82, 48, 95, 73, 58, 88, 42, 76, 55, 90, 68];

export function ChartSkeleton({ title = true, height = 300 }: ChartSkeletonProps) {
  return (
    <Card>
      {title && (
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </CardHeader>
      )}
      <CardContent>
        <div style={{ height }} className="flex items-end gap-2">
          {/* Simulate bar chart */}
          {BAR_HEIGHTS.map((h, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-t"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
