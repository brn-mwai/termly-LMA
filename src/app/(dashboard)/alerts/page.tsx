import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Eye,
  CheckCircle,
  Bell,
  Filter,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Alert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  borrower: string;
  loanName: string;
  loanId: string;
  covenantType?: string;
  acknowledged: boolean;
  createdAt: Date;
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    severity: "critical",
    title: "Leverage Covenant Breach",
    message:
      "Total Leverage Ratio of 5.2x exceeded maximum threshold of 5.0x. Immediate action required.",
    borrower: "Acme Corporation",
    loanName: "Senior Term Loan",
    loanId: "1",
    covenantType: "Leverage",
    acknowledged: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: "2",
    severity: "warning",
    title: "Interest Coverage Headroom Below 15%",
    message:
      "Interest Coverage Ratio at 2.3x with threshold of 2.0x. Headroom is 15% - approaching warning level.",
    borrower: "Beta Industries",
    loanName: "Revolver",
    loanId: "2",
    covenantType: "Interest Coverage",
    acknowledged: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: "3",
    severity: "warning",
    title: "Leverage Headroom Below 5%",
    message:
      "Total Leverage Ratio at 4.9x with threshold of 5.0x. Only 2% headroom remaining.",
    borrower: "Epsilon Tech",
    loanName: "Growth Facility",
    loanId: "5",
    covenantType: "Leverage",
    acknowledged: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
  },
  {
    id: "4",
    severity: "info",
    title: "Document Uploaded",
    message: "Q3 2025 compliance certificate uploaded and ready for review.",
    borrower: "Gamma Holdings",
    loanName: "Term Loan B",
    loanId: "3",
    acknowledged: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: "5",
    severity: "info",
    title: "AI Extraction Complete",
    message:
      "Financial data extracted from Q3 2025 statements. Review recommended.",
    borrower: "Delta Manufacturing",
    loanName: "Senior Secured",
    loanId: "4",
    acknowledged: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26),
  },
  {
    id: "6",
    severity: "critical",
    title: "Fixed Charge Coverage Breach",
    message:
      "FCCR of 1.15x below minimum threshold of 1.25x. Grace period expires in 5 days.",
    borrower: "Zeta Corp",
    loanName: "ABL Facility",
    loanId: "6",
    covenantType: "Fixed Charge",
    acknowledged: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
  },
];

function getSeverityIcon(severity: Alert["severity"]) {
  switch (severity) {
    case "critical":
      return <AlertTriangle className="h-5 w-5 text-red-600" />;
    case "warning":
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    case "info":
      return <Info className="h-5 w-5 text-blue-600" />;
  }
}

function getSeverityBadge(severity: Alert["severity"]) {
  const variants = {
    critical: "bg-red-100 text-red-800",
    warning: "bg-yellow-100 text-yellow-800",
    info: "bg-blue-100 text-blue-800",
  };

  const labels = {
    critical: "Critical",
    warning: "Warning",
    info: "Info",
  };

  return (
    <Badge variant="secondary" className={variants[severity]}>
      {labels[severity]}
    </Badge>
  );
}

export default function AlertsPage() {
  const unacknowledgedAlerts = mockAlerts.filter((a) => !a.acknowledged);
  const acknowledgedAlerts = mockAlerts.filter((a) => a.acknowledged);
  const criticalAlerts = mockAlerts.filter((a) => a.severity === "critical");
  const warningAlerts = mockAlerts.filter((a) => a.severity === "warning");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
          <p className="text-muted-foreground">
            Monitor covenant breaches, warnings, and important notifications
          </p>
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{mockAlerts.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800">
              Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-2xl font-bold text-red-800">
                {criticalAlerts.length}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span className="text-2xl font-bold text-yellow-800">
                {warningAlerts.length}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unacknowledged
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {unacknowledgedAlerts.length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Tabs */}
      <Tabs defaultValue="unacknowledged" className="space-y-4">
        <TabsList>
          <TabsTrigger value="unacknowledged">
            Unacknowledged ({unacknowledgedAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="all">All ({mockAlerts.length})</TabsTrigger>
          <TabsTrigger value="acknowledged">
            Acknowledged ({acknowledgedAlerts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unacknowledged">
          <AlertTable alerts={unacknowledgedAlerts} />
        </TabsContent>

        <TabsContent value="all">
          <AlertTable alerts={mockAlerts} />
        </TabsContent>

        <TabsContent value="acknowledged">
          <AlertTable alerts={acknowledgedAlerts} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AlertTable({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-medium">No alerts</h3>
          <p className="text-muted-foreground">
            All clear - no alerts to display
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Severity</TableHead>
              <TableHead>Alert</TableHead>
              <TableHead>Loan</TableHead>
              <TableHead>Covenant</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getSeverityIcon(alert.severity)}
                    {getSeverityBadge(alert.severity)}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {alert.message}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{alert.borrower}</p>
                    <p className="text-sm text-muted-foreground">
                      {alert.loanName}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  {alert.covenantType ? (
                    <Badge variant="outline">{alert.covenantType}</Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(alert.createdAt, { addSuffix: true })}
                </TableCell>
                <TableCell>
                  {alert.acknowledged ? (
                    <Badge
                      variant="secondary"
                      className="bg-gray-100 text-gray-800"
                    >
                      Acknowledged
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800"
                    >
                      New
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {!alert.acknowledged && (
                      <Button variant="ghost" size="sm">
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/loans/${alert.loanId}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
