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
          className={`flex items-center hover:opacity-80 transition-opacity ${
            isCollapsed ? 'justify-center h-14' : 'justify-start h-14 px-4'
          }`}
        >
          {isCollapsed ? (
            <Image
              src="/logo/Logo-mark.png"
              alt="Termly"
              width={36}
              height={36}
              className="object-contain"
            />
          ) : (
            <Image
              src="/logo/termly-logo.svg"
              alt="Termly"
              width={100}
              height={26}
              className="dark:invert"
              priority
            />
          )}
        </Link>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
