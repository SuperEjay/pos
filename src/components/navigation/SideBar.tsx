import { Link } from '@tanstack/react-router'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleIcon,
  PackageIcon,
  ShoppingCartIcon,
} from 'lucide-react'

const mainMenuItems = [
  {
    label: 'Orders',
    icon: ShoppingCartIcon,
    href: '/',
  },
  {
    label: 'Manage Products',
    icon: PackageIcon,
    href: '#',
    children: [
      {
        label: 'Products',
        icon: CircleIcon,
        href: '/products',
      },
      {
        label: 'Categories',
        icon: CircleIcon,
        href: '/categories',
      },
    ],
  },
]

export default function SideBar() {
  return (
    <aside className="bg-[#f7f7f7] h-screen w-64 relative border-r border-[#e5e5e5] p-4">
      <div className="flex flex-col gap-6 h-16 py-4">
        <h3 className="text-2xl font-medium">Saledash</h3>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-[#d2d2d2]">Main Menu</p>
          <div className="flex flex-col gap-[20px] mt-2 ml-2">
            {mainMenuItems.map((item) => (
              <>
                {item.children && (
                  <div className="flex flex-col gap-2">
                    <p className="flex items-center gap-2 text-sm font-medium text-[#898989] mb-2">
                      <item.icon size={16} />
                      {item.label}
                      <ChevronRightIcon size={16} className="ml-auto" />
                    </p>
                    <div className="flex flex-col gap-4 ml-6">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          to={child.href}
                          className="flex items-center gap-2 text-[#898989]"
                        >
                          <child.icon size={12} />
                          <p className="text-[12px] font-medium">
                            {child.label}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {!item.children && (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="flex items center gap-2 text-[#898989]"
                  >
                    <item.icon size={14} />
                    <p className="text-[14px] font-medium">{item.label}</p>
                  </Link>
                )}
              </>
            ))}
          </div>
        </div>
      </div>

      {/* Toggle SideBar */}
      <div className="absolute bg-white h-8 w-8 rounded-full shadow-lg top-8 -right-4 border border-gray-200">
        <div className="flex items-center justify-center h-full">
          <ChevronLeftIcon className="w-6 h-6" />
        </div>
      </div>
    </aside>
  )
}
