"use client"

import {
  House,
  Bank,
  Files,
  Bell,
  ChartBar,
  Upload,
  Scroll,
  ClockCounterClockwise,
  Gear,
  ChatCircleDots,
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
  SidebarSeparator,
} from '@/components/ui/sidebar'

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: House,
  },
  {
    title: "Loans",
    url: "/loans",
    icon: Bank,
  },
  {
    title: "Documents",
    url: "/documents",
    icon: Files,
  },
  {
    title: "Alerts",
    url: "/alerts",
    icon: Bell,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: ChartBar,
  },
]

const toolsNavItems = [
  {
    title: "Upload",
    url: "/documents/upload",
    icon: Upload,
  },
  {
    title: "Memos",
    url: "/memos",
    icon: Scroll,
  },
  {
    title: "AI Assistant",
    url: "/chat",
    icon: ChatCircleDots,
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
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={mainNavItems} label="Platform" />
        <SidebarSeparator />
        <NavMain items={toolsNavItems} label="Tools" />
        <SidebarSeparator />
        <NavMain items={systemNavItems} label="System" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
