import { useState, useEffect } from 'react'
import { ArrowLeft, Check, GraduationCap, Plus, Trash2 } from 'lucide-react'
import type { Municipio } from '@/types'
import type { Escola, TipoCustoFuncionario, VinculoEdu, CategoriaEduCusto } from '@/types/educacao'
import { getEduFuncionarios, upsertEduFuncionarios, getEduItensCusto, upsertEduItensCusto } from '@/services/educacao-lancamentos'

interface EduPainelLancamentoProps {
  municipio: Municipio
  escola: Escola
  mes: number
  ano: number
  onBack: () => void
}

interface FuncRow {
  nome: string
  cargo: string
  tipo_custo: TipoCustoFuncionario
  vinculo: VinculoEdu
  salario: number
}

interface ItemRow {
  categoria: CategoriaEduCusto
  nome: string
  valor: number
}

const MESES = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

const CATEGORIA_LABELS: Record<CategoriaEduCusto, string> = {
  material_pedagogico: 'Material Pedagógico',
  merenda: 'Merenda (Gêneros Alimentícios)',
  despesa_fixa: 'Despesa Fixa (Energia, Água, Internet)',
  terceirizado: 'Terceirizado',
}

export function EduPainelLancamento({ municipio, escola, mes, ano, onBack }: EduPainelLancamentoProps) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Funcionários
  const [funcionarios, setFuncionarios] = useState<FuncRow[]>([])

  // Itens de custo
  const [itens, setItens] = useState<ItemRow[]>([])

  // Carrega dados existentes
  useEffect(() => {
    async function load() {
      try {
        const funcs = await getEduFuncionarios(escola.id, mes, ano)
        if (funcs.length > 0) {
          setFuncionarios(funcs.map((f) => ({
            nome: f.nome,
            cargo: f.cargo,
            tipo_custo: f.tipo_custo as TipoCustoFuncionario,
            vinculo: f.vinculo as VinculoEdu,
            salario: f.salario,
          })))
        }

        const items = await getEduItensCusto(escola.id, mes, ano)
        if (items.length > 0) {
          setItens(items.map((i) => ({
            categoria: i.categoria as CategoriaEduCusto,
            nome: i.nome,
            valor: i.valor,
          })))
        }
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [escola.id, mes, ano])

  // Funcionários helpers
  function addFuncionario(tipo: TipoCustoFuncionario) {
    setFuncionarios([...funcionarios, { nome: '', cargo: '', tipo_custo: tipo, vinculo: 'concursado', salario: 0 }])
  }

  function updateFuncionario(index: number, field: keyof FuncRow, value: string | number) {
    const updated = [...funcionarios]
    ;(updated[index] as any)[field] = value
    setFuncionarios(updated)
  }

  function removeFuncionario(index: number) {
    setFuncionarios(funcionarios.filter((_, i) => i !== index))
  }

  // Itens helpers
  function addItem(categoria: CategoriaEduCusto) {
    setItens([...itens, { categoria, nome: '', valor: 0 }])
  }

  function updateItem(index: number, field: keyof ItemRow, value: string | number) {
    const updated = [...itens]
    ;(updated[index] as any)[field] = value
    setItens(updated)
  }

  function removeItem(index: number) {
    setItens(itens.filter((_, i) => i !== index))
  }

  // Salvar
  async function handleSave() {
    setSaving(true)
    try {
      const validFuncs = funcionarios.filter((f) => f.nome.trim() && f.salario > 0)
      await upsertEduFuncionarios(escola.id, mes, ano, validFuncs)

      const validItens = itens.filter((i) => i.nome.trim() && i.valor > 0)
      await upsertEduItensCusto(escola.id, mes, ano, validItens)

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error(err)
      alert('Erro ao salvar dados')
    } finally {
      setSaving(false)
    }
  }

  const steps = [
    { num: 1, label: 'Pedagógico' },
    { num: 2, label: 'Social' },
    { num: 3, label: 'Administrativo' },
    { num: 4, label: 'Materiais e Despesas' },
  ]

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#1066C6]" />
            Lançamento de Custos
          </h1>
          <p className="text-xs text-gray-400">
            {escola.nome} • {MESES[mes]}/{ano} • {municipio.nome}
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {steps.map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => setStep(s.num)}
            className={[
              'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
              step === s.num
                ? 'bg-[#1066C6] text-white shadow-sm'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
            ].join(' ')}
          >
            <span className={[
              'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
              step === s.num ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500',
            ].join(' ')}>
              {s.num}
            </span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-6">
        {/* Step 1: Funcionários Pedagógicos */}
        {step === 1 && (
          <FuncionarioSection
            title="Custo Pedagógico — Professores"
            description="Remuneração dos professores (salário + 13º + férias proporcionais)"
            tipo="pedagogico"
            funcionarios={funcionarios.filter((f) => f.tipo_custo === 'pedagogico')}
            allFuncionarios={funcionarios}
            onAdd={() => addFuncionario('pedagogico')}
            onUpdate={updateFuncionario}
            onRemove={removeFuncionario}
          />
        )}

        {/* Step 2: Funcionários Sociais */}
        {step === 2 && (
          <FuncionarioSection
            title="Custo Social — Pessoal de Cozinha/Merenda"
            description="Mão de obra responsável pela manipulação de alimentos"
            tipo="social"
            funcionarios={funcionarios.filter((f) => f.tipo_custo === 'social')}
            allFuncionarios={funcionarios}
            onAdd={() => addFuncionario('social')}
            onUpdate={updateFuncionario}
            onRemove={removeFuncionario}
          />
        )}

        {/* Step 3: Funcionários Administrativos */}
        {step === 3 && (
          <FuncionarioSection
            title="Custo Administrativo — Outros Funcionários"
            description="Zeladores, secretários, vigias e demais funcionários"
            tipo="administrativo"
            funcionarios={funcionarios.filter((f) => f.tipo_custo === 'administrativo')}
            allFuncionarios={funcionarios}
            onAdd={() => addFuncionario('administrativo')}
            onUpdate={updateFuncionario}
            onRemove={removeFuncionario}
          />
        )}

        {/* Step 4: Itens de Custo */}
        {step === 4 && (
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">Materiais e Despesas</h3>
            <p className="text-xs text-gray-400 mb-4">Material pedagógico, merenda, despesas fixas e terceirizados</p>

            {(['material_pedagogico', 'merenda', 'despesa_fixa', 'terceirizado'] as CategoriaEduCusto[]).map((cat) => {
              const catItens = itens.filter((i) => i.categoria === cat)
              return (
                <div key={cat} className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-gray-700">{CATEGORIA_LABELS[cat]}</h4>
                    <button
                      type="button"
                      onClick={() => addItem(cat)}
                      className="inline-flex items-center gap-1 text-[#1066C6] hover:text-[#072F76] text-xs font-medium"
                    >
                      <Plus className="w-3 h-3" /> Adicionar
                    </button>
                  </div>
                  {catItens.length === 0 ? (
                    <p className="text-xs text-gray-300 italic">Nenhum item</p>
                  ) : (
                    <div className="space-y-2">
                      {itens.map((item, idx) => {
                        if (item.categoria !== cat) return null
                        return (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Descrição"
                              value={item.nome}
                              onChange={(e) => updateItem(idx, 'nome', e.target.value)}
                              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-[#1066C6]/20 outline-none"
                            />
                            <input
                              type="number"
                              placeholder="Valor"
                              min={0}
                              step={0.01}
                              value={item.valor || ''}
                              onChange={(e) => updateItem(idx, 'valor', Number(e.target.value))}
                              className="w-32 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-[#1066C6]/20 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center"
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              Anterior
            </button>
          )}
          {step < 4 && (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="bg-[#1066C6] hover:bg-[#072F76] text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              Próximo
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={[
            'inline-flex items-center gap-2 text-xs font-semibold px-6 py-2.5 rounded-lg transition-all',
            saved
              ? 'bg-green-500 text-white'
              : 'bg-[#072F76] hover:bg-[#1066C6] text-white',
          ].join(' ')}
        >
          {saved ? (
            <>
              <Check className="w-3.5 h-3.5" /> Salvo!
            </>
          ) : saving ? (
            'Salvando...'
          ) : (
            'Salvar Lançamento'
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Seção de Funcionários ───────────────────────────────────────────────────
function FuncionarioSection({
  title,
  description,
  tipo,
  funcionarios,
  allFuncionarios,
  onAdd,
  onUpdate,
  onRemove,
}: {
  title: string
  description: string
  tipo: TipoCustoFuncionario
  funcionarios: FuncRow[]
  allFuncionarios: FuncRow[]
  onAdd: () => void
  onUpdate: (index: number, field: keyof FuncRow, value: string | number) => void
  onRemove: (index: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-gray-800">{title}</h3>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 text-[#1066C6] hover:text-[#072F76] text-xs font-medium"
        >
          <Plus className="w-3 h-3" /> Adicionar
        </button>
      </div>

      {funcionarios.length === 0 ? (
        <p className="text-xs text-gray-300 italic py-4">Nenhum funcionário cadastrado nesta categoria</p>
      ) : (
        <div className="space-y-2 mt-3">
          {allFuncionarios.map((func, idx) => {
            if (func.tipo_custo !== tipo) return null
            return (
              <div key={idx} className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder="Nome"
                  value={func.nome}
                  onChange={(e) => onUpdate(idx, 'nome', e.target.value)}
                  className="flex-1 min-w-[140px] border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-[#1066C6]/20 outline-none"
                />
                <input
                  type="text"
                  placeholder="Cargo"
                  value={func.cargo}
                  onChange={(e) => onUpdate(idx, 'cargo', e.target.value)}
                  className="w-32 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-[#1066C6]/20 outline-none"
                />
                <select
                  value={func.vinculo}
                  onChange={(e) => onUpdate(idx, 'vinculo', e.target.value)}
                  className="w-28 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-[#1066C6]/20 outline-none"
                >
                  <option value="concursado">Concursado</option>
                  <option value="clt">CLT</option>
                  <option value="terceirizado">Terceirizado</option>
                </select>
                <input
                  type="number"
                  placeholder="Salário"
                  min={0}
                  step={0.01}
                  value={func.salario || ''}
                  onChange={(e) => onUpdate(idx, 'salario', Number(e.target.value))}
                  className="w-28 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-[#1066C6]/20 outline-none"
                />
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center shrink-0"
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
