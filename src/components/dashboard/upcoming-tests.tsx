"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock } from "lucide-react";
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
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
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">No upcoming tests scheduled</p>
            <p className="text-xs mt-1">Add covenants to loans to track test dates</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((test) => (
              <Link
                key={test.id}
                href={`/loans/${test.loanId}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getStatusDot(test.lastStatus)}
                  <div>
                    <p className="font-medium text-sm">{test.borrower}</p>
                    <p className="text-xs text-muted-foreground">
                      {test.covenantType} - {test.loanName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(test.testDate, "MMM d, yyyy")}
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
