import { Briefcase } from 'lucide-react'
import { DynamicItemList, type CostItem } from '@/components/form/DynamicItemList'

interface Step8Props {
  items: CostItem[]
  onChange: (items: CostItem[]) => void
}

export function Step8Terceirizados({ items, onChange }: Step8Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
        <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Serviços Terceirizados</h2>
          <p className="text-sm text-gray-500">
            Informe as despesas com empresas terceirizadas. Exemplos: Funcionários, Jardinagem, Segurança.
          </p>
        </div>
      </div>

      <DynamicItemList
        title="Itens Terceirizados"
        description="Adicione cada serviço terceirizado com o valor gasto no período"
        items={items}
        onChange={onChange}
        namePlaceholder="Ex: Empresa de Limpeza, Segurança..."
        colorClass="bg-teal-50 border-teal-100"
      />
    </div>
  )
}
