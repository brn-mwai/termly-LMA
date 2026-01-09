'use client';

import { useEffect, useRef, useState } from 'react';
import { SpinnerGap, WarningCircle, ArrowsClockwise, ArrowSquareOut } from '@phosphor-icons/react';
import { DashboardKey } from '@/lib/tableau/config';
import { Button } from '@/components/ui/button';

interface TableauEmbedProps {
  dashboard: DashboardKey;
  parameters?: Record<string, string>;
  height?: number;
}

export function TableauEmbed({ dashboard, parameters, height = 700 }: TableauEmbedProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<{ token: string; viewUrl: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    async function loadTableau() {
      try {
        setLoading(true);
        setError(null);

        // Get embed token from API
        const res = await fetch('/api/tableau/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dashboard, parameters }),
        });

        if (!res.ok) {
          const err = await res.json();
          if (err.error?.code === 'NOT_CONFIGURED') {
            throw new Error('Tableau is not configured. Please configure Tableau credentials in environment variables.');
          }
          throw new Error(err.error?.message || 'Failed to get embed token');
        }

        const { data } = await res.json();

        if (!mounted) return;

        setTokenData({ token: data.token, viewUrl: data.viewUrl });

        // Load Tableau Embedding API script if not already loaded
        if (!document.querySelector('script[src*="tableau.embedding"]')) {
          const script = document.createElement('script');
          script.src = 'https://embedding.tableauusercontent.com/tableau.embedding.3.latest.min.js';
          script.type = 'module';
          document.head.appendChild(script);

          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load Tableau script'));
          });
        }

        if (!mounted || !containerRef.current) return;

        // Clear previous viz
        containerRef.current.innerHTML = '';

        // Create tableau-viz element
        const viz = document.createElement('tableau-viz');
        viz.setAttribute('src', data.viewUrl);
        viz.setAttribute('token', data.token);
        viz.setAttribute('toolbar', 'hidden');
        viz.setAttribute('hide-tabs', 'true');
        viz.style.width = '100%';
        viz.style.height = `${height}px`;

        // Listen for load complete
        viz.addEventListener('firstinteractive', () => {
          if (mounted) setLoading(false);
        });

        viz.addEventListener('vizloaderror', (e: any) => {
          if (mounted) {
            setError(e.detail?.message || 'Failed to load visualization');
            setLoading(false);
          }
        });

        containerRef.current.appendChild(viz);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard');
          setLoading(false);
        }
      }
    }

    loadTableau();

    return () => {
      mounted = false;
    };
  }, [dashboard, parameters, height]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-center" style={{ minHeight: height }}>
        <WarningCircle className="h-16 w-16 text-muted-foreground" weight="light" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Failed to load dashboard</h3>
          <p className="text-sm text-muted-foreground max-w-md">{error}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <ArrowsClockwise className="h-4 w-4 mr-2" />
            Retry
          </Button>
          {tokenData?.viewUrl && (
            <Button variant="outline" asChild>
              <a href={tokenData.viewUrl} target="_blank" rel="noopener noreferrer">
                <ArrowSquareOut className="h-4 w-4 mr-2" />
                Open in Tableau
              </a>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ minHeight: height }}>
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50 z-10">
          <SpinnerGap className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading Tableau dashboard...</p>
        </div>
      )}
      <div
        ref={containerRef}
        className={loading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}
      />
    </div>
  );
}
