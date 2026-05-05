import { Landmark } from 'lucide-react'
import { DynamicItemList, type CostItem } from '@/components/form/DynamicItemList'

interface Step7Props {
  items: CostItem[]
  onChange: (items: CostItem[]) => void
}

export function Step7Administrativos({ items, onChange }: Step7Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <Landmark className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Despesas Administrativas</h2>
          <p className="text-sm text-gray-500">
            Informe as despesas administrativas. Exemplos: Água, Luz, Telefone, Internet, Aluguel, Combustível.
          </p>
        </div>
      </div>

      <DynamicItemList
        title="Itens Administrativos"
        description="Adicione cada despesa administrativa com o valor gasto no período"
        items={items}
        onChange={onChange}
        namePlaceholder="Ex: Água, Luz, Aluguel..."
        colorClass="bg-purple-50 border-purple-100"
      />
    </div>
  )
}
