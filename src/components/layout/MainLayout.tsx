import { useState, useEffect } from 'react'
import { Toaster } from 'sonner'

import { SideBar } from '../navigation'
import { Separator } from '../ui/separator'
import { SidebarProvider, SidebarTrigger } from '../ui/sidebar'
import { cn } from '@/lib/utils'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [currentDateTime, setCurrentDateTime] = useState(new Date())

  useEffect(() => {
    // Update date and time every second
    const interval = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className={cn('flex flex-col min-h-screen')}>
      <SidebarProvider>
        <SideBar variant="floating" />
        <main className="bg-stone-100 p-6 w-full flex flex-col flex-1 gap-6">
          <div className="flex items-center justify-end gap-2">
            <SidebarTrigger className="text-gray-500" />
            <Separator orientation="vertical" className="bg-gray-500 h-4" />
            <p className="text-sm font-medium text-gray-500">
              Welcome, Bro's
            </p>
            <Separator orientation="vertical" className="bg-gray-500 h-4" />
            <p className="text-sm font-medium text-gray-500 ">
              {currentDateTime.toLocaleDateString()}{' '}
              {currentDateTime.toLocaleTimeString()}
            </p>
          </div>

          <div className="w-full">{children}</div>
        </main>
      </SidebarProvider>

      <Toaster />
    </div>
  )
}
