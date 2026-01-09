"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Warning, WarningCircle, Info, CaretRight } from "@phosphor-icons/react";
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Warning className="h-5 w-5" />
          Recent Alerts
        </CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link href="/alerts">View All</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[320px]">
          {items.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p className="text-sm">No active alerts</p>
            </div>
          ) : (
            <div className="divide-y">
              {items.map((alert) => (
                <Link
                  key={alert.id}
                  href={`/alerts/${alert.id}`}
                  className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="mt-0.5">{getSeverityIcon(alert.severity)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getSeverityBadge(alert.severity)}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(alert.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="font-medium text-sm">{alert.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {alert.borrower}: {alert.message}
                    </p>
                  </div>
                  <CaretRight className="h-4 w-4 text-muted-foreground mt-2" />
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
