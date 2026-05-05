import { Activity } from 'lucide-react'
import { ProducaoList, type ProducaoItem } from '@/components/form/ProducaoList'

interface Step4Props {
  producao: ProducaoItem[]
  onChange: (items: ProducaoItem[]) => void
}

export function Step4Producao({ producao, onChange }: Step4Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <Activity className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Produção</h2>
          <p className="text-sm text-gray-500">Registre os eventos e a quantidade de atendimentos</p>
        </div>
      </div>

      <ProducaoList items={producao} onChange={onChange} />
    </div>
  )
}
