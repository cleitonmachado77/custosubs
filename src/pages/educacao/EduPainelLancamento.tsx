import { useState, useEffect } from 'react'
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StepIndicator, type Step } from '@/components/form/StepIndicator'
import { FuncionariosList, type FuncionarioItem } from '@/components/form/FuncionariosList'
import { DynamicItemList, type CostItem } from '@/components/form/DynamicItemList'
import { getEduFuncionarios, upsertEduFuncionarios, getEduItensCusto, upsertEduItensCusto } from '@/services/educacao-lancamentos'
import { formatCurrency } from '@/lib/utils'
import type { Municipio } from '@/types'
import type { Escola, TipoCustoFuncionario, VinculoEdu, CategoriaEduCusto } from '@/types/educacao'

const STEPS: Step[] = [
  { number: 1, title: 'Professores', icon: '👨‍🏫' },
  { number: 2, title: 'Cozinha', icon: '🍽️' },
  { number: 3, title: 'Administrativo', icon: '🏛️' },
  { number: 4, title: 'Mat. Pedagógico', icon: '📚' },
  { number: 5, title: 'Merenda', icon: '🥗' },
  { number: 6, title: 'Despesas Fixas', icon: '💡' },
  { number: 7, title: 'Terceirizados', icon: '🤝' },
]

const MESES_LABEL = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

interface EduPainelLancamentoProps {
  municipio: Municipio
  escola: Escola
  mes: number
  ano: number
  onBack: () => void
}

export function EduPainelLancamento({ municipio, escola, mes, ano, onBack }: EduPainelLancamentoProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [loadingExistente, setLoadingExistente] = useState(true)
  const [modoEdicao, setModoEdicao] = useState(false)

  // Dados
  const [funcPedagogico, setFuncPedagogico] = useState<FuncionarioItem[]>([])
  const [funcSocial, setFuncSocial] = useState<FuncionarioItem[]>([])
  const [funcAdministrativo, setFuncAdministrativo] = useState<FuncionarioItem[]>([])
  const [materialPedagogico, setMaterialPedagogico] = useState<CostItem[]>([])
  const [merenda, setMerenda] = useState<CostItem[]>([])
  const [despesasFixas, setDespesasFixas] = useState<CostItem[]>([])
  const [terceirizados, setTerceirizados] = useState<CostItem[]>([])

  // Carrega dados existentes
  useEffect(() => {
    setLoadingExistente(true)
    Promise.all([
      getEduFuncionarios(escola.id, mes, ano),
      getEduItensCusto(escola.id, mes, ano),
    ])
      .then(([funcs, itens]) => {
        const temDados = funcs.length > 0 || itens.length > 0
        if (temDados) {
          setModoEdicao(true)
          setFuncPedagogico(funcs.filter((f) => f.tipo_custo === 'pedagogico').map(toFuncItem))
          setFuncSocial(funcs.filter((f) => f.tipo_custo === 'social').map(toFuncItem))
          setFuncAdministrativo(funcs.filter((f) => f.tipo_custo === 'administrativo').map(toFuncItem))
          setMaterialPedagogico(itens.filter((i) => i.categoria === 'material_pedagogico').map(toCostItem))
          setMerenda(itens.filter((i) => i.categoria === 'merenda').map(toCostItem))
          setDespesasFixas(itens.filter((i) => i.categoria === 'despesa_fixa').map(toCostItem))
          setTerceirizados(itens.filter((i) => i.categoria === 'terceirizado').map(toCostItem))
        }
      })
      .catch(() => {})
      .finally(() => setLoadingExistente(false))
  }, [escola.id, mes, ano])

  function markCompleted(step: number) {
    setCompletedSteps((prev) => new Set([...prev, step]))
  }

  function handleNext() {
    markCompleted(currentStep)
    setCurrentStep((s) => Math.min(s + 1, STEPS.length))
  }

  function handleBack() {
    if (currentStep === 1) onBack()
    else setCurrentStep((s) => s - 1)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    try {
      // Monta lista de funcionarios
      const allFuncs = [
        ...funcPedagogico.filter((f) => f.nome.trim() && f.salario > 0).map((f) => ({ ...f, tipo_custo: 'pedagogico' as TipoCustoFuncionario })),
        ...funcSocial.filter((f) => f.nome.trim() && f.salario > 0).map((f) => ({ ...f, tipo_custo: 'social' as TipoCustoFuncionario })),
        ...funcAdministrativo.filter((f) => f.nome.trim() && f.salario > 0).map((f) => ({ ...f, tipo_custo: 'administrativo' as TipoCustoFuncionario })),
      ].map((f) => ({
        nome: f.nome,
        cargo: f.cargo,
        tipo_custo: f.tipo_custo,
        vinculo: f.vinculo as VinculoEdu,
        salario: f.salario,
      }))

      await upsertEduFuncionarios(escola.id, mes, ano, allFuncs)

      // Monta lista de itens
      const allItens = [
        ...materialPedagogico.filter((i) => i.nome.trim() && i.valor > 0).map((i) => ({ ...i, categoria: 'material_pedagogico' as CategoriaEduCusto })),
        ...merenda.filter((i) => i.nome.trim() && i.valor > 0).map((i) => ({ ...i, categoria: 'merenda' as CategoriaEduCusto })),
        ...despesasFixas.filter((i) => i.nome.trim() && i.valor > 0).map((i) => ({ ...i, categoria: 'despesa_fixa' as CategoriaEduCusto })),
        ...terceirizados.filter((i) => i.nome.trim() && i.valor > 0).map((i) => ({ ...i, categoria: 'terceirizado' as CategoriaEduCusto })),
      ]

      await upsertEduItensCusto(escola.id, mes, ano, allItens)

      markCompleted(STEPS.length)
      setSaved(true)
    } catch (e) {
      setSaveError('Erro ao salvar. Verifique sua conexão e tente novamente.')
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  // Totais
  const totalPedagogico = funcPedagogico.reduce((s, f) => s + f.salario, 0)
  const totalSocial = funcSocial.reduce((s, f) => s + f.salario, 0)
  const totalAdministrativo = funcAdministrativo.reduce((s, f) => s + f.salario, 0)
  const totalMatPedagogico = materialPedagogico.reduce((s, i) => s + i.valor, 0)
  const totalMerenda = merenda.reduce((s, i) => s + i.valor, 0)
  const totalDespFixas = despesasFixas.reduce((s, i) => s + i.valor, 0)
  const totalTerc = terceirizados.reduce((s, i) => s + i.valor, 0)
  const totalGeral = totalPedagogico + totalSocial + totalAdministrativo + totalMatPedagogico + totalMerenda + totalDespFixas + totalTerc
  const custoPorAluno = escola.num_alunos > 0 ? totalGeral / escola.num_alunos : 0

  // Loading
  if (loadingExistente) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center gap-3">
        <div className="animate-spin w-8 h-8 border-2 border-[#1066C6] border-t-transparent rounded-full" />
        <p className="text-sm text-gray-400">Carregando dados do período...</p>
      </div>
    )
  }

  // Tela de sucesso
  if (saved) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#1066C6] to-[#072F76] rounded-2xl flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {modoEdicao ? 'Lançamento atualizado!' : 'Lançamento salvo!'}
            </h2>
            <p className="text-gray-500 mt-2 text-sm">
              Dados de <strong>{escola.nome}</strong> referentes a{' '}
              <strong>{MESES_LABEL[mes]}/{ano}</strong>{' '}
              {modoEdicao ? 'atualizados' : 'salvos'} com sucesso.
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-2 border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Resumo</p>
            <SummaryRow label="Pedagógico (pessoal)" value={totalPedagogico} color="text-[#1066C6]" />
            <SummaryRow label="Social (pessoal)" value={totalSocial} color="text-[#1B93ED]" />
            <SummaryRow label="Administrativo (pessoal)" value={totalAdministrativo} color="text-[#072F76]" />
            <SummaryRow label="Material Pedagógico" value={totalMatPedagogico} color="text-orange-600" />
            <SummaryRow label="Merenda" value={totalMerenda} color="text-amber-600" />
            <SummaryRow label="Despesas Fixas" value={totalDespFixas} color="text-purple-600" />
            <SummaryRow label="Terceirizados" value={totalTerc} color="text-teal-600" />
            <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-sm">
              <span className="text-gray-700">Custo Total</span>
              <span className="text-[#1066C6]">{formatCurrency(totalGeral)}</span>
            </div>
            {custoPorAluno > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Custo por Aluno</span>
                <span className="font-semibold text-[#072F76]">{formatCurrency(custoPorAluno)}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={onBack} className="flex-1">
              Voltar ao Município
            </Button>
            <Button
              onClick={() => {
                setFuncPedagogico([])
                setFuncSocial([])
                setFuncAdministrativo([])
                setMaterialPedagogico([])
                setMerenda([])
                setDespesasFixas([])
                setTerceirizados([])
                setCurrentStep(1)
                setCompletedSteps(new Set())
                setSaved(false)
              }}
              className="flex-1 bg-[#1066C6] hover:bg-[#072F76]"
            >
              Novo Lançamento
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={handleBack}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-0.5">
                <span>{municipio.nome}</span>
                <span>›</span>
                <span className="truncate text-gray-500 font-medium">{escola.nome}</span>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-gray-900 leading-tight">
                  {modoEdicao ? 'Editar Lançamento' : 'Lançamento Mensal'}
                </h1>
                {modoEdicao && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                    Editando
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0 bg-gradient-to-br from-[#1066C6]/10 to-[#1066C6]/20 border border-[#1066C6]/20 rounded-xl px-4 py-2 text-center">
              <p className="text-xs text-[#1066C6] font-semibold leading-none">Período</p>
              <p className="text-sm font-bold text-[#072F76] mt-0.5">
                {MESES_LABEL[mes]}/{ano}
              </p>
            </div>
          </div>

          <StepIndicator
            steps={STEPS}
            currentStep={currentStep}
            completedSteps={completedSteps}
          />
        </div>
      </header>

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário */}
          <div className="lg:col-span-2">
            <Card>
              {currentStep === 1 && (
                <FuncionariosList
                  items={funcPedagogico}
                  onChange={setFuncPedagogico}
                  numEquipes={0}
                />
              )}
              {currentStep === 2 && (
                <FuncionariosList
                  items={funcSocial}
                  onChange={setFuncSocial}
                  numEquipes={0}
                />
              )}
              {currentStep === 3 && (
                <FuncionariosList
                  items={funcAdministrativo}
                  onChange={setFuncAdministrativo}
                  numEquipes={0}
                />
              )}
              {currentStep === 4 && (
                <DynamicItemList
                  title="Material Pedagógico"
                  description="Cadernos, livros, material de papelaria, toner, etc."
                  items={materialPedagogico}
                  onChange={setMaterialPedagogico}
                  namePlaceholder="Ex: Cadernos e lápis"
                  colorClass="bg-blue-50 border-blue-200"
                />
              )}
              {currentStep === 5 && (
                <DynamicItemList
                  title="Merenda Escolar"
                  description="Gêneros alimentícios (arroz, feijão, carnes, frutas, leite, etc.)"
                  items={merenda}
                  onChange={setMerenda}
                  namePlaceholder="Ex: Arroz e feijão"
                  colorClass="bg-amber-50 border-amber-200"
                />
              )}
              {currentStep === 6 && (
                <DynamicItemList
                  title="Despesas Fixas"
                  description="Energia elétrica, água, internet, telefone"
                  items={despesasFixas}
                  onChange={setDespesasFixas}
                  namePlaceholder="Ex: Energia elétrica"
                  colorClass="bg-purple-50 border-purple-200"
                />
              )}
              {currentStep === 7 && (
                <DynamicItemList
                  title="Serviços Terceirizados"
                  description="Vigilância, limpeza, manutenção predial, jardinagem"
                  items={terceirizados}
                  onChange={setTerceirizados}
                  namePlaceholder="Ex: Vigilância noturna"
                  colorClass="bg-teal-50 border-teal-200"
                />
              )}

              {/* Navegação */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                <Button variant="secondary" onClick={handleBack} type="button">
                  <ChevronLeft className="w-4 h-4" />
                  {currentStep === 1 ? 'Voltar' : 'Anterior'}
                </Button>

                <span className="text-xs text-gray-400 font-medium">
                  {currentStep} / {STEPS.length}
                </span>

                {currentStep < STEPS.length ? (
                  <Button onClick={handleNext} type="button" className="bg-[#1066C6] hover:bg-[#072F76]">
                    Próximo
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button onClick={handleSave} loading={saving} type="button" className="bg-[#1066C6] hover:bg-[#072F76]">
                    <Save className="w-4 h-4" />
                    Salvar Lançamento
                  </Button>
                )}
              </div>

              {saveError && (
                <p className="mt-3 text-sm text-red-600 text-center bg-red-50 rounded-xl px-3 py-2">
                  {saveError}
                </p>
              )}
            </Card>
          </div>

          {/* Painel lateral */}
          <div className="space-y-4">
            {/* Contexto */}
            <Card padding="sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Lançamento
              </p>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-400 text-xs">Município</span>
                  <p className="font-semibold text-gray-900">{municipio.nome}</p>
                  <p className="text-xs text-gray-400">{municipio.estado}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Escola</span>
                  <p className="font-semibold text-gray-900">{escola.nome}</p>
                  <p className="text-xs text-gray-400">{escola.endereco}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Período</span>
                  <p className="font-semibold text-[#1066C6]">
                    {MESES_LABEL[mes]}/{ano}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Alunos</span>
                  <p className="font-semibold text-gray-900">{escola.num_alunos}</p>
                </div>
              </div>
            </Card>

            {/* Resumo de custos */}
            <Card padding="sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Resumo de Custos
              </p>
              <div className="space-y-2 text-sm">
                <SummaryRow label="Pedagógico (pessoal)" value={totalPedagogico} color="text-[#1066C6]" />
                <SummaryRow label="Social (pessoal)" value={totalSocial} color="text-[#1B93ED]" />
                <SummaryRow label="Administrativo (pessoal)" value={totalAdministrativo} color="text-[#072F76]" />
                <SummaryRow label="Material Pedagógico" value={totalMatPedagogico} color="text-orange-600" />
                <SummaryRow label="Merenda" value={totalMerenda} color="text-amber-600" />
                <SummaryRow label="Despesas Fixas" value={totalDespFixas} color="text-purple-600" />
                <SummaryRow label="Terceirizados" value={totalTerc} color="text-teal-600" />
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-700">Total Geral</span>
                    <span className="text-[#1066C6]">{formatCurrency(totalGeral)}</span>
                  </div>
                </div>
                {custoPorAluno > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Custo/Aluno</span>
                    <span className="font-semibold text-[#072F76]">{formatCurrency(custoPorAluno)}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-4 mt-auto">
        <p className="text-center text-xs text-gray-400">
          SICM-Educação ·{' '}
          <a href="https://www.uel.br/projetos/nigep/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 hover:underline underline-offset-2 transition-colors">
            Desenvolvido por NIGEP
          </a>
        </p>
      </footer>
    </div>
  )
}

function SummaryRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={`font-semibold ${color}`}>{formatCurrency(value)}</span>
    </div>
  )
}

// Helpers de conversão
function toFuncItem(f: { nome: string; cargo: string; vinculo: string; salario: number }): FuncionarioItem {
  return { nome: f.nome, cargo: f.cargo, vinculo: f.vinculo as FuncionarioItem['vinculo'], salario: f.salario }
}

function toCostItem(i: { nome: string; valor: number }): CostItem {
  return { nome: i.nome, valor: i.valor }
}
