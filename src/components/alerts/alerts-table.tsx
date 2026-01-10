'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Warning,
  WarningCircle,
  Info,
  Eye,
  CheckCircle,
  Checks,
  CircleNotch,
} from '@phosphor-icons/react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { staggerContainer, staggerItem } from '@/lib/animations';

interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  borrower: string;
  loanName: string;
  loanId: string;
  covenantType?: string;
  acknowledged: boolean;
  createdAt: Date;
}

interface AlertsTableProps {
  alerts: Alert[];
}

function getSeverityIcon(severity: Alert['severity']) {
  switch (severity) {
    case 'critical':
      return <Warning className="h-5 w-5 text-red-600" />;
    case 'warning':
      return <WarningCircle className="h-5 w-5 text-yellow-600" />;
    case 'info':
      return <Info className="h-5 w-5 text-blue-600" />;
  }
}

function getSeverityBadge(severity: Alert['severity']) {
  const variants = {
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  };

  const labels = {
    critical: 'Critical',
    warning: 'Warning',
    info: 'Info',
  };

  return (
    <Badge variant="secondary" className={variants[severity]}>
      {labels[severity]}
    </Badge>
  );
}

export function AlertsTable({ alerts: initialAlerts }: AlertsTableProps) {
  const router = useRouter();
  const [alerts, setAlerts] = useState(initialAlerts);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);
  const hasSelection = selectedIds.size > 0;
  const allSelected = unacknowledgedAlerts.length > 0 &&
    unacknowledgedAlerts.every((a) => selectedIds.has(a.id));

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unacknowledgedAlerts.map((a) => a.id)));
    }
  };

  const acknowledgeAlert = async (id: string) => {
    setLoading(id);
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acknowledged: true }),
      });

      if (!res.ok) throw new Error('Failed to acknowledge alert');

      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
      );
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });

      toast.success('Alert acknowledged');
      router.refresh();
    } catch (error) {
      toast.error('Failed to acknowledge alert');
    } finally {
      setLoading(null);
    }
  };

  const bulkAcknowledge = async () => {
    if (selectedIds.size === 0) return;

    setBulkLoading(true);
    try {
      const res = await fetch('/api/alerts/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          acknowledged: true,
        }),
      });

      if (!res.ok) throw new Error('Failed to acknowledge alerts');

      setAlerts((prev) =>
        prev.map((a) => (selectedIds.has(a.id) ? { ...a, acknowledged: true } : a))
      );

      toast.success(`${selectedIds.size} alert${selectedIds.size > 1 ? 's' : ''} acknowledged`);
      setSelectedIds(new Set());
      router.refresh();
    } catch (error) {
      toast.error('Failed to acknowledge alerts');
    } finally {
      setBulkLoading(false);
    }
  };

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
      {/* Bulk action bar */}
      <AnimatePresence>
        {hasSelection && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b bg-muted/50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} alert{selectedIds.size > 1 ? 's' : ''} selected
              </span>
              <Button
                size="sm"
                onClick={bulkAcknowledge}
                disabled={bulkLoading}
              >
                {bulkLoading ? (
                  <CircleNotch className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Checks className="h-4 w-4 mr-2" />
                )}
                Acknowledge Selected
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
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
            <AnimatePresence mode="popLayout">
              {alerts.map((alert, index) => (
                <motion.tr
                  key={alert.id}
                  variants={staggerItem}
                  initial="initial"
                  animate="animate"
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.02 }}
                  className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors last:border-0"
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(alert.id)}
                      onCheckedChange={() => toggleSelect(alert.id)}
                      disabled={alert.acknowledged}
                      aria-label={`Select ${alert.title}`}
                    />
                  </TableCell>
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
                    {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    {alert.acknowledged ? (
                      <Badge
                        variant="secondary"
                        className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                      >
                        Acknowledged
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                      >
                        New
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!alert.acknowledged && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => acknowledgeAlert(alert.id)}
                          disabled={loading === alert.id}
                        >
                          {loading === alert.id ? (
                            <CircleNotch className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/loans/${alert.loanId}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
