'use client';

import { useEffect, useState } from 'react';
import { Check, X, Database, ArrowRight, FileText, Bell, CurrencyCircleDollar, Users, ChartLine, Folder, CircleNotch } from '@phosphor-icons/react';
import { cn } from '@/lib/utils/cn';

export interface ActionStep {
  tool: string;
  input: Record<string, unknown>;
  success: boolean;
  timestamp: number;
}

interface ActionStepsProps {
  actions: ActionStep[];
  isStreaming?: boolean;
}

// Map tool names to user-friendly labels and icons
const TOOL_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string; weight?: 'fill' | 'regular' }>; category: string }> = {
  // Read operations
  get_portfolio_summary: { label: 'Get portfolio summary', icon: ChartLine, category: 'read' },
  get_loans: { label: 'Get loans', icon: Database, category: 'read' },
  get_loan_details: { label: 'Get loan details', icon: Database, category: 'read' },
  get_alerts: { label: 'Get alerts', icon: Bell, category: 'read' },
  get_covenants_in_breach: { label: 'Get breached covenants', icon: Bell, category: 'read' },
  get_covenants_at_warning: { label: 'Get warning covenants', icon: Bell, category: 'read' },
  get_borrowers: { label: 'Get borrowers', icon: Users, category: 'read' },
  get_financial_periods: { label: 'Get financials', icon: CurrencyCircleDollar, category: 'read' },
  get_risk_scores: { label: 'Get risk scores', icon: ChartLine, category: 'read' },
  get_covenant_history: { label: 'Get covenant history', icon: ChartLine, category: 'read' },
  get_extracted_data: { label: 'Get extracted data', icon: FileText, category: 'read' },
  get_audit_log: { label: 'Get audit log', icon: Database, category: 'read' },
  // Write operations
  create_loan: { label: 'Create loan', icon: Database, category: 'write' },
  update_loan: { label: 'Update loan', icon: Database, category: 'write' },
  create_borrower: { label: 'Create borrower', icon: Users, category: 'write' },
  update_borrower: { label: 'Update borrower', icon: Users, category: 'write' },
  create_covenant: { label: 'Create covenant', icon: ChartLine, category: 'write' },
  update_covenant: { label: 'Update covenant', icon: ChartLine, category: 'write' },
  record_covenant_test: { label: 'Record test result', icon: ChartLine, category: 'write' },
  create_covenant_waiver: { label: 'Create waiver', icon: ChartLine, category: 'write' },
  acknowledge_alert: { label: 'Acknowledge alert', icon: Bell, category: 'write' },
  dismiss_alert: { label: 'Dismiss alert', icon: Bell, category: 'write' },
  escalate_alert: { label: 'Escalate alert', icon: Bell, category: 'write' },
  bulk_acknowledge_alerts: { label: 'Bulk acknowledge', icon: Bell, category: 'write' },
  create_financial_period: { label: 'Create financial period', icon: CurrencyCircleDollar, category: 'write' },
  categorize_document: { label: 'Categorize document', icon: Folder, category: 'write' },
  archive_document: { label: 'Archive document', icon: Folder, category: 'write' },
};

function getToolLabel(toolName: string): string {
  return TOOL_CONFIG[toolName]?.label || toolName.replace(/_/g, ' ');
}

function getToolIcon(toolName: string): React.ComponentType<{ className?: string; weight?: 'fill' | 'regular' }> {
  return TOOL_CONFIG[toolName]?.icon || Database;
}

function getToolCategory(toolName: string): string {
  return TOOL_CONFIG[toolName]?.category || 'read';
}

function formatInputSummary(input: Record<string, unknown>): string {
  const entries = Object.entries(input);
  if (entries.length === 0) return '';

  // Show first meaningful field
  const meaningfulFields = ['name', 'loan_id', 'borrower_id', 'covenant_id', 'alert_id', 'status', 'severity'];
  for (const field of meaningfulFields) {
    if (input[field]) {
      return String(input[field]).substring(0, 30);
    }
  }

  // Fallback to first field
  const [key, value] = entries[0];
  if (typeof value === 'string') {
    return value.substring(0, 30);
  }
  return '';
}

export function ActionSteps({ actions, isStreaming = false }: ActionStepsProps) {
  const [visibleCount, setVisibleCount] = useState(0);

  // Animate actions appearing one by one
  useEffect(() => {
    if (actions.length > visibleCount) {
      const timer = setTimeout(() => {
        setVisibleCount(actions.length);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [actions.length, visibleCount]);

  if (!actions || actions.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 mt-2 mb-3">
      <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
        <ArrowRight className="h-3 w-3 text-emerald-500" />
        <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-400 dark:to-emerald-300 bg-clip-text text-transparent">
          Actions
        </span>
        {isStreaming && (
          <CircleNotch className="h-3 w-3 animate-spin text-emerald-500" />
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {actions.map((action, index) => {
          const Icon = getToolIcon(action.tool);
          const category = getToolCategory(action.tool);
          const inputSummary = formatInputSummary(action.input);
          const isNew = index >= visibleCount - 1 && visibleCount === actions.length;

          return (
            <div
              key={`${action.tool}-${action.timestamp}-${index}`}
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs",
                "border transition-all duration-300 ease-out",
                isNew && "animate-in fade-in-0 slide-in-from-left-2",
                action.success
                  ? category === 'write'
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-700 dark:text-emerald-300 shadow-sm shadow-emerald-100 dark:shadow-emerald-900/20"
                    : "bg-emerald-50/50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400"
                  : "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/50 dark:border-red-800 dark:text-red-300"
              )}
              title={`${getToolLabel(action.tool)}${inputSummary ? `: ${inputSummary}` : ''}`}
            >
              <Icon className="h-3 w-3 flex-shrink-0" weight="fill" />
              <span className="truncate max-w-[120px]">
                {getToolLabel(action.tool)}
              </span>
              {action.success ? (
                <Check className="h-3 w-3 flex-shrink-0 text-emerald-600 dark:text-emerald-400" weight="bold" />
              ) : (
                <X className="h-3 w-3 flex-shrink-0 text-red-600 dark:text-red-400" weight="bold" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
