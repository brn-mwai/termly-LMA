'use client';

import { useState } from 'react';
import { ArrowsClockwise } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

interface RefreshButtonProps {
  onRefresh?: () => void;
}

export function RefreshButton({ onRefresh }: RefreshButtonProps) {
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);

    try {
      // In production, this would refresh the Tableau data source
      // For now, just reload the page
      if (onRefresh) {
        onRefresh();
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        window.location.reload();
      }
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
      <ArrowsClockwise className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
      {refreshing ? 'Refreshing...' : 'Refresh Data'}
    </Button>
  );
}
