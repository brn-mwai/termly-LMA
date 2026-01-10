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
import { Plus, CircleNotch } from "@phosphor-icons/react";
import { toast } from "sonner";

interface AddCovenantDialogProps {
  loanId: string;
  trigger?: React.ReactNode;
}

const COVENANT_TYPES = [
  { value: "leverage", label: "Leverage Ratio", defaultOperator: "max", defaultThreshold: "4.0" },
  { value: "interest_coverage", label: "Interest Coverage", defaultOperator: "min", defaultThreshold: "2.0" },
  { value: "fixed_charge_coverage", label: "Fixed Charge Coverage", defaultOperator: "min", defaultThreshold: "1.25" },
  { value: "current_ratio", label: "Current Ratio", defaultOperator: "min", defaultThreshold: "1.0" },
  { value: "min_net_worth", label: "Minimum Net Worth", defaultOperator: "min", defaultThreshold: "1000000" },
  { value: "custom", label: "Custom", defaultOperator: "max", defaultThreshold: "1.0" },
];

export function AddCovenantDialog({ loanId, trigger }: AddCovenantDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "",
    threshold: "",
    operator: "max",
    testing_frequency: "quarterly",
  });

  const handleTypeChange = (type: string) => {
    const typeConfig = COVENANT_TYPES.find((t) => t.value === type);
    setFormData({
      ...formData,
      type,
      name: typeConfig?.label || "",
      operator: typeConfig?.defaultOperator || "max",
      threshold: typeConfig?.defaultThreshold || "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.type || !formData.threshold) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/covenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loan_id: loanId,
          name: formData.name,
          type: formData.type,
          threshold: parseFloat(formData.threshold),
          operator: formData.operator,
          testing_frequency: formData.testing_frequency,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to create covenant");
      }

      toast.success("Covenant added successfully");
      setOpen(false);
      setFormData({
        name: "",
        type: "",
        threshold: "",
        operator: "max",
        testing_frequency: "quarterly",
      });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create covenant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Covenant
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Covenant</DialogTitle>
          <DialogDescription>
            Define a new financial covenant to monitor for this loan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Covenant Type</Label>
              <Select
                value={formData.type}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  {COVENANT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Covenant Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Maximum Leverage Ratio"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="operator">Operator</Label>
                <Select
                  value={formData.operator}
                  onValueChange={(v) => setFormData({ ...formData, operator: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="max">Maximum (≤)</SelectItem>
                    <SelectItem value="min">Minimum (≥)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="threshold">Threshold</Label>
                <Input
                  id="threshold"
                  type="number"
                  step="0.01"
                  value={formData.threshold}
                  onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
                  placeholder="e.g., 4.5"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="frequency">Testing Frequency</Label>
              <Select
                value={formData.testing_frequency}
                onValueChange={(v) => setFormData({ ...formData, testing_frequency: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="semi-annual">Semi-Annual</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <CircleNotch className="h-4 w-4 animate-spin mr-2" />}
              Add Covenant
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
