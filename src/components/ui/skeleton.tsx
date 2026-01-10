import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

// Card skeleton for stats
function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-8 w-32" />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  );
}

// Table row skeleton
function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 py-4 px-4 border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === 0 ? "w-32" : i === columns - 1 ? "w-20" : "w-24"
          )}
        />
      ))}
    </div>
  );
}

// Alert item skeleton
function AlertItemSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg">
      <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

// Chart skeleton
function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-end justify-between h-full gap-2 px-4 pb-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1"
            style={{ height: `${Math.random() * 60 + 20}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// Stats cards skeleton (4 cards)
function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// Table skeleton
function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-lg border">
      <div className="flex items-center gap-4 py-3 px-4 border-b bg-muted/50">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} columns={columns} />
      ))}
    </div>
  );
}

export {
  Skeleton,
  CardSkeleton,
  TableRowSkeleton,
  AlertItemSkeleton,
  ChartSkeleton,
  StatsCardsSkeleton,
  TableSkeleton,
}
