"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, CircleNotch, CurrencyDollar } from "@phosphor-icons/react";
import { toast } from "sonner";

interface AddFinancialPeriodDialogProps {
  loanId: string;
  trigger?: React.ReactNode;
}

export function AddFinancialPeriodDialog({ loanId, trigger }: AddFinancialPeriodDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    period_end_date: "",
    period_type: "quarterly",
    revenue: "",
    ebitda_reported: "",
    ebitda_adjusted: "",
    total_debt: "",
    interest_expense: "",
    fixed_charges: "",
    current_assets: "",
    current_liabilities: "",
    net_worth: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.period_end_date || !formData.period_type) {
      toast.error("Please fill in period end date and type");
      return;
    }

    setLoading(true);

    try {
      // Convert empty strings to null, numbers to actual numbers
      const payload: Record<string, unknown> = {
        loan_id: loanId,
        period_end_date: formData.period_end_date,
        period_type: formData.period_type,
      };

      const numericFields = [
        "revenue", "ebitda_reported", "ebitda_adjusted", "total_debt",
        "interest_expense", "fixed_charges", "current_assets",
        "current_liabilities", "net_worth"
      ];

      for (const field of numericFields) {
        const value = formData[field as keyof typeof formData];
        if (value && value !== "") {
          payload[field] = parseFloat(value);
        }
      }

      const response = await fetch("/api/financial-periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to create financial period");
      }

      toast.success("Financial period added successfully");
      setOpen(false);
      setFormData({
        period_end_date: "",
        period_type: "quarterly",
        revenue: "",
        ebitda_reported: "",
        ebitda_adjusted: "",
        total_debt: "",
        interest_expense: "",
        fixed_charges: "",
        current_assets: "",
        current_liabilities: "",
        net_worth: "",
      });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create financial period");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrencyInput = (value: string) => {
    // Remove non-numeric characters except decimal
    return value.replace(/[^0-9.]/g, "");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Period
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Financial Period</DialogTitle>
          <DialogDescription>
            Enter financial data for a specific period. This data will be used for covenant testing.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Period Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="period_end_date">Period End Date</Label>
                <Input
                  id="period_end_date"
                  type="date"
                  value={formData.period_end_date}
                  onChange={(e) => setFormData({ ...formData, period_end_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="period_type">Period Type</Label>
                <Select
                  value={formData.period_type}
                  onValueChange={(v) => setFormData({ ...formData, period_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="semi-annual">Semi-Annual</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="ttm">Trailing 12 Months (TTM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Income Statement */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CurrencyDollar className="h-4 w-4" />
                Income Statement
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="revenue">Revenue</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="revenue"
                      type="text"
                      className="pl-7 font-mono"
                      value={formData.revenue}
                      onChange={(e) => setFormData({ ...formData, revenue: formatCurrencyInput(e.target.value) })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ebitda_reported">EBITDA (Reported)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="ebitda_reported"
                      type="text"
                      className="pl-7 font-mono"
                      value={formData.ebitda_reported}
                      onChange={(e) => setFormData({ ...formData, ebitda_reported: formatCurrencyInput(e.target.value) })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ebitda_adjusted">EBITDA (Adjusted)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="ebitda_adjusted"
                      type="text"
                      className="pl-7 font-mono"
                      value={formData.ebitda_adjusted}
                      onChange={(e) => setFormData({ ...formData, ebitda_adjusted: formatCurrencyInput(e.target.value) })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="interest_expense">Interest Expense</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="interest_expense"
                      type="text"
                      className="pl-7 font-mono"
                      value={formData.interest_expense}
                      onChange={(e) => setFormData({ ...formData, interest_expense: formatCurrencyInput(e.target.value) })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Balance Sheet */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Balance Sheet</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="total_debt">Total Debt</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="total_debt"
                      type="text"
                      className="pl-7 font-mono"
                      value={formData.total_debt}
                      onChange={(e) => setFormData({ ...formData, total_debt: formatCurrencyInput(e.target.value) })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="net_worth">Net Worth</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="net_worth"
                      type="text"
                      className="pl-7 font-mono"
                      value={formData.net_worth}
                      onChange={(e) => setFormData({ ...formData, net_worth: formatCurrencyInput(e.target.value) })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="current_assets">Current Assets</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="current_assets"
                      type="text"
                      className="pl-7 font-mono"
                      value={formData.current_assets}
                      onChange={(e) => setFormData({ ...formData, current_assets: formatCurrencyInput(e.target.value) })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="current_liabilities">Current Liabilities</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="current_liabilities"
                      type="text"
                      className="pl-7 font-mono"
                      value={formData.current_liabilities}
                      onChange={(e) => setFormData({ ...formData, current_liabilities: formatCurrencyInput(e.target.value) })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fixed_charges">Fixed Charges</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="fixed_charges"
                      type="text"
                      className="pl-7 font-mono"
                      value={formData.fixed_charges}
                      onChange={(e) => setFormData({ ...formData, fixed_charges: formatCurrencyInput(e.target.value) })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <CircleNotch className="h-4 w-4 animate-spin mr-2" />}
              Add Financial Period
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
