import { auth } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  User,
  FileText,
  Buildings,
  Warning,
  Scroll,
  Eye,
  ClockCounterClockwise,
} from '@phosphor-icons/react/dist/ssr';
import { formatDateTime } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  update: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  delete: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  upload: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  extract: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  acknowledge: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

const entityIcons: Record<string, React.ElementType> = {
  loan: Buildings,
  document: FileText,
  alert: Warning,
  memo: Scroll,
  covenant: Eye,
};

export default async function AuditPage() {
  const { userId } = await auth();

  let auditLogs: any[] = [];

  if (userId) {
    const supabase = await createServiceClient();

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('clerk_id', userId)
      .single();

    const orgId = (userData as { organization_id: string } | null)?.organization_id;

    if (orgId) {
      const { data } = await supabase
        .from('audit_logs')
        .select(`
          *,
          users:user_id (full_name, email)
        `)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) {
        auditLogs = data;
      }
    }
  }

  return (
    <div className="space-y-4 min-w-0 overflow-hidden">
      {/* Header */}
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-normal tracking-tight">
          Audit Trail
        </h1>
        <p className="text-sm text-muted-foreground">
          Complete history of all actions in your portfolio
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditLogs.filter((l: any) => {
                const today = new Date().toDateString();
                return new Date(l.created_at).toDateString() === today;
              }).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditLogs.filter((l: any) => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return new Date(l.created_at) > weekAgo;
              }).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(auditLogs.map((l: any) => l.user_id)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log Table */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:px-6 sm:pb-6">
          {auditLogs.length === 0 ? (
            <div className="text-center py-12">
              <ClockCounterClockwise className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No activity yet</h3>
              <p className="text-muted-foreground">
                Actions will be logged here as you use the platform
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Timestamp</TableHead>
                    <TableHead className="hidden sm:table-cell">User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead className="hidden lg:table-cell">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log: any) => {
                    const EntityIcon = entityIcons[log.entity_type] || FileText;
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                          {formatDateTime(log.created_at)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate max-w-[100px]">{log.users?.full_name || 'System'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={actionColors[log.action] || 'bg-gray-100 text-gray-800'}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <EntityIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="capitalize">{log.entity_type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate hidden lg:table-cell">
                          {log.changes ? JSON.stringify(log.changes).slice(0, 50) + '...' : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
