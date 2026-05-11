import { cn } from '@/lib/utils'
import { Info } from 'lucide-react'
import type { ReactNode } from 'react'

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  icon: ReactNode
  color: 'blue' | 'green' | 'indigo' | 'orange' | 'red' | 'teal' | 'purple'
  trend?: string
  onClick?: () => void
}

const colorMap = {
  blue:   { icon: 'bg-[#004aad] text-white',   value: 'text-[#004aad]',   ring: 'ring-blue-100' },
  green:  { icon: 'bg-[#01884d] text-white',   value: 'text-[#01884d]',   ring: 'ring-green-100' },
  indigo: { icon: 'bg-indigo-600 text-white',  value: 'text-indigo-700',  ring: 'ring-indigo-100' },
  orange: { icon: 'bg-orange-500 text-white',  value: 'text-orange-600',  ring: 'ring-orange-100' },
  red:    { icon: 'bg-red-500 text-white',     value: 'text-red-600',     ring: 'ring-red-100' },
  teal:   { icon: 'bg-teal-600 text-white',    value: 'text-teal-700',    ring: 'ring-teal-100' },
  purple: { icon: 'bg-purple-600 text-white',  value: 'text-purple-700',  ring: 'ring-purple-100' },
}

export function KpiCard({ title, value, subtitle, icon, color, trend, onClick }: KpiCardProps) {
  const c = colorMap[color]
  const clickable = !!onClick

  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={clickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
      className={cn(
        'relative bg-white rounded-2xl border border-gray-100 shadow-sm p-4 transition-all duration-200',
        clickable
          ? 'cursor-pointer hover:shadow-lg hover:border-gray-200 hover:-translate-y-0.5 group'
          : 'hover:shadow-md'
      )}
    >
      {/* Ícone de info — aparece no hover quando clicável */}
      {clickable && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <Info className="w-3.5 h-3.5 text-gray-300" />
        </div>
      )}

      {/* Ícone no topo */}
      <div
        className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center mb-3 ring-4',
          c.icon,
          c.ring
        )}
      >
        {icon}
      </div>

      {/* Título */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide leading-snug mb-1">
        {title}
      </p>

      {/* Valor */}
      <p className={cn('text-xl font-bold leading-tight break-all', c.value)}>
        {value}
      </p>

      {/* Subtítulo */}
      {subtitle && (
        <p className="text-xs text-gray-400 mt-1 leading-snug">{subtitle}</p>
      )}
      {trend && (
        <p className="text-xs text-gray-500 mt-1">{trend}</p>
      )}

      {/* Hint "clique para detalhes" */}
      {clickable && (
        <p className="text-[10px] text-gray-300 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          Clique para ver o cálculo
        </p>
      )}
    </div>
  )
}
