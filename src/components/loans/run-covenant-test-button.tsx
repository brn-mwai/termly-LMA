"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calculator, CircleNotch, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TestResult {
  covenantId: string;
  covenantName: string;
  calculatedValue: number;
  status: "compliant" | "warning" | "breach";
  headroomAbsolute: number;
  headroomPercentage: number;
}

interface RunCovenantTestButtonProps {
  loanId: string;
}

export function RunCovenantTestButton({ loanId }: RunCovenantTestButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleRunTest = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/loans/${loanId}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to run covenant tests");
      }

      setResults(data.results || []);
      setShowResults(true);
      router.refresh(); // Refresh the page to show updated data
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant":
        return <CheckCircle className="h-5 w-5 text-green-600" weight="fill" />;
      case "warning":
        return <WarningCircle className="h-5 w-5 text-yellow-600" weight="fill" />;
      case "breach":
        return <WarningCircle className="h-5 w-5 text-red-600" weight="fill" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant":
        return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/50";
      case "warning":
        return "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950/50";
      case "breach":
        return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/50";
      default:
        return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/50";
    }
  };

  return (
    <>
      <Button onClick={handleRunTest} disabled={loading}>
        {loading ? (
          <CircleNotch className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Calculator className="h-4 w-4 mr-2" />
        )}
        {loading ? "Running Tests..." : "Run Covenant Test"}
      </Button>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 p-4 shadow-lg max-w-md">
          <div className="flex items-center gap-2">
            <WarningCircle className="h-5 w-5" />
            <p className="font-medium">Test Failed</p>
          </div>
          <p className="text-sm mt-1">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => setError(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Covenant Test Results
            </DialogTitle>
            <DialogDescription>
              {results.length} covenant{results.length !== 1 ? "s" : ""} tested
              against the latest financial data
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {results.map((result) => (
              <div
                key={result.covenantId}
                className={`rounded-lg p-4 ${getStatusColor(result.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <span className="font-medium">{result.covenantName}</span>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                      result.status === "compliant"
                        ? "bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                        : result.status === "warning"
                        ? "bg-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"
                        : "bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                    }`}
                  >
                    {result.status}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Value:</span>{" "}
                    <span className="font-mono font-medium">
                      {result.calculatedValue.toFixed(2)}x
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Headroom:</span>{" "}
                    <span
                      className={`font-mono font-medium ${
                        result.headroomPercentage >= 0
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {result.headroomPercentage >= 0 ? "+" : ""}
                      {result.headroomPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Absolute:</span>{" "}
                    <span className="font-mono font-medium">
                      {result.headroomAbsolute >= 0 ? "+" : ""}
                      {result.headroomAbsolute.toFixed(2)}x
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {results.some((r) => r.status === "breach" || r.status === "warning") && (
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              <strong>Note:</strong> Alerts have been automatically created for
              covenants in breach or warning status.
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowResults(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
