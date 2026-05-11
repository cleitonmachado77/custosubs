import { Activity } from 'lucide-react'
import { ProducaoList, type ProducaoItem } from '@/components/form/ProducaoList'
import type { FuncionarioItem } from '@/components/form/FuncionariosList'

interface Step4Props {
  producao: ProducaoItem[]
  onChange: (items: ProducaoItem[]) => void
  funcionarios?: FuncionarioItem[]
}

export function Step4Producao({ producao, onChange, funcionarios = [] }: Step4Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <Activity className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Produção</h2>
          <p className="text-sm text-gray-500">
            Registre os eventos, atendimentos e os responsáveis por cada atividade
          </p>
        </div>
      </div>

      {funcionarios.length === 0 && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          <span className="text-base leading-none mt-0.5">💡</span>
          <p>
            Nenhum funcionário cadastrado ainda. Volte ao passo anterior para adicionar
            funcionários e poder vinculá-los aos eventos de produção.
          </p>
        </div>
      )}

      <ProducaoList
        items={producao}
        onChange={onChange}
        funcionarios={funcionarios}
      />
    </div>
  )
}
