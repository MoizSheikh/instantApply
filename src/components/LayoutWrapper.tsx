'use client'

import { usePathname } from 'next/navigation'

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  if (pathname.startsWith('/settings')) {
    return <>{children}</>
  }
  
  return (
    <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {children}
    </main>
  )
}
