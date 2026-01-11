import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Warning,
  WarningCircle,
  Info,
  Bell,
} from "@phosphor-icons/react/dist/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { auth } from "@clerk/nextjs/server";
import { AlertsTable } from "@/components/alerts";

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

  const supabase = createAdminClient();

  // Get user's organization
  const userResult = await supabase
    .from("users")
    .select("organization_id")
    .eq("clerk_id", userId)
    .is("deleted_at", null)
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

export default async function AlertsPage() {
  const alerts = await getAlerts();
  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);
  const acknowledgedAlerts = alerts.filter((a) => a.acknowledged);
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const warningAlerts = alerts.filter((a) => a.severity === "warning");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-normal tracking-tight">Alerts</h1>
          <p className="text-sm text-muted-foreground">
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
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800 dark:text-red-400">
              Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Warning className="h-5 w-5 text-red-600 dark:text-red-500" />
              <span className="text-2xl font-bold text-red-800 dark:text-red-400">
                {criticalAlerts.length}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <WarningCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-800 dark:text-yellow-400">
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
          <AlertsTable alerts={unacknowledgedAlerts} />
        </TabsContent>

        <TabsContent value="all">
          <AlertsTable alerts={alerts} />
        </TabsContent>

        <TabsContent value="acknowledged">
          <AlertsTable alerts={acknowledgedAlerts} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
