"use client"

import Image from "next/image"
import Link from "next/link"

import {
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

export function TeamSwitcher() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Link
          href="/dashboard"
          className="flex h-12 items-center justify-center px-2 hover:opacity-80 transition-opacity"
        >
          {isCollapsed ? (
            <Image
              src="/logo/termly-icon.svg"
              alt="Termly"
              width={32}
              height={32}
              className="dark:invert"
            />
          ) : (
            <Image
              src="/logo/termly-logo.svg"
              alt="Termly"
              width={110}
              height={30}
              className="dark:invert"
              priority
            />
          )}
        </Link>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
