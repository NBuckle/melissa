/**
 * Navigation Component
 *
 * Sidebar navigation with role-based menu items.
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

interface NavigationProps {
  role: 'admin' | 'data_entry'
}

export function Navigation({ role }: NavigationProps) {
  const pathname = usePathname()

  const menuItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: '📊',
      roles: ['admin', 'data_entry'],
    },
    {
      label: 'Collect Items',
      href: '/collect',
      icon: '📝',
      roles: ['admin', 'data_entry'],
    },
    {
      label: 'Total Inventory',
      href: '/inventory/total',
      icon: '📦',
      roles: ['admin', 'data_entry'],
    },
    {
      label: 'Daily Inventory',
      href: '/inventory/daily',
      icon: '📅',
      roles: ['admin', 'data_entry'],
    },
    {
      label: 'Withdrawals',
      href: '/admin/withdrawals',
      icon: '📤',
      roles: ['admin'],
    },
    {
      label: 'Items Management',
      href: '/admin/items',
      icon: '🏷️',
      roles: ['admin'],
    },
    {
      label: 'Users',
      href: '/admin/users',
      icon: '👥',
      roles: ['admin'],
    },
    {
      label: 'Reports',
      href: '/reports',
      icon: '📈',
      roles: ['admin', 'data_entry'],
    },
  ]

  const visibleItems = menuItems.filter((item) => item.roles.includes(role))

  return (
    <nav className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)]">
      <div className="p-4 space-y-1">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
              pathname === item.href
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-50'
            )}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
