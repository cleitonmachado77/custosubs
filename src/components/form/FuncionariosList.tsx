import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CurrencyInput } from '@/components/ui/CurrencyInput'

export interface FuncionarioItem {
  nome: string
  cargo: string
  salario: number
}

interface FuncionariosListProps {
  items: FuncionarioItem[]
  onChange: (items: FuncionarioItem[]) => void
}

export function FuncionariosList({ items, onChange }: FuncionariosListProps) {
  function addItem() {
    onChange([...items, { nome: '', cargo: '', salario: 0 }])
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof FuncionarioItem, value: string | number) {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
    onChange(updated)
  }

  const totalSalarios = items.reduce((sum, f) => sum + (f.salario || 0), 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Funcionários</h3>
          <p className="text-xs text-gray-500 mt-0.5">Informe todos os funcionários desta UBS no período</p>
        </div>
        <Button variant="secondary" size="sm" onClick={addItem} type="button">
          <Plus className="w-3.5 h-3.5" />
          Adicionar
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center bg-gray-50">
          <p className="text-sm text-gray-400">Nenhum funcionário adicionado.</p>
          <p className="text-xs text-gray-400 mt-1">Clique em "Adicionar" para incluir funcionários.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_10rem_2.5rem] gap-3 px-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nome</span>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cargo</span>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Salário</span>
            <span />
          </div>

          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-[1fr_1fr_10rem_2.5rem] gap-3 items-end p-3 rounded-lg border border-indigo-100 bg-indigo-50"
            >
              <Input
                value={item.nome}
                onChange={(e) => updateItem(index, 'nome', e.target.value)}
                placeholder="Nome completo"
              />
              <Input
                value={item.cargo}
                onChange={(e) => updateItem(index, 'cargo', e.target.value)}
                placeholder="Ex: Médico, Enfermeiro..."
              />
              <CurrencyInput
                value={item.salario}
                onChange={(val) => updateItem(index, 'salario', val)}
              />
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                aria-label="Remover funcionário"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="flex justify-between items-center pt-1 px-1">
          <span className="text-xs text-gray-500">{items.length} funcionário(s)</span>
          <span className="text-sm font-semibold text-gray-700">
            Total de salários:{' '}
            <span className="text-indigo-700">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSalarios)}
            </span>
          </span>
        </div>
      )}
    </div>
  )
}
