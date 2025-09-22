'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Plus, Home, Settings } from 'lucide-react'

export default function Navigation() {
  const pathname = usePathname()

  const links = [
    {
      href: '/',
      label: 'Dashboard',
      icon: Home
    },
    {
      href: '/add-job',
      label: 'Add Job',
      icon: Plus
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: Settings
    }
  ]

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">InstantApply</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {links.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium',
                      (pathname === link.href || (link.href === '/settings' && pathname.startsWith('/settings')))
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          {links.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center pl-3 pr-4 py-2 border-l-4 text-base font-medium',
                  (pathname === link.href || (link.href === '/settings' && pathname.startsWith('/settings')))
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                )}
              >
                <Icon className="w-4 h-4 mr-3" />
                {link.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
