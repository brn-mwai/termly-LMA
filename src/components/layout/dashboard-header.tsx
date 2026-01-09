"use client";

import { House, MagnifyingGlass } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Route to title mapping for known routes
const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/loans": "Loans",
  "/loans/new": "New Loan",
  "/documents": "Documents",
  "/documents/upload": "Upload",
  "/alerts": "Alerts",
  "/analytics": "Analytics",
  "/memos": "Memos",
  "/memos/new": "New Memo",
  "/audit": "Audit Trail",
  "/settings": "Settings",
};

// Check if a segment looks like a UUID or ID
function isIdSegment(segment: string): boolean {
  // UUID pattern or numeric ID
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) ||
         /^\d+$/.test(segment);
}

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: { title: string; href: string; isLast: boolean }[] = [];

  let currentPath = "";

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;

    // Check for known route first
    let title = routeTitles[currentPath];

    if (!title) {
      // Handle dynamic ID segments
      if (isIdSegment(segment)) {
        title = "Details";
      } else {
        // Capitalize and format the segment
        title = segment
          .split("-")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }
    }

    breadcrumbs.push({
      title,
      href: currentPath,
      isLast,
    });
  });

  return breadcrumbs;
}

export function DashboardHeader() {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {/* Home link */}
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard" className="flex items-center gap-1">
                <House className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {/* Only show breadcrumbs if not on dashboard */}
            {pathname !== "/dashboard" && breadcrumbs.map((crumb, index) => (
              <BreadcrumbItem key={crumb.href}>
                <BreadcrumbSeparator />
                {crumb.isLast ? (
                  <BreadcrumbPage className="max-w-[150px] truncate">
                    {crumb.title}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    href={crumb.href}
                    className="max-w-[120px] truncate"
                  >
                    {crumb.title}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Search */}
      <div className="relative hidden md:block">
        <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search loans, borrowers..."
          className="w-64 pl-9 h-9 bg-muted/50"
        />
      </div>
    </header>
  );
}
