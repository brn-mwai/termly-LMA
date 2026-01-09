import { StatsCards } from "@/components/dashboard/stats-cards";
import { CovenantStatusTable } from "@/components/dashboard/covenant-status-table";
import { AlertsWidget } from "@/components/dashboard/alerts-widget";
import { UpcomingTests } from "@/components/dashboard/upcoming-tests";
import { Button } from "@/components/ui/button";
import { Upload, Plus } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your loan portfolio covenant compliance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/loans/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Loan
            </Link>
          </Button>
          <Button asChild>
            <Link href="/upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Covenant Status Table - Takes 2 columns */}
        <div className="lg:col-span-2">
          <CovenantStatusTable />
        </div>

        {/* Sidebar widgets */}
        <div className="space-y-6">
          <AlertsWidget />
          <UpcomingTests />
        </div>
      </div>
    </div>
  );
}
