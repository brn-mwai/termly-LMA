"use client";

import { Bell, MagnifyingGlass } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
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

// Route to title mapping
const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/loans": "Loans",
  "/documents": "Documents",
  "/alerts": "Alerts",
  "/analytics": "Analytics",
  "/memos": "Memos",
  "/audit": "Audit Trail",
  "/settings": "Settings",
  "/documents/upload": "Upload Documents",
  "/chat": "AI Assistant",
};

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: { title: string; href: string; isLast: boolean }[] = [];

  let currentPath = "";
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const title = routeTitles[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
    breadcrumbs.push({
      title,
      href: currentPath,
      isLast: index === segments.length - 1,
    });
  });

  return breadcrumbs;
}

export function DashboardHeader() {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <BreadcrumbItem key={crumb.href} className={index === 0 ? "hidden md:block" : ""}>
                {crumb.isLast ? (
                  <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                ) : (
                  <>
                    <BreadcrumbLink href={crumb.href}>{crumb.title}</BreadcrumbLink>
                    <BreadcrumbSeparator className="hidden md:block" />
                  </>
                )}
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search loans, borrowers..."
            className="w-64 pl-9 h-9 bg-muted/50"
          />
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-5 w-5" weight="regular" />
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="text-xs">
                  Breach
                </Badge>
                <span className="font-medium">Acme Corp</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Leverage ratio exceeded 5.0x threshold
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <div className="flex items-center gap-2">
                <Badge className="text-xs bg-warning-100 text-warning-600 hover:bg-warning-100">
                  Warning
                </Badge>
                <span className="font-medium">Beta Industries</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Interest coverage headroom below 15%
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Document
                </Badge>
                <span className="font-medium">Gamma Holdings</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Q3 compliance certificate uploaded
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center text-sm text-primary justify-center">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User */}
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      </div>
    </header>
  );
}
