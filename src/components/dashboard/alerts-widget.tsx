"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Warning, WarningCircle, Info, CaretRight, BellSimple } from "@phosphor-icons/react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface Alert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  borrower: string;
  createdAt: Date;
}

interface AlertsWidgetProps {
  alerts?: Alert[];
}

function getSeverityIcon(severity: Alert["severity"]) {
  switch (severity) {
    case "critical":
      return <Warning className="h-4 w-4 text-red-600" />;
    case "warning":
      return <WarningCircle className="h-4 w-4 text-yellow-600" />;
    case "info":
      return <Info className="h-4 w-4 text-blue-600" />;
    default:
      return <Info className="h-4 w-4 text-gray-600" />;
  }
}

function getSeverityBadge(severity: Alert["severity"]) {
  const variants = {
    critical: "bg-red-100 text-red-800",
    warning: "bg-yellow-100 text-yellow-800",
    info: "bg-blue-100 text-blue-800",
  };

  return (
    <Badge variant="secondary" className={variants[severity] || variants.info}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </Badge>
  );
}

export function AlertsWidget({ alerts }: AlertsWidgetProps) {
  const items = alerts || [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <CardTitle className="flex items-center gap-2">
          <Warning className="h-5 w-5" />
          Recent Alerts
        </CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link href="/alerts">View All</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[280px]">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <BellSimple className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">All clear</p>
              <p className="text-xs text-muted-foreground/70">No active alerts</p>
            </div>
          ) : (
            <div className="divide-y">
              {items.map((alert) => (
                <Link
                  key={alert.id}
                  href={`/alerts/${alert.id}`}
                  className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors overflow-hidden"
                >
                  <div className="mt-0.5 flex-shrink-0">{getSeverityIcon(alert.severity)}</div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {getSeverityBadge(alert.severity)}
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(alert.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="font-medium text-sm truncate" title={alert.title}>{alert.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2" title={`${alert.borrower}: ${alert.message}`}>
                      {alert.borrower}: {alert.message}
                    </p>
                  </div>
                  <CaretRight className="h-4 w-4 text-muted-foreground mt-2 flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
