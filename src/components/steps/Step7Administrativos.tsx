import { Landmark, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import type { CostItem } from '@/components/form/DynamicItemList'
import { Input } from '@/components/ui/Input'

// Campos fixos obrigatórios — identificados pela propriedade `fixed: true`
export const ADMIN_FIXOS = ['Água', 'Energia', 'Internet'] as const
type AdminFixo = (typeof ADMIN_FIXOS)[number]

interface Step7Props {
  items: CostItem[]
  onChange: (items: CostItem[]) => void
}

/** Garante que os 3 itens fixos estejam presentes no array (chama no init e ao carregar) */
export function garantirFixos(items: CostItem[]): CostItem[] {
  const resultado = [...items]
  for (const nome of ADMIN_FIXOS) {
    if (!resultado.find((i) => i.nome === nome && (i as CostItem & { fixed?: boolean }).fixed)) {
      resultado.unshift({ nome, valor: 0, ...(({ fixed: true } as unknown) as object) } as CostItem)
    }
  }
  // Mantém a ordem: fixos primeiro, na ordem definida
  const fixos = ADMIN_FIXOS.map(
    (nome) => resultado.find((i) => i.nome === nome && (i as CostItem & { fixed?: boolean }).fixed)!
  )
  const extras = resultado.filter((i) => !(i as CostItem & { fixed?: boolean }).fixed)
  return [...fixos, ...extras]
}

export function Step7Administrativos({ items, onChange }: Step7Props) {
  // Separa fixos e extras
  const fixos = ADMIN_FIXOS.map(
    (nome) =>
      items.find((i) => i.nome === nome && (i as CostItem & { fixed?: boolean }).fixed) ?? {
        nome,
        valor: 0,
        fixed: true,
      }
  ) as (CostItem & { fixed: boolean })[]

  const extras = items.filter((i) => !(i as CostItem & { fixed?: boolean }).fixed)

  function updateFixo(nome: AdminFixo, valor: number) {
    const novos = garantirFixos(items).map((i) =>
      (i as CostItem & { fixed?: boolean }).fixed && i.nome === nome ? { ...i, valor } : i
    )
    onChange(novos)
  }

  function addExtra() {
    onChange([...garantirFixos(items), { nome: '', valor: 0 }])
  }

  function removeExtra(extraIndex: number) {
    const novosExtras = extras.filter((_, i) => i !== extraIndex)
    onChange([...fixos, ...novosExtras])
  }

  function updateExtra(extraIndex: number, field: keyof CostItem, value: string | number) {
    const novosExtras = extras.map((item, i) =>
      i === extraIndex ? { ...item, [field]: value } : item
    )
    onChange([...fixos, ...novosExtras])
  }

  const totalFixos = fixos.reduce((s, i) => s + (i.valor || 0), 0)
  const totalExtras = extras.reduce((s, i) => s + (i.valor || 0), 0)
  const totalGeral = totalFixos + totalExtras

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  // Ícones para os campos fixos
  const icones: Record<AdminFixo, string> = {
    Água: '💧',
    Energia: '⚡',
    Internet: '🌐',
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <Landmark className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Despesas Administrativas</h2>
          <p className="text-sm text-gray-500">
            Preencha os valores obrigatórios e adicione outras despesas se necessário
          </p>
        </div>
      </div>

      {/* Campos fixos obrigatórios */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-800">Despesas obrigatórias</h3>
          <span className="text-xs font-medium px-2 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded-full">
            Obrigatório
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {fixos.map((item) => {
            const nome = item.nome as AdminFixo
            const vazio = !item.valor || item.valor === 0
            return (
              <div
                key={nome}
                className={[
                  'rounded-xl border p-4 transition-colors',
                  vazio
                    ? 'border-red-200 bg-red-50/40'
                    : 'border-purple-200 bg-purple-50/40',
                ].join(' ')}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg leading-none">{icones[nome]}</span>
                  <span className="text-sm font-semibold text-gray-700">{nome}</span>
                  {vazio && (
                    <span className="ml-auto text-xs text-red-500 font-medium">Obrigatório</span>
                  )}
                </div>
                <CurrencyInput
                  value={item.valor}
                  onChange={(val) => updateFixo(nome, val)}
                  placeholder="R$ 0,00"
                />
              </div>
            )
          })}
        </div>

        {fixos.some((i) => !i.valor || i.valor === 0) && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <span>⚠</span>
            Preencha todos os campos obrigatórios antes de avançar. Caso não haja custo, informe R$ 0,00.
          </p>
        )}
      </div>

      {/* Divisor */}
      <div className="border-t border-dashed border-gray-200" />

      {/* Campos extras personalizados */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Outras despesas</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Adicione despesas adicionais como aluguel, combustível, limpeza, etc.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={addExtra} type="button">
            <Plus className="w-3.5 h-3.5" />
            Adicionar
          </Button>
        </div>

        {extras.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-5 text-center bg-gray-50">
            <p className="text-sm text-gray-400">Nenhuma despesa adicional.</p>
            <p className="text-xs text-gray-400 mt-1">
              Clique em "Adicionar" para incluir outras despesas.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Header — desktop only */}
            <div className="hidden sm:grid grid-cols-[1fr_11rem_2.5rem] gap-3 px-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Descrição</span>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Valor (R$)</span>
              <span />
            </div>

            {extras.map((item, index) => (
              <div
                key={index}
                className="flex flex-col sm:grid sm:grid-cols-[1fr_11rem_2.5rem] gap-2 sm:gap-3 sm:items-end p-3 rounded-lg border border-purple-100 bg-purple-50"
              >
                <Input
                  label={index === 0 ? undefined : undefined}
                  value={item.nome}
                  onChange={(e) => updateExtra(index, 'nome', e.target.value)}
                  placeholder="Ex: Aluguel, Combustível, Limpeza..."
                />
                <div className="flex items-end gap-2">
                  <div className="flex-1 sm:flex-none sm:w-full">
                    <CurrencyInput
                      value={item.valor}
                      onChange={(val) => updateExtra(index, 'valor', val)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExtra(index)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                    aria-label="Remover item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total */}
      {totalGeral > 0 && (
        <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 space-y-1.5">
          {totalFixos > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Obrigatórias (Água + Energia + Internet)</span>
              <span className="font-medium">{fmt(totalFixos)}</span>
            </div>
          )}
          {totalExtras > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Outras despesas ({extras.length} item{extras.length !== 1 ? 's' : ''})</span>
              <span className="font-medium">{fmt(totalExtras)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm pt-1 border-t border-purple-200">
            <span className="text-gray-700">Total Administrativo</span>
            <span className="text-purple-700">{fmt(totalGeral)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
