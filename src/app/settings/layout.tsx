'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings, FileText, Mail, Users, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const sidebarItems = [
  {
    name: 'Templates',
    href: '/settings/templates',
    icon: Mail,
    description: 'Manage email templates'
  },
  {
    name: 'Resumes',
    href: '/settings/resumes',
    icon: FileText,
    description: 'Manage resume files'
  },
  {
    name: 'Roles',
    href: '/settings/roles',
    icon: Users,
    description: 'Manage role configurations'
  }
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div 
          className={`fixed inset-0 bg-gray-600 transition-opacity ${
            sidebarOpen ? 'opacity-75' : 'opacity-0'
          }`}
          onClick={() => setSidebarOpen(false)}
        />
        <div 
          className={`fixed top-0 bottom-0 left-0 flex w-64 flex-col bg-white transition-transform shadow-xl ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b bg-white">
            <div className="flex items-center">
              <Settings className="w-6 h-6 text-blue-600 mr-2" />
              <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center p-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      <div className="lg:flex lg:min-h-screen">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <div className="flex flex-col w-64 bg-white border-r border-gray-200">
            <div className="flex items-center p-6 border-b bg-white">
              <Settings className="w-6 h-6 text-blue-600 mr-2" />
              <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {sidebarItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center p-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Mobile header */}
          <div className="flex items-center justify-between p-4 lg:hidden bg-white border-b">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="p-2"
            >
              <Menu className="w-4 h-4" />
            </Button>
            <div className="flex items-center">
              <Settings className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-medium text-gray-900">Settings</span>
            </div>
            <Link href="/" className="text-sm text-blue-600 hover:text-blue-700">
              ← Dashboard
            </Link>
          </div>
          
          {/* Page content */}
          <main className="flex-1 p-6 bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
