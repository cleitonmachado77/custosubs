import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import type { VinculoFuncionario } from '@/types'

export interface FuncionarioItem {
  nome: string
  cargo: string
  vinculo: VinculoFuncionario
  salario: number
}

const VINCULO_OPTIONS = [
  { value: 'concursado', label: 'Concursado' },
  { value: 'clt',        label: 'CLT' },
  { value: 'terceirizado', label: 'Terceirizado' },
]

const VINCULO_BADGE: Record<VinculoFuncionario, { label: string; className: string }> = {
  concursado:   { label: 'Concursado',   className: 'bg-blue-100 text-blue-700 border-blue-200' },
  clt:          { label: 'CLT',          className: 'bg-amber-100 text-amber-700 border-amber-200' },
  terceirizado: { label: 'Terceirizado', className: 'bg-teal-100 text-teal-700 border-teal-200' },
}

interface FuncionariosListProps {
  items: FuncionarioItem[]
  onChange: (items: FuncionarioItem[]) => void
}

export function FuncionariosList({ items, onChange }: FuncionariosListProps) {
  function addItem() {
    onChange([...items, { nome: '', cargo: '', vinculo: 'concursado', salario: 0 }])
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

  // Contagem por vínculo para o resumo
  const contagem = items.reduce<Record<VinculoFuncionario, number>>(
    (acc, f) => { acc[f.vinculo] = (acc[f.vinculo] || 0) + 1; return acc },
    { concursado: 0, clt: 0, terceirizado: 0 }
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Funcionários</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Informe todos os funcionários desta UBS no período
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={addItem} type="button">
          <Plus className="w-3.5 h-3.5" />
          Adicionar
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center bg-gray-50">
          <p className="text-sm text-gray-400">Nenhum funcionário adicionado.</p>
          <p className="text-xs text-gray-400 mt-1">
            Clique em "Adicionar" para incluir funcionários.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_8rem_10rem_2.5rem] gap-3 px-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nome</span>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cargo</span>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Vínculo</span>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Salário / Custo</span>
            <span />
          </div>

          {items.map((item, index) => {
            return (
              <div
                key={index}
                className="grid grid-cols-[1fr_1fr_8rem_10rem_2.5rem] gap-3 items-end p-3 rounded-lg border border-indigo-100 bg-indigo-50"
              >
                <Input
                  value={item.nome}
                  onChange={(e) => updateItem(index, 'nome', e.target.value)}
                  placeholder="Nome completo"
                />
                <Input
                  value={item.cargo}
                  onChange={(e) => updateItem(index, 'cargo', e.target.value)}
                  placeholder="Ex: Médico, ACS..."
                />
                <div className={[
                  'rounded-xl border-2 transition-colors',
                  item.vinculo === 'concursado'   ? 'border-blue-200'   : '',
                  item.vinculo === 'clt'          ? 'border-amber-200'  : '',
                  item.vinculo === 'terceirizado' ? 'border-teal-200'   : '',
                ].join(' ')}>
                  <Select
                    value={item.vinculo}
                    onChange={(e) => updateItem(index, 'vinculo', e.target.value as VinculoFuncionario)}
                    options={VINCULO_OPTIONS}
                  />
                </div>
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
            )
          })}
        </div>
      )}

      {items.length > 0 && (
        <div className="flex items-center justify-between pt-1 px-1 flex-wrap gap-2">
          {/* Contagem por vínculo */}
          <div className="flex items-center gap-2 flex-wrap">
            {(Object.entries(contagem) as [VinculoFuncionario, number][])
              .filter(([, qtd]) => qtd > 0)
              .map(([vinculo, qtd]) => {
                const badge = VINCULO_BADGE[vinculo]
                return (
                  <span
                    key={vinculo}
                    className={[
                      'text-xs font-semibold px-2 py-0.5 rounded-full border',
                      badge.className,
                    ].join(' ')}
                  >
                    {qtd} {badge.label}{qtd !== 1 ? 's' : ''}
                  </span>
                )
              })}
          </div>

          <span className="text-sm font-semibold text-gray-700">
            Total:{' '}
            <span className="text-indigo-700">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSalarios)}
            </span>
          </span>
        </div>
      )}
    </div>
  )
}
