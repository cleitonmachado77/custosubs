import { Users } from 'lucide-react'
import { FuncionariosList, type FuncionarioItem } from '@/components/form/FuncionariosList'

interface Step3Props {
  funcionarios: FuncionarioItem[]
  onChange: (items: FuncionarioItem[]) => void
}

export function Step3Funcionarios({ funcionarios, onChange }: Step3Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <Users className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Funcionários</h2>
          <p className="text-sm text-gray-500">Informe os funcionários e seus salários no período</p>
        </div>
      </div>

      <FuncionariosList items={funcionarios} onChange={onChange} />
    </div>
  )
}
