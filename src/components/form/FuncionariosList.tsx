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
  equipe?: number  // 0 ou undefined = sem equipe
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
  numEquipes?: number  // número de equipes ESF da UBS
}

export function FuncionariosList({ items, onChange, numEquipes = 0 }: FuncionariosListProps) {
  const temEquipes = numEquipes > 0

  // Gera opções de equipe
  const equipeOptions = [
    { value: '0', label: 'Sem equipe' },
    ...Array.from({ length: numEquipes }, (_, i) => ({
      value: String(i + 1),
      label: `Equipe ${i + 1}`,
    })),
  ]

  function addItem() {
    onChange([...items, { nome: '', cargo: '', vinculo: 'concursado', salario: 0, equipe: 0 }])
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

  // Contagem por vínculo
  const contagem = items.reduce<Record<VinculoFuncionario, number>>(
    (acc, f) => { acc[f.vinculo] = (acc[f.vinculo] || 0) + 1; return acc },
    { concursado: 0, clt: 0, terceirizado: 0 }
  )

  // Contagem por equipe
  const contagemEquipe = temEquipes
    ? items.reduce<Record<number, number>>((acc, f) => {
        const eq = f.equipe ?? 0
        acc[eq] = (acc[eq] || 0) + 1
        return acc
      }, {})
    : {}

  // Grid columns
  const gridCols = temEquipes
    ? 'grid-cols-[1fr_1fr_7rem_7rem_9rem_2.5rem]'
    : 'grid-cols-[1fr_1fr_8rem_10rem_2.5rem]'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Funcionários</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Informe todos os funcionários desta UBS no período
            {temEquipes && ` e atribua-os às ${numEquipes} equipe(s) ESF`}
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
          {/* Header — desktop only */}
          <div className={`hidden md:grid ${gridCols} gap-3 px-3`}>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nome</span>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cargo</span>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Vínculo</span>
            {temEquipes && (
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Equipe</span>
            )}
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Salário</span>
            <span />
          </div>

          {items.map((item, index) => (
            <div key={index}>
              {/* Desktop: grid layout */}
              <div
                className={`hidden md:grid ${gridCols} gap-3 items-end p-3 rounded-lg border border-indigo-100 bg-indigo-50`}
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
                {temEquipes && (
                  <div className={[
                    'rounded-xl border-2 transition-colors',
                    (item.equipe ?? 0) > 0 ? 'border-green-200' : 'border-gray-200',
                  ].join(' ')}>
                    <Select
                      value={String(item.equipe ?? 0)}
                      onChange={(e) => updateItem(index, 'equipe', parseInt(e.target.value))}
                      options={equipeOptions}
                    />
                  </div>
                )}
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

              {/* Mobile: card layout */}
              <div className="md:hidden p-3 rounded-lg border border-indigo-100 bg-indigo-50 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-indigo-600">#{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Remover funcionário"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <Input
                    label="Nome"
                    value={item.nome}
                    onChange={(e) => updateItem(index, 'nome', e.target.value)}
                    placeholder="Nome completo"
                  />
                  <Input
                    label="Cargo"
                    value={item.cargo}
                    onChange={(e) => updateItem(index, 'cargo', e.target.value)}
                    placeholder="Ex: Médico, ACS..."
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Vínculo</label>
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
                    </div>
                    {temEquipes && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Equipe</label>
                        <div className={[
                          'rounded-xl border-2 transition-colors',
                          (item.equipe ?? 0) > 0 ? 'border-green-200' : 'border-gray-200',
                        ].join(' ')}>
                          <Select
                            value={String(item.equipe ?? 0)}
                            onChange={(e) => updateItem(index, 'equipe', parseInt(e.target.value))}
                            options={equipeOptions}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <CurrencyInput
                    label="Salário"
                    value={item.salario}
                    onChange={(val) => updateItem(index, 'salario', val)}
                  />
                </div>
              </div>
            </div>
          ))}
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

      {/* Resumo por equipe */}
      {temEquipes && items.length > 0 && (
        <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Distribuição por equipe
          </p>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: numEquipes }, (_, i) => {
              const eq = i + 1
              const qtd = contagemEquipe[eq] ?? 0
              return (
                <span
                  key={eq}
                  className={[
                    'text-xs font-semibold px-2.5 py-1 rounded-full border',
                    qtd > 0
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : 'bg-gray-100 text-gray-400 border-gray-200',
                  ].join(' ')}
                >
                  Equipe {eq}: {qtd} serv.
                </span>
              )
            })}
            {(contagemEquipe[0] ?? 0) > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-amber-50 text-amber-600 border-amber-200">
                Sem equipe: {contagemEquipe[0]} serv.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
