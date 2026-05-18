import { ChevronDown, Plus, Trash2, Users, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { FuncionarioItem } from './FuncionariosList'

export interface ProducaoItem {
  evento: string
  quantidade_atendimentos: number
  responsaveis?: string[]   // nomes dos funcionários vinculados
}

interface ProducaoListProps {
  items: ProducaoItem[]
  onChange: (items: ProducaoItem[]) => void
  funcionarios?: FuncionarioItem[]
}

// ─── Seletor de responsáveis ──────────────────────────────────────────────────
interface ResponsaveisSelectorProps {
  funcionarios: FuncionarioItem[]
  selecionados: string[]
  onChange: (nomes: string[]) => void
}

function ResponsaveisSelector({ funcionarios, selecionados, onChange }: ResponsaveisSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Agrupa por cargo para seleção em grupo
  const porCargo = funcionarios.reduce<Record<string, FuncionarioItem[]>>((acc, f) => {
    const cargo = f.cargo.trim() || 'Sem cargo'
    if (!acc[cargo]) acc[cargo] = []
    acc[cargo].push(f)
    return acc
  }, {})

  function toggleNome(nome: string) {
    if (selecionados.includes(nome)) {
      onChange(selecionados.filter((n) => n !== nome))
    } else {
      onChange([...selecionados, nome])
    }
  }

  function toggleCargo(cargo: string) {
    const nomesDoCargo = (porCargo[cargo] ?? []).map((f) => f.nome)
    const todosSelecionados = nomesDoCargo.every((n) => selecionados.includes(n))
    if (todosSelecionados) {
      onChange(selecionados.filter((n) => !nomesDoCargo.includes(n)))
    } else {
      const novos = nomesDoCargo.filter((n) => !selecionados.includes(n))
      onChange([...selecionados, ...novos])
    }
  }

  function selecionarTodos() {
    onChange(funcionarios.map((f) => f.nome))
  }

  function limparTodos() {
    onChange([])
  }

  const label =
    selecionados.length === 0
      ? 'Nenhum responsável'
      : selecionados.length === funcionarios.length
      ? 'Todos os funcionários'
      : selecionados.length === 1
      ? selecionados[0]
      : `${selecionados.length} funcionários`

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm transition-colors',
          open
            ? 'border-emerald-400 ring-2 ring-emerald-100 bg-white'
            : 'border-gray-200 bg-white hover:border-gray-300',
          selecionados.length > 0 ? 'text-gray-800' : 'text-gray-400',
        ].join(' ')}
      >
        <span className="flex items-center gap-1.5 truncate">
          <Users className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
          <span className="truncate">{label}</span>
        </span>
        <ChevronDown className={['w-3.5 h-3.5 shrink-0 text-gray-400 transition-transform', open ? 'rotate-180' : ''].join(' ')} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-30 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {/* Ações rápidas */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50">
            <button
              type="button"
              onClick={selecionarTodos}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-900 transition-colors"
            >
              Todos
            </button>
            <span className="text-gray-300">·</span>
            <button
              type="button"
              onClick={limparTodos}
              className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ml-auto p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Lista por cargo */}
          <div className="max-h-56 overflow-y-auto">
            {Object.entries(porCargo).map(([cargo, funcs]) => {
              const nomesDoCargo = funcs.map((f) => f.nome)
              const todosSel = nomesDoCargo.every((n) => selecionados.includes(n))
              const alguemSel = nomesDoCargo.some((n) => selecionados.includes(n))

              return (
                <div key={cargo}>
                  {/* Cabeçalho do cargo — clica para selecionar o grupo */}
                  <button
                    type="button"
                    onClick={() => toggleCargo(cargo)}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-emerald-50 transition-colors text-left border-b border-gray-100"
                  >
                    <span
                      className={[
                        'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                        todosSel
                          ? 'bg-emerald-500 border-emerald-500'
                          : alguemSel
                          ? 'bg-emerald-200 border-emerald-400'
                          : 'border-gray-300 bg-white',
                      ].join(' ')}
                    >
                      {(todosSel || alguemSel) && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                          {todosSel
                            ? <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            : <path d="M2 5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />}
                        </svg>
                      )}
                    </span>
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      {cargo}
                    </span>
                    <span className="ml-auto text-xs text-gray-400">{funcs.length}</span>
                  </button>

                  {/* Funcionários do cargo */}
                  {funcs.map((f) => {
                    const sel = selecionados.includes(f.nome)
                    return (
                      <button
                        key={f.nome}
                        type="button"
                        onClick={() => toggleNome(f.nome)}
                        className={[
                          'w-full flex items-center gap-2 px-4 py-2 text-left transition-colors',
                          sel ? 'bg-emerald-50 hover:bg-emerald-100' : 'hover:bg-gray-50',
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                            sel ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 bg-white',
                          ].join(' ')}
                        >
                          {sel && (
                            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                              <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        <span className="text-sm text-gray-700 truncate">{f.nome}</span>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tags dos selecionados */}
      {selecionados.length > 0 && selecionados.length <= 3 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {selecionados.map((nome) => (
            <span
              key={nome}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs rounded-full"
            >
              {nome}
              <button
                type="button"
                onClick={() => toggleNome(nome)}
                className="hover:text-emerald-600"
                aria-label={`Remover ${nome}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Lista de produção ────────────────────────────────────────────────────────
export function ProducaoList({ items, onChange, funcionarios = [] }: ProducaoListProps) {
  const temFuncionarios = funcionarios.length > 0

  function addItem() {
    onChange([...items, { evento: '', quantidade_atendimentos: 0, responsaveis: [] }])
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  function updateItem(index: number, patch: Partial<ProducaoItem>) {
    onChange(items.map((item, i) => i === index ? { ...item, ...patch } : item))
  }

  const totalAtendimentos = items.reduce((sum, p) => sum + (p.quantidade_atendimentos || 0), 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Eventos de Produção</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Registre os eventos, atendimentos e os responsáveis por cada atividade
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
        <div className="space-y-3">
          {/* Header — desktop only */}
          <div
            className={[
              'hidden sm:grid gap-3 px-3',
              temFuncionarios
                ? 'grid-cols-[1fr_9rem_1fr_2.5rem]'
                : 'grid-cols-[1fr_10rem_2.5rem]',
            ].join(' ')}
          >
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Evento</span>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Qtd. Atend.</span>
            {temFuncionarios && (
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Responsáveis</span>
            )}
            <span />
          </div>

          {items.map((item, index) => (
            <div key={index}>
              {/* Desktop grid */}
              <div
                className={[
                  'hidden sm:grid gap-3 items-start p-3 rounded-lg border border-emerald-100 bg-emerald-50',
                  temFuncionarios
                    ? 'grid-cols-[1fr_9rem_1fr_2.5rem]'
                    : 'grid-cols-[1fr_10rem_2.5rem]',
                ].join(' ')}
              >
                <Input
                  value={item.evento}
                  onChange={(e) => updateItem(index, { evento: e.target.value })}
                  placeholder="Ex: Consulta Médica, Vacinação..."
                />
                <Input
                  type="number"
                  min={0}
                  value={item.quantidade_atendimentos || ''}
                  onChange={(e) =>
                    updateItem(index, { quantidade_atendimentos: parseInt(e.target.value) || 0 })
                  }
                  placeholder="0"
                />
                {temFuncionarios && (
                  <ResponsaveisSelector
                    funcionarios={funcionarios}
                    selecionados={item.responsaveis ?? []}
                    onChange={(nomes) => updateItem(index, { responsaveis: nomes })}
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-0.5"
                  aria-label="Remover evento"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile card */}
              <div className="sm:hidden p-3 rounded-lg border border-emerald-100 bg-emerald-50 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-emerald-600">#{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Remover evento"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <Input
                  label="Evento"
                  value={item.evento}
                  onChange={(e) => updateItem(index, { evento: e.target.value })}
                  placeholder="Ex: Consulta Médica, Vacinação..."
                />
                <Input
                  label="Qtd. Atendimentos"
                  type="number"
                  min={0}
                  value={item.quantidade_atendimentos || ''}
                  onChange={(e) =>
                    updateItem(index, { quantidade_atendimentos: parseInt(e.target.value) || 0 })
                  }
                  placeholder="0"
                />
                {temFuncionarios && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Responsáveis</label>
                    <ResponsaveisSelector
                      funcionarios={funcionarios}
                      selecionados={item.responsaveis ?? []}
                      onChange={(nomes) => updateItem(index, { responsaveis: nomes })}
                    />
                  </div>
                )}
              </div>
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
