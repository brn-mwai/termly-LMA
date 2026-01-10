"use client"

import {
  House,
  Bank,
  Files,
  Bell,
  ChartBar,
  Scroll,
  ClockCounterClockwise,
  Gear,
} from "@phosphor-icons/react"

import { NavMain } from '@/components/layout/nav-main'
import { NavUser } from '@/components/layout/nav-user'
import { TeamSwitcher } from '@/components/layout/team-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: House,
    tourId: "nav-dashboard",
  },
  {
    title: "Loans",
    url: "/loans",
    icon: Bank,
    tourId: "nav-loans",
  },
  {
    title: "Documents",
    url: "/documents",
    icon: Files,
    tourId: "nav-documents",
  },
  {
    title: "Alerts",
    url: "/alerts",
    icon: Bell,
    tourId: "nav-alerts",
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: ChartBar,
    tourId: "nav-analytics",
  },
  {
    title: "Memos",
    url: "/memos",
    icon: Scroll,
    tourId: "nav-memos",
  },
]

const systemNavItems = [
  {
    title: "Audit Trail",
    url: "/audit",
    icon: ClockCounterClockwise,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Gear,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" data-tour="sidebar" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent className="overflow-hidden">
        <NavMain items={mainNavItems} label="Platform" />
        <NavMain items={systemNavItems} label="System" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
