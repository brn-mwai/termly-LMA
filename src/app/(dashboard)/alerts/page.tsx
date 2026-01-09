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
  Warning,
  WarningCircle,
  Info,
  Eye,
  CheckCircle,
  Bell,
} from "@phosphor-icons/react/dist/ssr";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

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

async function getAlerts(): Promise<Alert[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = await createClient();

  // Get user's organization
  const userResult = await supabase
    .from("users")
    .select("organization_id")
    .eq("clerk_id", userId)
    .single();

  const userData = userResult.data as { organization_id: string } | null;
  if (!userData?.organization_id) return [];

  const { data, error } = await supabase
    .from("alerts")
    .select(`
      id,
      severity,
      title,
      message,
      acknowledged,
      created_at,
      loans (
        id,
        name,
        borrowers (
          name
        )
      ),
      covenants (
        name,
        type
      )
    `)
    .eq("organization_id", userData.organization_id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching alerts:", error);
    return [];
  }

  return ((data || []) as any[]).map((alert: any) => ({
    id: alert.id,
    severity: alert.severity as "critical" | "warning" | "info",
    title: alert.title,
    message: alert.message,
    borrower: alert.loans?.borrowers?.name || "Unknown",
    loanName: alert.loans?.name || "Unknown",
    loanId: alert.loans?.id || "",
    covenantType: alert.covenants?.name || alert.covenants?.type,
    acknowledged: alert.acknowledged,
    createdAt: new Date(alert.created_at),
  }));
}

function getSeverityIcon(severity: Alert["severity"]) {
  switch (severity) {
    case "critical":
      return <Warning className="h-5 w-5 text-red-600" />;
    case "warning":
      return <WarningCircle className="h-5 w-5 text-yellow-600" />;
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

export default async function AlertsPage() {
  const alerts = await getAlerts();
  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);
  const acknowledgedAlerts = alerts.filter((a) => a.acknowledged);
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const warningAlerts = alerts.filter((a) => a.severity === "warning");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Alerts</h1>
          <p className="text-muted-foreground">
            Monitor covenant breaches, warnings, and important notifications
          </p>
        </div>
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
              <span className="text-2xl font-bold">{alerts.length}</span>
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
              <Warning className="h-5 w-5 text-red-600" />
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
              <WarningCircle className="h-5 w-5 text-yellow-600" />
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
          <TabsTrigger value="all">All ({alerts.length})</TabsTrigger>
          <TabsTrigger value="acknowledged">
            Acknowledged ({acknowledgedAlerts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unacknowledged">
          <AlertTable alerts={unacknowledgedAlerts} />
        </TabsContent>

        <TabsContent value="all">
          <AlertTable alerts={alerts} />
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
