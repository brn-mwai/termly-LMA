'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartLine,
  Warning,
  CheckCircle,
  XCircle,
  Scales,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface Covenant {
  id: string;
  covenantName: string;
  type: string;
  borrower: string;
  loanName: string;
  loanId: string;
  operator: string;
  threshold: number;
  frequency: string;
  currentValue: number | null;
  status: string;
  headroom: number | null;
  lastTested: string | null;
}

interface ComparisonData {
  covenants: Covenant[];
  byType: Record<string, Covenant[]>;
  loans: Array<{ id: string; name: string; borrower: string }>;
  summary: {
    totalCovenants: number;
    compliant: number;
    warning: number;
    breach: number;
    lowestHeadroom: number | null;
    avgHeadroom: number | null;
  };
}

const covenantTypes = [
  { value: 'all', label: 'All Types' },
  { value: 'leverage', label: 'Leverage Ratio' },
  { value: 'interest_coverage', label: 'Interest Coverage' },
  { value: 'fixed_charge_coverage', label: 'Fixed Charge Coverage' },
  { value: 'current_ratio', label: 'Current Ratio' },
  { value: 'debt_service_coverage', label: 'Debt Service Coverage' },
  { value: 'min_net_worth', label: 'Minimum Net Worth' },
];

export default function ComparePage() {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (typeFilter !== 'all') params.set('type', typeFilter);

        const res = await fetch(`/api/covenants/compare?${params}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (error) {
        console.error('Failed to fetch comparison data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [typeFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-4 w-4 text-green-500" weight="fill" />;
      case 'warning':
        return <Warning className="h-4 w-4 text-yellow-500" weight="fill" />;
      case 'breach':
        return <XCircle className="h-4 w-4 text-red-500" weight="fill" />;
      default:
        return <ChartLine className="h-4 w-4 text-gray-400" />;
    }
  };

  const getHeadroomColor = (headroom: number | null) => {
    if (headroom === null) return 'text-muted-foreground';
    if (headroom < 0) return 'text-red-600 font-semibold';
    if (headroom < 15) return 'text-yellow-600 font-medium';
    return 'text-green-600';
  };

  const formatHeadroom = (value: number | null) => {
    if (value === null) return 'N/A';
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-normal tracking-tight flex items-center gap-2">
            <Scales className="h-8 w-8" weight="duotone" />
            Covenant Comparison
          </h1>
          <p className="text-muted-foreground">
            Compare covenant thresholds and performance across loans
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              {covenantTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Covenants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.totalCovenants}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Compliance Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-green-600">
                  {data.summary.totalCovenants > 0
                    ? ((data.summary.compliant / data.summary.totalCovenants) * 100).toFixed(0)
                    : 0}%
                </span>
                <span className="text-sm text-muted-foreground">
                  ({data.summary.compliant} compliant)
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                At Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Warning className="h-4 w-4 text-yellow-500" />
                  <span className="font-semibold">{data.summary.warning}</span>
                </div>
                <div className="flex items-center gap-1">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="font-semibold">{data.summary.breach}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Lowest Headroom
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn('text-2xl font-bold', getHeadroomColor(data.summary.lowestHeadroom))}>
                {formatHeadroom(data.summary.lowestHeadroom)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Covenant Details</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.covenants && data.covenants.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Borrower / Loan</TableHead>
                  <TableHead>Covenant</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Threshold</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">Headroom</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.covenants.map((cov) => (
                  <TableRow key={cov.id}>
                    <TableCell>
                      <div className="font-medium">{cov.borrower}</div>
                      <div className="text-sm text-muted-foreground">{cov.loanName}</div>
                    </TableCell>
                    <TableCell className="font-medium">{cov.covenantName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {cov.type.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {cov.operator === 'max' ? '\u2264' : '\u2265'} {cov.threshold.toFixed(2)}x
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {cov.currentValue !== null ? `${cov.currentValue.toFixed(2)}x` : 'N/A'}
                    </TableCell>
                    <TableCell className={cn('text-right font-mono', getHeadroomColor(cov.headroom))}>
                      {formatHeadroom(cov.headroom)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(cov.status)}
                        <span className="capitalize">{cov.status}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              No covenants found. Add covenants to your loans to compare them.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
