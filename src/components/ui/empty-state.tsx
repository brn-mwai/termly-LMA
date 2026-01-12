"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  FolderOpen,
  FileText,
  Users,
  ChartLine,
  Bell,
  MagnifyingGlass,
  Plus,
  type Icon,
} from "@phosphor-icons/react";

interface EmptyStateProps {
  icon?: Icon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  icon: IconComponent,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: "py-8",
      iconWrapper: "p-3",
      icon: "h-6 w-6",
      title: "text-base",
    },
    md: {
      container: "py-12",
      iconWrapper: "p-4",
      icon: "h-8 w-8",
      title: "text-lg",
    },
    lg: {
      container: "py-16",
      iconWrapper: "p-5",
      icon: "h-10 w-10",
      title: "text-xl",
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-4 text-center",
        sizes.container,
        className
      )}
    >
      {IconComponent && (
        <div className={cn("mb-4 rounded-full bg-muted", sizes.iconWrapper)}>
          <IconComponent
            className={cn("text-muted-foreground", sizes.icon)}
            weight="duotone"
          />
        </div>
      )}
      <h3 className={cn("font-medium", sizes.title)}>{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="outline" size="sm" className="mt-4">
          <Plus className="h-4 w-4 mr-2" />
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Pre-configured empty states for common scenarios
export function NoLoansEmptyState({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={FolderOpen}
      title="No loans yet"
      description="Get started by adding your first loan to the platform."
      action={
        onAction
          ? {
              label: "Add Loan",
              onClick: onAction,
            }
          : undefined
      }
    />
  );
}

export function NoDocumentsEmptyState({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="No documents"
      description="Upload credit agreements or financial statements to get started."
      action={
        onAction
          ? {
              label: "Upload Document",
              onClick: onAction,
            }
          : undefined
      }
    />
  );
}

export function NoCovenantsEmptyState({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={ChartLine}
      title="No covenants"
      description="Add covenants to track compliance and monitor headroom."
      action={
        onAction
          ? {
              label: "Add Covenant",
              onClick: onAction,
            }
          : undefined
      }
    />
  );
}

export function NoAlertsEmptyState() {
  return (
    <EmptyState
      icon={Bell}
      title="No alerts"
      description="You're all caught up! No alerts require your attention."
      size="sm"
    />
  );
}

export function NoSearchResultsEmptyState({ query }: { query: string }) {
  return (
    <EmptyState
      icon={MagnifyingGlass}
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try a different search term.`}
      size="sm"
    />
  );
}

export function NoBorrowersEmptyState({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="No borrowers"
      description="Add borrowers to start tracking your loan portfolio."
      action={
        onAction
          ? {
              label: "Add Borrower",
              onClick: onAction,
            }
          : undefined
      }
    />
  );
}
