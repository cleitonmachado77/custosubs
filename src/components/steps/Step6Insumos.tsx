import { Pill } from 'lucide-react'
import { DynamicItemList, type CostItem } from '@/components/form/DynamicItemList'

interface Step6Props {
  items: CostItem[]
  onChange: (items: CostItem[]) => void
}

export function Step6Insumos({ items, onChange }: Step6Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
          <Pill className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Insumos</h2>
          <p className="text-sm text-gray-500">
            Informe os insumos e seus custos. Exemplos: Medicamentos, Materiais de Enfermagem, Odontológicos, Médico Hospitalares.
          </p>
        </div>
      </div>

      <DynamicItemList
        title="Itens de Insumos"
        description="Adicione cada tipo de insumo com o valor gasto no período"
        items={items}
        onChange={onChange}
        namePlaceholder="Ex: Medicamentos, Mat. Enfermagem..."
        colorClass="bg-red-50 border-red-100"
      />
    </div>
  )
}
