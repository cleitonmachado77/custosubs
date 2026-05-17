import { X } from 'lucide-react'
import { useEffect } from 'react'

export interface KpiExplain {
  title: string
  value: string
  formula?: string
  steps: { label: string; value: string; highlight?: boolean }[]
  note?: string
}

interface EduKpiExplainModalProps {
  explain: KpiExplain | null
  onClose: () => void
}

export function EduKpiExplainModal({ explain, onClose }: EduKpiExplainModalProps) {
  useEffect(() => {
    if (!explain) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [explain, onClose])

  if (!explain) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
              Como foi calculado
            </p>
            <h3 className="text-base font-extrabold text-gray-900 leading-tight">
              {explain.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors shrink-0 mt-0.5"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Valor em destaque */}
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Resultado</p>
          <p className="text-2xl font-extrabold text-[#1066C6]">{explain.value}</p>
          {explain.formula && (
            <p className="text-xs text-gray-500 mt-2 font-mono bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              {explain.formula}
            </p>
          )}
        </div>

        {/* Passos / componentes */}
        <div className="px-5 py-4 space-y-2 max-h-72 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Composição
          </p>
          {explain.steps.map((step, i) => (
            <div
              key={i}
              className={[
                'flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm',
                step.highlight
                  ? 'bg-[#1066C6]/8 border border-[#1066C6]/20 font-semibold'
                  : 'bg-gray-50 border border-gray-100',
              ].join(' ')}
            >
              <span className={step.highlight ? 'text-[#1066C6]' : 'text-gray-600'}>
                {step.label}
              </span>
              <span className={step.highlight ? 'text-[#1066C6] font-bold' : 'text-gray-800 font-semibold'}>
                {step.value}
              </span>
            </div>
          ))}
        </div>

        {/* Nota */}
        {explain.note && (
          <div className="px-5 pb-4">
            <p className="text-xs text-gray-400 bg-[#AECBE6]/20 border border-[#AECBE6]/40 rounded-xl px-3 py-2 leading-relaxed">
              📚 {explain.note}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
