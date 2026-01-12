"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlass,
  File,
  Bank,
  FileText,
  ChartLine,
  Command,
  Spinner,
  type Icon,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  name: string;
  type: "loan" | "borrower" | "document" | "covenant";
  subtitle: string;
  status?: string;
  url: string;
}

interface SearchResults {
  loans: SearchResult[];
  borrowers: SearchResult[];
  documents: SearchResult[];
  covenants: SearchResult[];
}

const typeIcons: Record<keyof SearchResults, Icon> = {
  loans: Bank,
  borrowers: File,
  documents: FileText,
  covenants: ChartLine,
};

const typeLabels: Record<keyof SearchResults, string> = {
  loans: "Loans",
  borrowers: "Borrowers",
  documents: "Documents",
  covenants: "Covenants",
};

export function CommandSearch() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResults | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Keyboard shortcut to open (Cmd+K / Ctrl+K)
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Focus input when dialog opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery("");
      setResults(null);
      setSelectedIndex(0);
    }
  }, [open]);

  // Debounced search
  React.useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        if (data.success) {
          setResults(data.data.results);
          setSelectedIndex(0);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Get flat list of all results for keyboard navigation
  const allResults = React.useMemo(() => {
    if (!results) return [];
    return [
      ...results.loans,
      ...results.borrowers,
      ...results.documents,
      ...results.covenants,
    ];
  }, [results]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, allResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && allResults[selectedIndex]) {
      e.preventDefault();
      handleSelect(allResults[selectedIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    router.push(result.url);
  };

  const renderGroup = (type: keyof SearchResults, items: SearchResult[], startIndex: number) => {
    if (items.length === 0) return null;
    const Icon = typeIcons[type];

    return (
      <div key={type} className="px-2 py-2">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          {typeLabels[type]}
        </div>
        {items.map((item, idx) => {
          const globalIndex = startIndex + idx;
          const isSelected = globalIndex === selectedIndex;

          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setSelectedIndex(globalIndex)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors",
                isSelected
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              )}
            >
              <Icon className="h-4 w-4 text-muted-foreground" weight="duotone" />
              <div className="flex-1 overflow-hidden">
                <div className="truncate font-medium">{item.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {item.subtitle}
                </div>
              </div>
              {item.status && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    item.status === "active" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                    item.status === "completed" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                    item.status === "pending" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                    item.status === "breach" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  )}
                >
                  {item.status}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <MagnifyingGlass className="h-4 w-4" />
        <span className="hidden md:inline">Search...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium md:flex">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>

      {/* Search dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-[550px]">
          <div className="flex items-center border-b px-3">
            <MagnifyingGlass className="h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search loans, borrowers, documents, covenants..."
              className="flex-1 border-0 bg-transparent px-3 py-3 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {loading && <Spinner className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {query.length < 2 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search
              </div>
            )}

            {query.length >= 2 && !loading && allResults.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No results found for &quot;{query}&quot;
              </div>
            )}

            {results && allResults.length > 0 && (
              <div className="py-2">
                {renderGroup("loans", results.loans, 0)}
                {renderGroup("borrowers", results.borrowers, results.loans.length)}
                {renderGroup(
                  "documents",
                  results.documents,
                  results.loans.length + results.borrowers.length
                )}
                {renderGroup(
                  "covenants",
                  results.covenants,
                  results.loans.length + results.borrowers.length + results.documents.length
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <kbd className="rounded border bg-muted px-1.5 py-0.5">↑↓</kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="rounded border bg-muted px-1.5 py-0.5">↵</kbd>
              <span>Open</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="rounded border bg-muted px-1.5 py-0.5">esc</kbd>
              <span>Close</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
