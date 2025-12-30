import React from 'react'
import {
  ChevronRight,
  Clock,
  List,
  Package,
  Receipt,
  ScanLine,
  ShoppingCart,
  BarChart3,
} from 'lucide-react'
import { useLocation } from '@tanstack/react-router'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'

import { cn } from '@/lib/utils'

// Menu items.
const items = [
  {
    title: 'POS',
    url: '/pos',
    icon: ScanLine,
  },
  {
    title: 'Order Queue',
    url: '/queue-orders',
    icon: Clock,
  },
  {
    title: 'Orders',
    url: '/orders',
    icon: ShoppingCart,
  },
  {
    title: 'Expenses',
    url: '/expenses',
    icon: Receipt,
  },
  {
    title: 'Reports',
    url: '/reports',
    icon: BarChart3,
  },
  {
    title: 'Manage Products',
    url: '#',
    icon: Package,
    items: [
      {
        title: 'Categories',
        url: '/categories',
        icon: List,
      },
      {
        title: 'Products',
        url: '/products',
        icon: Package,
      },
    ],
  },
]

export default function SideBar({
  variant,
}: {
  variant: 'inset' | 'floating'
}) {
  const { pathname } = useLocation()
  return (
    <Sidebar variant={variant} className="">
      <SidebarHeader className="p-4 border-b border-stone-200">
        <div className="flex flex-col items-center justify-center gap-2">
          <img
            src="/deja-bros-logo.png"
            alt="Deja Bros Logo"
            className="h-16 w-16 object-contain"
          />
          <h2 className="text-lg font-bold text-stone-900">Deja Bros</h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-500 font-medium">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <React.Fragment key={item.title}>
                  {item.items && (
                    <Collapsible
                      defaultOpen={item.items.some((subItem) =>
                        pathname.startsWith(subItem.url),
                      )}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            isActive={pathname.startsWith(item.url)}
                            className={cn(
                              pathname.startsWith(item.url) &&
                                'bg-sidebar-accent text-sidebar-accent-foreground',
                            )}
                          >
                            <item.icon />
                            <span>{item.title}</span>
                            <ChevronRight
                              className={cn(
                                'w-4 h-4 transition-transform duration-300 ml-auto',
                                'group-data-[state=open]/collapsible:rotate-90',
                              )}
                            />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuButton
                                  isActive={pathname.startsWith(subItem.url)}
                                  asChild
                                >
                                  <a href={subItem.url}>
                                    <subItem.icon />
                                    <span>{subItem.title}</span>
                                  </a>
                                </SidebarMenuButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )}

                  {!item.items && (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={pathname.startsWith(item.url)}
                        asChild
                      >
                        <a href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </React.Fragment>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
