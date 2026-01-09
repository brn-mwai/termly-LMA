'use client';

import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { SpinnerGap, WarningCircle, ArrowsClockwise, ArrowSquareOut } from '@phosphor-icons/react';
import { DashboardKey } from '@/lib/tableau/config';
import { Button } from '@/components/ui/button';

interface TableauEmbedProps {
  dashboard: DashboardKey;
  parameters?: Record<string, string>;
  height?: number;
}

export interface TableauEmbedRef {
  refresh: () => Promise<void>;
}

// Token refresh interval: 8 minutes (tokens last 10 minutes)
const TOKEN_REFRESH_INTERVAL = 8 * 60 * 1000;

export const TableauEmbed = forwardRef<TableauEmbedRef, TableauEmbedProps>(
  function TableauEmbed({ dashboard, parameters, height = 700 }, ref) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<{ token: string; viewUrl: string; expiresAt: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const vizRef = useRef<HTMLElement | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch a new token from the API
  const fetchToken = useCallback(async () => {
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
    return data;
  }, [dashboard, parameters]);

  // Refresh the token and update the viz
  const refreshToken = useCallback(async () => {
    try {
      const data = await fetchToken();
      setTokenData({ token: data.token, viewUrl: data.viewUrl, expiresAt: data.expiresAt });

      // Update the existing viz element with new token
      if (vizRef.current) {
        vizRef.current.setAttribute('token', data.token);
      }
    } catch (err) {
      console.error('Failed to refresh Tableau token:', err);
    }
  }, [fetchToken]);

  // Expose refresh method to parent components
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchToken();
      setTokenData({ token: data.token, viewUrl: data.viewUrl, expiresAt: data.expiresAt });

      if (vizRef.current && containerRef.current) {
        // Remove and recreate viz for full refresh
        containerRef.current.innerHTML = '';

        const viz = document.createElement('tableau-viz');
        viz.setAttribute('src', data.viewUrl);
        viz.setAttribute('token', data.token);
        viz.setAttribute('toolbar', 'hidden');
        viz.setAttribute('hide-tabs', 'true');
        viz.style.width = '100%';
        viz.style.height = `${height}px`;

        viz.addEventListener('firstinteractive', () => {
          setLoading(false);
        });

        viz.addEventListener('vizloaderror', (e: any) => {
          setError(e.detail?.message || 'Failed to load visualization');
          setLoading(false);
        });

        containerRef.current.appendChild(viz);
        vizRef.current = viz;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh dashboard');
      setLoading(false);
    }
  }, [fetchToken, height]);

  useImperativeHandle(ref, () => ({ refresh }), [refresh]);

  useEffect(() => {
    let mounted = true;

    async function loadTableau() {
      try {
        setLoading(true);
        setError(null);

        // Get embed token from API
        const data = await fetchToken();

        if (!mounted) return;

        setTokenData({ token: data.token, viewUrl: data.viewUrl, expiresAt: data.expiresAt });

        // Load Tableau Embedding API script if not already loaded
        const existingScript = document.querySelector('script[src*="tableau.embedding"]');
        if (!existingScript) {
          const script = document.createElement('script');
          script.src = 'https://embedding.tableauusercontent.com/tableau.embedding.3.latest.min.js';
          script.type = 'module';
          script.crossOrigin = 'anonymous';
          document.head.appendChild(script);

          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Tableau script load timed out'));
            }, 15000); // 15 second timeout

            script.onload = () => {
              clearTimeout(timeout);
              // Give the module time to initialize
              setTimeout(resolve, 500);
            };
            script.onerror = () => {
              clearTimeout(timeout);
              reject(new Error('Failed to load Tableau script'));
            };
          });
        } else {
          // Script exists, wait a moment for it to initialize if needed
          await new Promise(resolve => setTimeout(resolve, 100));
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
        vizRef.current = viz;

        // Set up automatic token refresh every 8 minutes
        refreshIntervalRef.current = setInterval(() => {
          if (mounted) refreshToken();
        }, TOKEN_REFRESH_INTERVAL);

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
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [dashboard, parameters, height, fetchToken, refreshToken]);

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
});
