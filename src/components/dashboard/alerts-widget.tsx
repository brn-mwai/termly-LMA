"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, AlertCircle, Info, ChevronRight } from "lucide-react";
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

const mockAlerts: Alert[] = [
  {
    id: "1",
    severity: "critical",
    title: "Leverage Covenant Breach",
    message: "Debt/EBITDA ratio exceeded 5.0x maximum threshold",
    borrower: "Acme Corporation",
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
  },
  {
    id: "2",
    severity: "warning",
    title: "Headroom Below 15%",
    message: "Interest coverage ratio approaching minimum threshold",
    borrower: "Beta Industries",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: "3",
    severity: "warning",
    title: "Headroom Below 5%",
    message: "Leverage ratio within 2% of maximum threshold",
    borrower: "Epsilon Tech",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
  },
  {
    id: "4",
    severity: "info",
    title: "Document Uploaded",
    message: "Q3 2025 compliance certificate ready for review",
    borrower: "Gamma Holdings",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  },
  {
    id: "5",
    severity: "info",
    title: "Extraction Complete",
    message: "Financial data extracted from credit agreement",
    borrower: "Delta Manufacturing",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26), // 26 hours ago
  },
];

function getSeverityIcon(severity: Alert["severity"]) {
  switch (severity) {
    case "critical":
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    case "warning":
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    case "info":
      return <Info className="h-4 w-4 text-blue-600" />;
  }
}

function getSeverityBadge(severity: Alert["severity"]) {
  const variants = {
    critical: "bg-red-100 text-red-800",
    warning: "bg-yellow-100 text-yellow-800",
    info: "bg-blue-100 text-blue-800",
  };

  return (
    <Badge variant="secondary" className={variants[severity]}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </Badge>
  );
}

export function AlertsWidget() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Recent Alerts
        </CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link href="/alerts">View All</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[320px]">
          <div className="divide-y">
            {mockAlerts.map((alert) => (
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
                <ChevronRight className="h-4 w-4 text-muted-foreground mt-2" />
              </Link>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
