'use client';

import { DASHBOARDS, DashboardKey } from '@/lib/tableau/config';
import { cn } from '@/lib/utils/cn';
import { ChartBar, ShieldCheck, File, SquaresFour } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';

const icons: Record<DashboardKey, Icon> = {
  portfolioOverview: ChartBar,
  covenantMonitor: ShieldCheck,
  loanDetail: File,
  riskHeatmap: SquaresFour,
};

interface DashboardSelectorProps {
  active: DashboardKey;
  onChange: (dashboard: DashboardKey) => void;
}

export function DashboardSelector({ active, onChange }: DashboardSelectorProps) {
  return (
    <div className="flex gap-1 p-1 bg-muted rounded-lg">
      {Object.entries(DASHBOARDS).map(([key, dashboard]) => {
        const Icon = icons[key as DashboardKey];
        const isActive = active === key;

        return (
          <button
            key={key}
            onClick={() => onChange(key as DashboardKey)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            )}
          >
            <Icon className="h-4 w-4" weight={isActive ? 'fill' : 'regular'} />
            {dashboard.name}
          </button>
        );
      })}
    </div>
  );
}
