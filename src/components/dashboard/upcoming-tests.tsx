"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CalendarBlank } from "@phosphor-icons/react";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";

interface UpcomingTest {
  id: string;
  loanId: string;
  borrower: string;
  loanName: string;
  covenantType: string;
  testDate: Date;
  lastStatus: "compliant" | "warning" | "breach" | "pending";
}

interface UpcomingTestsProps {
  tests?: UpcomingTest[];
}

function getDaysUntilBadge(testDate: Date) {
  const days = differenceInDays(testDate, new Date());

  if (days < 0) {
    return (
      <Badge variant="secondary" className="bg-red-100 text-red-800">
        Overdue
      </Badge>
    );
  } else if (days <= 7) {
    return (
      <Badge variant="secondary" className="bg-red-100 text-red-800">
        {days} day{days !== 1 ? 's' : ''}
      </Badge>
    );
  } else if (days <= 14) {
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        {days} days
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="bg-gray-100 text-gray-800">
      {days} days
    </Badge>
  );
}

function getStatusDot(status: UpcomingTest["lastStatus"]) {
  const colors = {
    compliant: "bg-green-500",
    warning: "bg-yellow-500",
    breach: "bg-red-500",
    pending: "bg-gray-400",
  };

  return (
    <div className={`h-2 w-2 rounded-full ${colors[status] || colors.pending}`} title={`Last: ${status}`} />
  );
}

export function UpcomingTests({ tests }: UpcomingTestsProps) {
  const items = tests || [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Tests
        </CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link href="/loans">View Calendar</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
              <CalendarBlank className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No upcoming tests</p>
            <p className="text-xs text-muted-foreground/70 text-center">Tests will appear when covenants are added</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((test) => (
              <Link
                key={test.id}
                href={`/loans/${test.loanId}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors gap-2 overflow-hidden"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="flex-shrink-0">{getStatusDot(test.lastStatus)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate" title={test.borrower}>{test.borrower}</p>
                    <p className="text-xs text-muted-foreground truncate" title={`${test.covenantType} - ${test.loanName}`}>
                      {test.covenantType} - {test.loanName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                      <Clock className="h-3 w-3" />
                      {format(test.testDate, "MMM d")}
                    </div>
                  </div>
                  {getDaysUntilBadge(test.testDate)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
