import { ShoppingCart } from 'lucide-react'
import { DynamicItemList, type CostItem } from '@/components/form/DynamicItemList'

interface Step5Props {
  items: CostItem[]
  onChange: (items: CostItem[]) => void
}

export function Step5MateriaisConsumo({ items, onChange }: Step5Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
          <ShoppingCart className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Materiais de Consumo</h2>
          <p className="text-sm text-gray-500">
            Informe os materiais e seus custos. Exemplos: Material de Limpeza, Alimentos, Material de Escritório.
          </p>
        </div>
      </div>

      <DynamicItemList
        title="Itens de Material de Consumo"
        description="Adicione cada tipo de material com o valor gasto no período"
        items={items}
        onChange={onChange}
        namePlaceholder="Ex: Material de Limpeza, Alimentos..."
        colorClass="bg-orange-50 border-orange-100"
      />
    </div>
  )
}
