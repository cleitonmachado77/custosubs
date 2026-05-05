import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export interface ProducaoItem {
  evento: string
  quantidade_atendimentos: number
}

interface ProducaoListProps {
  items: ProducaoItem[]
  onChange: (items: ProducaoItem[]) => void
}

export function ProducaoList({ items, onChange }: ProducaoListProps) {
  function addItem() {
    onChange([...items, { evento: '', quantidade_atendimentos: 0 }])
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof ProducaoItem, value: string | number) {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
    onChange(updated)
  }

  const totalAtendimentos = items.reduce((sum, p) => sum + (p.quantidade_atendimentos || 0), 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Eventos de Produção</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Cada evento possui um nome e a quantidade de atendimentos realizados
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={addItem} type="button">
          <Plus className="w-3.5 h-3.5" />
          Adicionar
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center bg-gray-50">
          <p className="text-sm text-gray-400">Nenhum evento adicionado.</p>
          <p className="text-xs text-gray-400 mt-1">Clique em "Adicionar" para incluir eventos.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_10rem_2.5rem] gap-3 px-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Evento</span>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Qtd. Atendimentos</span>
            <span />
          </div>

          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-[1fr_10rem_2.5rem] gap-3 items-end p-3 rounded-lg border border-emerald-100 bg-emerald-50"
            >
              <Input
                value={item.evento}
                onChange={(e) => updateItem(index, 'evento', e.target.value)}
                placeholder="Ex: Consulta Médica, Vacinação..."
              />
              <Input
                type="number"
                min={0}
                value={item.quantidade_atendimentos || ''}
                onChange={(e) => updateItem(index, 'quantidade_atendimentos', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                aria-label="Remover evento"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="flex justify-between items-center pt-1 px-1">
          <span className="text-xs text-gray-500">{items.length} evento(s)</span>
          <span className="text-sm font-semibold text-gray-700">
            Total de atendimentos:{' '}
            <span className="text-emerald-700">
              {totalAtendimentos.toLocaleString('pt-BR')}
            </span>
          </span>
        </div>
      )}
    </div>
  )
}
