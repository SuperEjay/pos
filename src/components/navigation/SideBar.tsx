import { ChevronLeftIcon } from 'lucide-react'

export default function SideBar() {
  return (
    <aside className="bg-[#f7f7f7] h-screen w-64 relative border-r border-gray-200">
      <div className="absolute bg-white h-8 w-8 rounded-full shadow-lg top-8 -right-4 border border-gray-200">
        <div className="flex items-center justify-center h-full">
          <ChevronLeftIcon className="w-6 h-6" />
        </div>
      </div>
    </aside>
  )
}
