"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Building2,
  AlertTriangle,
  BarChart3,
  Settings,
  Upload,
  ScrollText,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const mainNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Loans",
    href: "/loans",
    icon: Building2,
  },
  {
    title: "Documents",
    href: "/documents",
    icon: FileText,
  },
  {
    title: "Alerts",
    href: "/alerts",
    icon: AlertTriangle,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
];

const secondaryNavItems = [
  {
    title: "Upload",
    href: "/documents/upload",
    icon: Upload,
  },
  {
    title: "Memos",
    href: "/memos",
    icon: ScrollText,
  },
  {
    title: "Audit Trail",
    href: "/audit",
    icon: History,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center">
          <Image
            src="/logo/termly-logo.svg"
            alt="Termly"
            width={140}
            height={36}
            priority
          />
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <Button
              key={item.href}
              variant={pathname === item.href ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3",
                pathname === item.href && "bg-secondary"
              )}
              asChild
            >
              <Link href={item.href}>
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            </Button>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1">
          {secondaryNavItems.map((item) => (
            <Button
              key={item.href}
              variant={pathname === item.href ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3",
                pathname === item.href && "bg-secondary"
              )}
              asChild
            >
              <Link href={item.href}>
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            </Button>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground text-center">
          AI-Powered Covenant Monitoring
        </p>
      </div>
    </div>
  );
}
