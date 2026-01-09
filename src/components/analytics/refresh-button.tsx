'use client';

import { useState } from 'react';
import { ArrowsClockwise } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

interface RefreshButtonProps {
  onRefresh?: () => Promise<void> | void;
}

export function RefreshButton({ onRefresh }: RefreshButtonProps) {
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);

    try {
      if (onRefresh) {
        // Call the provided refresh handler
        await onRefresh();
      } else {
        // Fallback: just reload the page
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to refresh:', err);
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
