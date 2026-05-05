import { useEffect, useState } from 'react'
import {
  AlertTriangle, ArrowLeft, Calendar, Check,
  ChevronDown, ChevronRight, ChevronUp,
  MapPin, Pencil, Plus, Trash2, X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { getUBSByMunicipio, createUBS, updateUBS, deleteUBS } from '@/services/ubs'
import {
  getPeriodosLancados,
  deleteLancamentoCompleto,
  type PeriodoLancado,
} from '@/services/lancamentos'
import { formatCurrency } from '@/lib/utils'
import type { Municipio, UBS } from '@/types'

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

const currentYear = new Date().getFullYear()
const ANOS_OPTIONS = Array.from({ length: 6 }, (_, i) => {
  const y = currentYear - i
  return { value: String(y), label: String(y) }
})
const MESES_OPTIONS = MESES.map((m, i) => ({ value: String(i + 1), label: m }))

interface MunicipioDetalheProps {
  municipio: Municipio
  onBack: () => void
  onLancar: (ubs: UBS, mes: number, ano: number) => void
}

// ─── Histórico de lançamentos de uma UBS ─────────────────────────────────────
interface HistoricoUBSProps {
  ubs: UBS
  onEditar: (ubs: UBS, mes: number, ano: number) => void
}

function HistoricoUBS({ ubs, onEditar }: HistoricoUBSProps) {
  const [periodos, setPeriodos] = useState<PeriodoLancado[]>([])
  const [loading, setLoading] = useState(false)
  const [aberto, setAberto] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ mes: number; ano: number } | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function carregar() {
    setLoading(true)
    try {
      const lista = await getPeriodosLancados(ubs.id)
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
      await deleteLancamentoCompleto(ubs.id, mes, ano)
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
        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#01884d] transition-colors"
      >
        {aberto ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {aberto ? 'Ocultar histórico' : 'Ver lançamentos anteriores'}
      </button>

      {aberto && (
        <div className="mt-3">
          {loading ? (
            <div className="flex items-center gap-2 py-2">
              <div className="animate-spin w-4 h-4 border-2 border-[#01884d] border-t-transparent rounded-full" />
              <span className="text-xs text-gray-400">Carregando...</span>
            </div>
          ) : periodos.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">Nenhum lançamento encontrado para esta UBS.</p>
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
                              <span className="text-xs text-gray-500">{p.totalAtendimentos.toLocaleString('pt-BR')} atend.</span>
                              <span className="text-xs font-semibold text-[#01884d]">{formatCurrency(p.totalCusto)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onEditar(ubs, p.mes, p.ano)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#004aad] bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors"
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
                            Excluir lançamento de <strong>{MESES[p.mes - 1]}/{p.ano}</strong>? Esta ação não pode ser desfeita.
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
                            Confirmar exclusão
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
export function MunicipioDetalhe({ municipio, onBack, onLancar }: MunicipioDetalheProps) {
  const [ubsList, setUbsList] = useState<UBS[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [mes, setMes] = useState(String(new Date().getMonth() + 1))
  const [ano, setAno] = useState(String(currentYear))

  // Criar UBS
  const [nome, setNome] = useState('')
  const [endereco, setEndereco] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Editar UBS
  const [editandoUbsId, setEditandoUbsId] = useState<string | null>(null)
  const [editNome, setEditNome] = useState('')
  const [editEndereco, setEditEndereco] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState('')

  // Excluir UBS
  const [confirmDeleteUbsId, setConfirmDeleteUbsId] = useState<string | null>(null)
  const [deletingUbs, setDeletingUbs] = useState(false)

  async function loadUBS() {
    setLoading(true)
    try {
      const lista = await getUBSByMunicipio(municipio.id)
      setUbsList(lista)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUBS() }, [municipio.id])

  async function handleCreate() {
    if (!nome.trim()) { setError('Informe o nome da UBS.'); return }
    if (!endereco.trim()) { setError('Informe o endereço.'); return }
    setSaving(true)
    setError('')
    try {
      const nova = await createUBS({ nome: nome.trim(), endereco: endereco.trim(), municipio_id: municipio.id })
      setShowForm(false)
      setNome('')
      setEndereco('')
      setUbsList((prev) => [...prev, nova].sort((a, b) => a.nome.localeCompare(b.nome)))
    } catch {
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  function iniciarEdicaoUbs(ubs: UBS) {
    setEditandoUbsId(ubs.id)
    setEditNome(ubs.nome)
    setEditEndereco(ubs.endereco)
    setEditError('')
    setConfirmDeleteUbsId(null)
  }

  function cancelarEdicaoUbs() {
    setEditandoUbsId(null)
    setEditNome('')
    setEditEndereco('')
    setEditError('')
  }

  async function salvarEdicaoUbs(ubs: UBS) {
    if (!editNome.trim()) { setEditError('Informe o nome.'); return }
    if (!editEndereco.trim()) { setEditError('Informe o endereço.'); return }
    setSavingEdit(true)
    setEditError('')
    try {
      const atualizada = await updateUBS(ubs.id, { nome: editNome.trim(), endereco: editEndereco.trim() })
      setUbsList((prev) => prev.map((u) => u.id === ubs.id ? atualizada : u))
      cancelarEdicaoUbs()
    } catch {
      setEditError('Erro ao salvar.')
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleDeleteUbs(id: string) {
    setDeletingUbs(true)
    try {
      await deleteUBS(id)
      setUbsList((prev) => prev.filter((u) => u.id !== id))
      setConfirmDeleteUbsId(null)
    } catch {
      // silencia FK constraint
    } finally {
      setDeletingUbs(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Município</p>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">{municipio.nome}</h1>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-gray-400">{municipio.estado}</p>
                <p className="text-sm font-bold text-gray-700">{municipio.habitantes.toLocaleString('pt-BR')} hab.</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#01884d] to-[#016038] flex items-center justify-center">
                <span className="text-xs font-bold text-white">{municipio.estado}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 space-y-6">

        {/* Seletor de período */}
        <Card padding="sm">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-8 h-8 rounded-lg bg-[#01884d]/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-[#01884d]" />
              </div>
              <span className="text-sm font-semibold text-gray-700">Novo lançamento — período:</span>
            </div>
            <div className="flex items-center gap-2">
              <Select value={mes} onChange={(e) => setMes(e.target.value)} options={MESES_OPTIONS} className="w-36" />
              <Select value={ano} onChange={(e) => setAno(e.target.value)} options={ANOS_OPTIONS} className="w-24" />
            </div>
            <p className="text-xs text-gray-400 ml-auto hidden sm:block">Selecione o período antes de lançar dados</p>
          </div>
        </Card>

        {/* UBS */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Unidades Básicas de Saúde</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {ubsList.length} UBS cadastrada{ubsList.length !== 1 ? 's' : ''}
              </p>
            </div>
            {!showForm && (
              <Button onClick={() => setShowForm(true)} type="button" variant="secondary">
                <Plus className="w-4 h-4" />
                Nova UBS
              </Button>
            )}
          </div>

          {/* Formulário nova UBS */}
          {showForm && (
            <Card className="mb-4 border-[#01884d]/20 bg-green-50/30">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#01884d] flex items-center justify-center">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800">Cadastrar UBS</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Nome da UBS" required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: UBS Centro, UBS Vila Nova..." />
                  <Input label="Endereço" required value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, número, bairro..." />
                </div>
                {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
                <div className="flex gap-2 pt-1">
                  <Button variant="ghost" onClick={() => { setShowForm(false); setError('') }} type="button">Cancelar</Button>
                  <Button onClick={handleCreate} loading={saving} type="button">Salvar UBS</Button>
                </div>
              </div>
            </Card>
          )}

          {/* Lista de UBS */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin w-7 h-7 border-2 border-[#01884d] border-t-transparent rounded-full" />
                <p className="text-sm text-gray-400">Carregando UBS...</p>
              </div>
            </div>
          ) : ubsList.length === 0 ? (
            <Card className="text-center py-14">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
                <MapPin className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-gray-600 font-semibold">Nenhuma UBS cadastrada</p>
              <p className="text-sm text-gray-400 mt-1">Clique em "Nova UBS" para adicionar</p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {ubsList.map((ubs) => {
                const isEditando = editandoUbsId === ubs.id
                const isConfirmando = confirmDeleteUbsId === ubs.id

                return (
                  <div
                    key={ubs.id}
                    className={[
                      'bg-white border rounded-2xl shadow-sm transition-all duration-200',
                      isConfirmando ? 'border-red-200' : 'border-gray-100 hover:shadow-md',
                    ].join(' ')}
                  >
                    {/* Linha principal */}
                    <div className="flex items-center justify-between gap-4 p-5">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-11 h-11 bg-gradient-to-br from-[#01884d]/10 to-[#01884d]/20 rounded-xl flex items-center justify-center shrink-0">
                          <MapPin className="w-5 h-5 text-[#01884d]" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">{ubs.nome}</p>
                          <p className="text-sm text-gray-500 truncate mt-0.5">{ubs.endereco}</p>
                        </div>
                      </div>

                      {!isConfirmando && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => iniciarEdicaoUbs(ubs)}
                            title="Editar UBS"
                            className="p-2 rounded-xl text-gray-400 hover:text-[#004aad] hover:bg-blue-50 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => { setConfirmDeleteUbsId(ubs.id); cancelarEdicaoUbs() }}
                            title="Excluir UBS"
                            className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onLancar(ubs, parseInt(mes), parseInt(ano))}
                            className="flex items-center gap-2 px-4 py-2 bg-[#01884d] text-white text-sm font-semibold rounded-xl hover:bg-[#016038] transition-colors shadow-sm"
                          >
                            Lançar dados
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Painel editar UBS */}
                    {isEditando && (
                      <div className="px-5 pb-4 border-t border-gray-100 pt-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Editar dados da UBS</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          <Input
                            label="Nome da UBS"
                            value={editNome}
                            onChange={(e) => setEditNome(e.target.value)}
                            autoFocus
                          />
                          <Input
                            label="Endereço"
                            value={editEndereco}
                            onChange={(e) => setEditEndereco(e.target.value)}
                          />
                        </div>
                        {editError && <p className="text-xs text-red-600 mb-2">{editError}</p>}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => salvarEdicaoUbs(ubs)}
                            disabled={savingEdit}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#01884d] rounded-xl hover:bg-[#016038] disabled:opacity-50 transition-colors"
                          >
                            {savingEdit
                              ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              : <Check className="w-3.5 h-3.5" />}
                            Salvar alterações
                          </button>
                          <button
                            type="button"
                            onClick={cancelarEdicaoUbs}
                            className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Painel confirmar exclusão UBS */}
                    {isConfirmando && (
                      <div className="px-5 pb-4 pt-3 border-t border-red-100 bg-red-50 rounded-b-2xl">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2 text-red-700">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <p className="text-sm font-medium">
                              Excluir <strong>{ubs.nome}</strong>? Os lançamentos associados também serão removidos.
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteUbsId(null)}
                              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUbs(ubs.id)}
                              disabled={deletingUbs}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                              {deletingUbs
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
                        <HistoricoUBS ubs={ubs} onEditar={(u, m, a) => onLancar(u, m, a)} />
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
          Gestão de Custos UBS ·{' '}
          <a href="https://www.uel.br/projetos/nigep/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 hover:underline underline-offset-2 transition-colors">
            Desenvolvido por NIGEP
          </a>
        </p>
      </footer>
    </div>
  )
}
