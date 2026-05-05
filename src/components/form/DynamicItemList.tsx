import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { cn } from '@/lib/utils'

export interface CostItem {
  nome: string
  valor: number
}

interface DynamicItemListProps {
  title: string
  description?: string
  items: CostItem[]
  onChange: (items: CostItem[]) => void
  namePlaceholder?: string
  colorClass?: string
}

export function DynamicItemList({
  title,
  description,
  items,
  onChange,
  namePlaceholder = 'Nome do item',
  colorClass = 'bg-blue-50 border-blue-200',
}: DynamicItemListProps) {
  function addItem() {
    onChange([...items, { nome: '', valor: 0 }])
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof CostItem, value: string | number) {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
    onChange(updated)
  }

  const total = items.reduce((sum, item) => sum + (item.valor || 0), 0)

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        <Button variant="secondary" size="sm" onClick={addItem} type="button">
          <Plus className="w-3.5 h-3.5" />
          Adicionar
        </Button>
      </div>

      {items.length === 0 ? (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center',
            'border-gray-200 bg-gray-50'
          )}
        >
          <p className="text-sm text-gray-400">Nenhum item adicionado.</p>
          <p className="text-xs text-gray-400 mt-1">Clique em "Adicionar" para incluir itens.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={index}
              className={cn(
                'flex items-end gap-3 p-3 rounded-lg border',
                colorClass
              )}
            >
              <div className="flex-1">
                <Input
                  label={index === 0 ? 'Nome' : undefined}
                  value={item.nome}
                  onChange={(e) => updateItem(index, 'nome', e.target.value)}
                  placeholder={namePlaceholder}
                />
              </div>
              <div className="w-44">
                <CurrencyInput
                  label={index === 0 ? 'Valor (R$)' : undefined}
                  value={item.valor}
                  onChange={(val) => updateItem(index, 'valor', val)}
                />
              </div>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="mb-0.5 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                aria-label="Remover item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="flex justify-end pt-1">
          <span className="text-sm font-semibold text-gray-700">
            Total:{' '}
            <span className="text-blue-700">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
            </span>
          </span>
        </div>
      )}
    </div>
  )
}
