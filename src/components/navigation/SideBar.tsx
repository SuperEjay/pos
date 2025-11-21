import { ChevronRight, List, Package, ShoppingCart, ScanLine } from 'lucide-react'
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
    title: 'Orders',
    url: '/orders',
    icon: ShoppingCart,
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
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-500 font-medium">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <>
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
                </>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
