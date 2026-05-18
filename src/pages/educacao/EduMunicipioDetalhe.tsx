import { useState, useEffect } from 'react'
import {
  AlertTriangle, ArrowLeft, Calendar, ChevronDown, ChevronRight, ChevronUp,
  GraduationCap, Pencil, Plus, School, Trash2, Users,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { Municipio } from '@/types'
import type { Escola, NivelEnsino, ZonaEscola } from '@/types/educacao'
import { getEscolasByMunicipio, createEscola, deleteEscola } from '@/services/escolas'
import {
  getEduPeriodosLancados,
  deleteEduLancamentoCompleto,
  type EduPeriodoLancado,
} from '@/services/educacao-lancamentos'
import { formatCurrency } from '@/lib/utils'

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const currentYear = new Date().getFullYear()
const ANOS_OPTIONS = Array.from({ length: 6 }, (_, i) => {
  const y = currentYear - i
  return { value: String(y), label: String(y) }
})
const MESES_OPTIONS = MESES.map((m, i) => ({ value: String(i + 1), label: m }))

const NIVEL_LABELS: Record<NivelEnsino, string> = {
  infantil: 'Educação Infantil',
  fundamental_ai: 'Fundamental (Anos Iniciais)',
  fundamental_af: 'Fundamental (Anos Finais)',
  medio: 'Ensino Médio',
}

interface EduMunicipioDetalheProps {
  municipio: Municipio
  onBack: () => void
  onLancar: (escola: Escola, mes: number, ano: number) => void
}

// ─── Histórico de lançamentos de uma Escola ──────────────────────────────────
function HistoricoEscola({ escola, onEditar }: { escola: Escola; onEditar: (escola: Escola, mes: number, ano: number) => void }) {
  const [periodos, setPeriodos] = useState<EduPeriodoLancado[]>([])
  const [loading, setLoading] = useState(false)
  const [aberto, setAberto] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ mes: number; ano: number } | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function carregar() {
    setLoading(true)
    try {
      const lista = await getEduPeriodosLancados(escola.id)
      setPeriodos(lista)
    } finally {
      setLoading(false)
    }
  }

  function toggleAberto() {
    if (!aberto && periodos.length === 0) carregar()
    setAberto((v) => !v)
  }

  async function handleDelete(mes: number, ano: number) {
    setDeleting(true)
    try {
      await deleteEduLancamentoCompleto(escola.id, mes, ano)
      setPeriodos((prev) => prev.filter((p) => !(p.mes === mes && p.ano === ano)))
      setConfirmDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <button
        type="button"
        onClick={toggleAberto}
        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#1066C6] transition-colors"
      >
        {aberto ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {aberto ? 'Ocultar histórico' : 'Ver lançamentos anteriores'}
      </button>

      {aberto && (
        <div className="mt-3">
          {loading ? (
            <div className="flex items-center gap-2 py-2">
              <div className="animate-spin w-4 h-4 border-2 border-[#1066C6] border-t-transparent rounded-full" />
              <span className="text-xs text-gray-400">Carregando...</span>
            </div>
          ) : periodos.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">Nenhum lançamento encontrado para esta escola.</p>
          ) : (
            <div className="space-y-2">
              {periodos.map((p) => {
                const isConfirming = confirmDelete?.mes === p.mes && confirmDelete?.ano === p.ano
                return (
                  <div
                    key={`${p.ano}-${p.mes}`}
                    className={[
                      'rounded-xl border px-4 py-3 transition-colors',
                      isConfirming ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50 hover:bg-gray-100',
                    ].join(' ')}
                  >
                    {!isConfirming ? (
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                            <Calendar className="w-4 h-4 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              {MESES[p.mes - 1]}/{p.ano}
                            </p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs text-gray-500">{p.totalFuncionarios} serv.</span>
                              <span className="text-xs font-semibold text-[#1066C6]">{formatCurrency(p.totalCusto)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onEditar(escola, p.mes, p.ano)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1066C6] bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete({ mes: p.mes, ano: p.ano })}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Excluir
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 text-red-700">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <p className="text-sm font-medium">
                            Excluir lançamento de <strong>{MESES[p.mes - 1]}/{p.ano}</strong>?
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(null)}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.mes, p.ano)}
                            disabled={deleting}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                          >
                            {deleting
                              ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />}
                            Confirmar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export function EduMunicipioDetalhe({ municipio, onBack, onLancar }: EduMunicipioDetalheProps) {
  const [escolas, setEscolas] = useState<Escola[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [mes, setMes] = useState(String(new Date().getMonth() + 1))
  const [ano, setAno] = useState(String(currentYear))

  // Form state
  const [formNome, setFormNome] = useState('')
  const [formEndereco, setFormEndereco] = useState('')
  const [formNivel, setFormNivel] = useState<NivelEnsino>('fundamental_ai')
  const [formZona, setFormZona] = useState<ZonaEscola>('urbana')
  const [formAlunos, setFormAlunos] = useState('')
  const [formProfessores, setFormProfessores] = useState('')
  const [formFuncionarios, setFormFuncionarios] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Excluir escola
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingEscola, setDeletingEscola] = useState(false)

  useEffect(() => { loadEscolas() }, [municipio.id])

  async function loadEscolas() {
    setLoading(true)
    try {
      const data = await getEscolasByMunicipio(municipio.id)
      setEscolas(data)
    } finally {
      setLoading(false)
    }
  }

  function handleCancelar() {
    setShowForm(false)
    setFormNome('')
    setFormEndereco('')
    setFormAlunos('')
    setFormProfessores('')
    setFormFuncionarios('')
    setError('')
  }

  async function handleCreateEscola() {
    if (!formNome.trim()) { setError('Informe o nome da escola.'); return }
    if (!formEndereco.trim()) { setError('Informe o endereço.'); return }
    setSaving(true)
    setError('')
    try {
      await createEscola({
        nome: formNome.trim(),
        endereco: formEndereco.trim(),
        nivel_ensino: formNivel,
        zona: formZona,
        num_alunos: parseInt(formAlunos) || 0,
        num_professores: parseInt(formProfessores) || 0,
        num_funcionarios: parseInt(formFuncionarios) || 0,
        municipio_id: municipio.id,
      })
      handleCancelar()
      loadEscolas()
    } catch {
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteEscola(id: string) {
    setDeletingEscola(true)
    try {
      await deleteEscola(id)
      setEscolas((prev) => prev.filter((e) => e.id !== id))
      setConfirmDeleteId(null)
    } catch {
      // silencia
    } finally {
      setDeletingEscola(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 sm:p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wide">Município</p>
              <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight truncate">{municipio.nome}</h1>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-gray-400">{municipio.estado}</p>
                <p className="text-sm font-bold text-gray-700">{municipio.habitantes.toLocaleString('pt-BR')} hab.</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1066C6] to-[#072F76] flex items-center justify-center">
                <span className="text-xs font-bold text-white">{municipio.estado}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">

        {/* Seletor de período */}
        <Card padding="sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-8 h-8 rounded-lg bg-[#1066C6]/10 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-[#1066C6]" />
              </div>
              <span className="text-sm font-semibold text-gray-700">Novo lançamento — período:</span>
            </div>
            <div className="flex items-center gap-2">
              <Select value={mes} onChange={(e) => setMes(e.target.value)} options={MESES_OPTIONS} className="flex-1 sm:w-36" />
              <Select value={ano} onChange={(e) => setAno(e.target.value)} options={ANOS_OPTIONS} className="w-20 sm:w-24" />
            </div>
            <p className="text-xs text-gray-400 ml-auto hidden sm:block">Selecione o período antes de lançar dados</p>
          </div>
        </Card>

        {/* Escolas */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Escolas Municipais</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {escolas.length} escola{escolas.length !== 1 ? 's' : ''} cadastrada{escolas.length !== 1 ? 's' : ''}
              </p>
            </div>
            {!showForm && (
              <Button onClick={() => setShowForm(true)} type="button" variant="secondary">
                <Plus className="w-4 h-4" />
                Nova Escola
              </Button>
            )}
          </div>

          {/* Formulário nova escola */}
          {showForm && (
            <Card className="mb-4 border-[#1066C6]/20 bg-blue-50/30">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#1066C6] flex items-center justify-center">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800">Cadastrar Escola</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Input label="Nome da Escola" required value={formNome} onChange={(e) => setFormNome(e.target.value)} placeholder="E.M. Exemplo" />
                  <Input label="Endereço" required value={formEndereco} onChange={(e) => setFormEndereco(e.target.value)} placeholder="Rua, número, bairro" />
                  <Select
                    label="Nível de Ensino"
                    value={formNivel}
                    onChange={(e) => setFormNivel(e.target.value as NivelEnsino)}
                    options={[
                      { value: 'infantil', label: 'Educação Infantil' },
                      { value: 'fundamental_ai', label: 'Fund. Anos Iniciais' },
                      { value: 'fundamental_af', label: 'Fund. Anos Finais' },
                      { value: 'medio', label: 'Ensino Médio' },
                    ]}
                  />
                  <Select
                    label="Zona"
                    value={formZona}
                    onChange={(e) => setFormZona(e.target.value as ZonaEscola)}
                    options={[
                      { value: 'urbana', label: 'Urbana' },
                      { value: 'rural', label: 'Rural' },
                    ]}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input label="Nº de Alunos" value={formAlunos} onChange={(e) => setFormAlunos(e.target.value.replace(/\D/g, ''))} placeholder="Ex: 420" inputMode="numeric" />
                  <Input label="Nº de Professores" value={formProfessores} onChange={(e) => setFormProfessores(e.target.value.replace(/\D/g, ''))} placeholder="Ex: 22" inputMode="numeric" />
                  <Input label="Nº de Funcionários" value={formFuncionarios} onChange={(e) => setFormFuncionarios(e.target.value.replace(/\D/g, ''))} placeholder="Ex: 12" inputMode="numeric" />
                </div>
                {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
                <div className="flex gap-2 pt-1">
                  <Button variant="ghost" onClick={handleCancelar} type="button">Cancelar</Button>
                  <Button onClick={handleCreateEscola} loading={saving} type="button" className="bg-[#1066C6] hover:bg-[#072F76]">Salvar Escola</Button>
                </div>
              </div>
            </Card>
          )}

          {/* Lista de escolas */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin w-7 h-7 border-2 border-[#1066C6] border-t-transparent rounded-full" />
                <p className="text-sm text-gray-400">Carregando escolas...</p>
              </div>
            </div>
          ) : escolas.length === 0 ? (
            <Card className="text-center py-14">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
                <School className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-gray-600 font-semibold">Nenhuma escola cadastrada</p>
              <p className="text-sm text-gray-400 mt-1">Clique em "Nova Escola" para adicionar</p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {escolas.map((escola) => {
                const isConfirmando = confirmDeleteId === escola.id

                return (
                  <div
                    key={escola.id}
                    className={[
                      'bg-white border rounded-2xl shadow-sm transition-all duration-200',
                      isConfirmando ? 'border-red-200' : 'border-gray-100 hover:shadow-md',
                    ].join(' ')}
                  >
                    {/* Linha principal */}
                    <div className="flex items-center justify-between gap-4 p-5">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-11 h-11 bg-gradient-to-br from-[#1066C6]/10 to-[#1066C6]/20 rounded-xl flex items-center justify-center shrink-0">
                          <GraduationCap className="w-5 h-5 text-[#1066C6]" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">{escola.nome}</p>
                          <p className="text-sm text-gray-500 truncate mt-0.5">{escola.endereco}</p>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            <p className="text-xs text-[#1066C6] font-medium">
                              {NIVEL_LABELS[escola.nivel_ensino]}
                            </p>
                            <p className="text-xs text-gray-500">
                              <Users className="w-3 h-3 inline mr-0.5" />
                              {escola.num_alunos} alunos • {escola.num_professores} prof.
                            </p>
                            <p className="text-xs text-gray-400">
                              {escola.zona === 'urbana' ? 'Urbana' : 'Rural'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {!isConfirmando && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => { setConfirmDeleteId(escola.id) }}
                            title="Excluir escola"
                            className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onLancar(escola, parseInt(mes), parseInt(ano))}
                            className="flex items-center gap-2 px-4 py-2 bg-[#1066C6] text-white text-sm font-semibold rounded-xl hover:bg-[#072F76] transition-colors shadow-sm"
                          >
                            Lançar dados
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Confirmar exclusão */}
                    {isConfirmando && (
                      <div className="px-5 pb-4 pt-3 border-t border-red-100 bg-red-50 rounded-b-2xl">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2 text-red-700">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <p className="text-sm font-medium">
                              Excluir <strong>{escola.nome}</strong> e todos os dados?
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEscola(escola.id)}
                              disabled={deletingEscola}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                              {deletingEscola
                                ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : <Trash2 className="w-3.5 h-3.5" />}
                              Confirmar exclusão
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Histórico de lançamentos */}
                    {!isConfirmando && (
                      <div className="px-5 pb-4">
                        <HistoricoEscola escola={escola} onEditar={onLancar} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
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
