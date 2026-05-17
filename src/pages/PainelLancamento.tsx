import { useState, useEffect } from 'react'
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StepIndicator, type Step } from '@/components/form/StepIndicator'
import { Step3Funcionarios } from '@/components/steps/Step3Funcionarios'
import { Step4Producao } from '@/components/steps/Step4Producao'
import { Step5MateriaisConsumo } from '@/components/steps/Step5MateriaisConsumo'
import { Step6Insumos } from '@/components/steps/Step6Insumos'
import { Step7Administrativos, garantirFixos } from '@/components/steps/Step7Administrativos'
import { Step8Terceirizados } from '@/components/steps/Step8Terceirizados'
import { salvarLancamentoCompleto, getLancamentoCompleto } from '@/services/lancamentos'
import type { Municipio, UBS } from '@/types'
import type { FuncionarioItem } from '@/components/form/FuncionariosList'
import type { ProducaoItem } from '@/components/form/ProducaoList'
import type { CostItem } from '@/components/form/DynamicItemList'
import { formatCurrency } from '@/lib/utils'

const STEPS: Step[] = [
  { number: 1, title: 'Funcionários', icon: '👥' },
  { number: 2, title: 'Produção', icon: '📊' },
  { number: 3, title: 'Mat. Consumo', icon: '🛒' },
  { number: 4, title: 'Insumos', icon: '💊' },
  { number: 5, title: 'Administrativo', icon: '🏛️' },
  { number: 6, title: 'Terceirizados', icon: '🤝' },
]

const MESES_LABEL = [
  '','Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

function getEmptyData() {
  return {
    funcionarios: [] as FuncionarioItem[],
    producao: [] as ProducaoItem[],
    materiais_consumo: [] as CostItem[],
    insumos: [] as CostItem[],
    administrativos: garantirFixos([]),
    terceirizados: [] as CostItem[],
  }
}

interface PainelLancamentoProps {
  municipio: Municipio
  ubs: UBS
  mes: number
  ano: number
  onBack: () => void
}

export function PainelLancamento({ municipio, ubs, mes, ano, onBack }: PainelLancamentoProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [data, setData] = useState(getEmptyData)
  const [loadingExistente, setLoadingExistente] = useState(true)
  const [modoEdicao, setModoEdicao] = useState(false)

  // Pré-carrega dados existentes do período (edição)
  useEffect(() => {
    setLoadingExistente(true)
    getLancamentoCompleto(ubs.id, mes, ano)
      .then((existente) => {
        const temDados =
          existente.funcionarios.length > 0 ||
          existente.producao.length > 0 ||
          existente.materiais_consumo.length > 0 ||
          existente.insumos.length > 0 ||
          existente.administrativos.length > 0 ||
          existente.terceirizados.length > 0

        if (temDados) {
          setModoEdicao(true)
          setData({
            funcionarios: existente.funcionarios as FuncionarioItem[],
            producao: existente.producao as ProducaoItem[],
            materiais_consumo: existente.materiais_consumo as CostItem[],
            insumos: existente.insumos as CostItem[],
            administrativos: garantirFixos(existente.administrativos as CostItem[]),
            terceirizados: existente.terceirizados as CostItem[],
          })
        }
      })
      .catch(() => { /* sem dados anteriores, tudo bem */ })
      .finally(() => setLoadingExistente(false))
  }, [ubs.id, mes, ano])

  function markCompleted(step: number) {
    setCompletedSteps((prev) => new Set([...prev, step]))
  }

  function handleNext() {
    markCompleted(currentStep)
    setCurrentStep((s) => Math.min(s + 1, STEPS.length))
  }

  function handleBack() {
    if (currentStep === 1) {
      onBack()
    } else {
      setCurrentStep((s) => s - 1)
    }
  }

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    try {
      // Remove a propriedade `fixed` antes de salvar (é apenas controle de UI)
      const adminParaSalvar = data.administrativos.map(({ nome, valor }) => ({ nome, valor }))

      await salvarLancamentoCompleto({
        ubsId: ubs.id,
        mes,
        ano,
        funcionarios: data.funcionarios,
        producao: data.producao,
        materiais_consumo: data.materiais_consumo,
        insumos: data.insumos,
        administrativos: adminParaSalvar,
        terceirizados: data.terceirizados,
      })
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
  const totalSalarios = data.funcionarios.reduce((s, f) => s + f.salario, 0)
  const totalAtendimentos = data.producao.reduce((s, p) => s + p.quantidade_atendimentos, 0)
  const totalMateriais = data.materiais_consumo.reduce((s, i) => s + i.valor, 0)
  const totalInsumos = data.insumos.reduce((s, i) => s + i.valor, 0)
  const totalAdmin = data.administrativos.reduce((s, i) => s + i.valor, 0)
  const totalTerc = data.terceirizados.reduce((s, i) => s + i.valor, 0)
  const totalGeral = totalSalarios + totalMateriais + totalInsumos + totalAdmin + totalTerc

  // Loading inicial (carregando dados existentes)
  if (loadingExistente) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center gap-3">
        <div className="animate-spin w-8 h-8 border-2 border-[#01884d] border-t-transparent rounded-full" />
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
            <div className="w-20 h-20 bg-gradient-to-br from-[#01884d] to-[#016038] rounded-2xl flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {modoEdicao ? 'Lançamento atualizado!' : 'Lançamento salvo!'}
            </h2>
            <p className="text-gray-500 mt-2 text-sm">
              Dados de <strong>{ubs.nome}</strong> referentes a{' '}
              <strong>{MESES_LABEL[mes]}/{ano}</strong>{' '}
              {modoEdicao ? 'atualizados' : 'salvos'} com sucesso.
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-2 border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Resumo
            </p>
            <SummaryRow label="Pessoal" value={totalSalarios} color="text-indigo-600" />
            <SummaryRow label="Mat. Consumo" value={totalMateriais} color="text-orange-600" />
            <SummaryRow label="Insumos" value={totalInsumos} color="text-red-600" />
            <SummaryRow label="Administrativo" value={totalAdmin} color="text-purple-600" />
            <SummaryRow label="Terceirizados" value={totalTerc} color="text-teal-600" />
            <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-sm">
              <span className="text-gray-700">Custo Total</span>
              <span className="text-[#01884d]">{formatCurrency(totalGeral)}</span>
            </div>
            {totalAtendimentos > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Atendimentos</span>
                <span className="font-semibold text-emerald-700">
                  {totalAtendimentos.toLocaleString('pt-BR')}
                </span>
              </div>
            )}
            {totalAtendimentos > 0 && totalGeral > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Custo por atendimento</span>
                <span className="font-semibold text-gray-700">
                  {formatCurrency(totalGeral / totalAtendimentos)}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={onBack} className="flex-1">
              Voltar ao Município
            </Button>
            <Button
              onClick={() => {
                setData(getEmptyData())
                setCurrentStep(1)
                setCompletedSteps(new Set())
                setSaved(false)
              }}
              className="flex-1"
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
                <span className="truncate text-gray-500 font-medium">{ubs.nome}</span>
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
            <div className="shrink-0 bg-gradient-to-br from-[#01884d]/10 to-[#01884d]/20 border border-[#01884d]/20 rounded-xl px-4 py-2 text-center">
              <p className="text-xs text-[#01884d] font-semibold leading-none">Período</p>
              <p className="text-sm font-bold text-[#016038] mt-0.5">
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
                <Step3Funcionarios
                  funcionarios={data.funcionarios}
                  onChange={(items) => setData((d) => ({ ...d, funcionarios: items }))}
                  numEquipes={ubs.num_equipes_esf ?? 0}
                />
              )}
              {currentStep === 2 && (
                <Step4Producao
                  producao={data.producao}
                  onChange={(items) => setData((d) => ({ ...d, producao: items }))}
                  funcionarios={data.funcionarios}
                />
              )}
              {currentStep === 3 && (
                <Step5MateriaisConsumo
                  items={data.materiais_consumo}
                  onChange={(items) => setData((d) => ({ ...d, materiais_consumo: items }))}
                />
              )}
              {currentStep === 4 && (
                <Step6Insumos
                  items={data.insumos}
                  onChange={(items) => setData((d) => ({ ...d, insumos: items }))}
                />
              )}
              {currentStep === 5 && (
                <Step7Administrativos
                  items={data.administrativos}
                  onChange={(items) => setData((d) => ({ ...d, administrativos: items }))}
                />
              )}
              {currentStep === 6 && (
                <Step8Terceirizados
                  items={data.terceirizados}
                  onChange={(items) => setData((d) => ({ ...d, terceirizados: items }))}
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
                  <Button onClick={handleNext} type="button">
                    Próximo
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button onClick={handleSave} loading={saving} type="button">
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
                  <span className="text-gray-400 text-xs">UBS</span>
                  <p className="font-semibold text-gray-900">{ubs.nome}</p>
                  <p className="text-xs text-gray-400">{ubs.endereco}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Período</span>
                  <p className="font-semibold text-[#01884d]">
                    {MESES_LABEL[mes]}/{ano}
                  </p>
                </div>
              </div>
            </Card>

            {/* Resumo de custos */}
            <Card padding="sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Resumo de Custos
              </p>
              <div className="space-y-2 text-sm">
                <SummaryRow label="Pessoal" value={totalSalarios} color="text-indigo-600" />
                <SummaryRow label="Mat. Consumo" value={totalMateriais} color="text-orange-600" />
                <SummaryRow label="Insumos" value={totalInsumos} color="text-red-600" />
                <SummaryRow label="Administrativo" value={totalAdmin} color="text-purple-600" />
                <SummaryRow label="Terceirizados" value={totalTerc} color="text-teal-600" />
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-700">Total Geral</span>
                    <span className="text-[#01884d]">{formatCurrency(totalGeral)}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Produção */}
            {totalAtendimentos > 0 && (
              <Card padding="sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Produção
                </p>
                <div className="text-sm space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Atendimentos</span>
                    <span className="font-bold text-emerald-700">
                      {totalAtendimentos.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  {totalGeral > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Custo/atend.</span>
                      <span className="font-semibold text-gray-700">
                        {formatCurrency(totalGeral / totalAtendimentos)}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-4 mt-auto">
        <p className="text-center text-xs text-gray-400">
          Gestão de Custos UBS ·{' '}
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
