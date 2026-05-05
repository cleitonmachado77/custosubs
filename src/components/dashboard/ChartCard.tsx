import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface ChartCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
  minHeight?: string
}

export function ChartCard({ title, subtitle, children, className, minHeight = 'min-h-72' }: ChartCardProps) {
  return (
    <div className={cn('bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow duration-200', className)}>
      <div className="mb-4 pb-3 border-b border-gray-50">
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className={minHeight}>
        {children}
      </div>
    </div>
  )
}
