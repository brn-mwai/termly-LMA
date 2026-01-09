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
    <div className="flex gap-2 border-b border-border">
      {Object.entries(DASHBOARDS).map(([key, dashboard]) => {
        const Icon = icons[key as DashboardKey];
        const isActive = active === key;

        return (
          <button
            key={key}
            onClick={() => onChange(key as DashboardKey)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <Icon className="h-4 w-4" weight="regular" />
            {dashboard.name}
          </button>
        );
      })}
    </div>
  );
}
