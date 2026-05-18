import { useEffect, useState } from 'react'
import { AlertTriangle, Building2, ChevronRight, MapPin, Pencil, Plus, Trash2, Users, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { getMunicipios, createMunicipio, updateMunicipio } from '@/services/municipios'
import { getUBSByMunicipio } from '@/services/ubs'
import { supabase } from '@/lib/supabase'
import { MUNICIPIOS_PR } from '@/data/municipiosPR'
import type { Municipio } from '@/types'

const ESTADOS = [
  { value: 'PR', label: 'PR — Paraná' },
  { value: 'AC', label: 'AC — Acre (em breve)', disabled: true },
  { value: 'AL', label: 'AL — Alagoas (em breve)', disabled: true },
  { value: 'AM', label: 'AM — Amazonas (em breve)', disabled: true },
  { value: 'AP', label: 'AP — Amapá (em breve)', disabled: true },
  { value: 'BA', label: 'BA — Bahia (em breve)', disabled: true },
  { value: 'CE', label: 'CE — Ceará (em breve)', disabled: true },
  { value: 'DF', label: 'DF — Distrito Federal (em breve)', disabled: true },
  { value: 'ES', label: 'ES — Espírito Santo (em breve)', disabled: true },
  { value: 'GO', label: 'GO — Goiás (em breve)', disabled: true },
  { value: 'MA', label: 'MA — Maranhão (em breve)', disabled: true },
  { value: 'MG', label: 'MG — Minas Gerais (em breve)', disabled: true },
  { value: 'MS', label: 'MS — Mato Grosso do Sul (em breve)', disabled: true },
  { value: 'MT', label: 'MT — Mato Grosso (em breve)', disabled: true },
  { value: 'PA', label: 'PA — Pará (em breve)', disabled: true },
  { value: 'PB', label: 'PB — Paraíba (em breve)', disabled: true },
  { value: 'PE', label: 'PE — Pernambuco (em breve)', disabled: true },
  { value: 'PI', label: 'PI — Piauí (em breve)', disabled: true },
  { value: 'RJ', label: 'RJ — Rio de Janeiro (em breve)', disabled: true },
  { value: 'RN', label: 'RN — Rio Grande do Norte (em breve)', disabled: true },
  { value: 'RO', label: 'RO — Rondônia (em breve)', disabled: true },
  { value: 'RR', label: 'RR — Roraima (em breve)', disabled: true },
  { value: 'RS', label: 'RS — Rio Grande do Sul (em breve)', disabled: true },
  { value: 'SC', label: 'SC — Santa Catarina (em breve)', disabled: true },
  { value: 'SE', label: 'SE — Sergipe (em breve)', disabled: true },
  { value: 'SP', label: 'SP — São Paulo (em breve)', disabled: true },
  { value: 'TO', label: 'TO — Tocantins (em breve)', disabled: true },
]

const MUNICIPIOS_POR_ESTADO: Record<string, { value: string; label: string }[]> = {
  PR: MUNICIPIOS_PR.map((m) => ({ value: m, label: m })),
}

interface MunicipioComContagem extends Municipio {
  totalUbs: number
}

interface HomeMunicipiosProps {
  onSelectMunicipio: (municipio: Municipio) => void
  onOpenDashboard: () => void
}

export function HomeMunicipios({ onSelectMunicipio }: HomeMunicipiosProps) {
  const [municipios, setMunicipios] = useState<MunicipioComContagem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // Novo município
  const [estado, setEstado] = useState('')
  const [nomeMunicipio, setNomeMunicipio] = useState('')
  const [habitantes, setHabitantes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Editar população
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editHabitantes, setEditHabitantes] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState('')

  // Excluir município
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const municipiosDoEstado = estado ? (MUNICIPIOS_POR_ESTADO[estado] ?? []) : []

  async function loadMunicipios() {
    setLoading(true)
    try {
      const lista = await getMunicipios()
      const comContagem = await Promise.all(
        lista.map(async (m) => {
          const ubs = await getUBSByMunicipio(m.id)
          return { ...m, totalUbs: ubs.length }
        })
      )
      setMunicipios(comContagem)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadMunicipios() }, [])

  function handleEstadoChange(uf: string) {
    setEstado(uf)
    setNomeMunicipio('')
  }

  function handleCancelar() {
    setShowForm(false)
    setEstado('')
    setNomeMunicipio('')
    setHabitantes('')
    setError('')
  }

  async function handleCreate() {
    if (!estado) { setError('Selecione o estado.'); return }
    if (!nomeMunicipio) { setError('Selecione o município.'); return }
    const hab = parseInt(habitantes.replace(/\D/g, ''), 10)
    if (!hab || hab <= 0) { setError('Informe o número de habitantes.'); return }
    setSaving(true)
    setError('')
    try {
      const novo = await createMunicipio({ nome: nomeMunicipio, estado, habitantes: hab })
      handleCancelar()
      await loadMunicipios()
      onSelectMunicipio(novo)
    } catch {
      setError('Erro ao salvar. Tente novamente.')
      setSaving(false)
    }
  }

  function iniciarEdicao(m: MunicipioComContagem) {
    setEditandoId(m.id)
    setEditHabitantes(String(m.habitantes))
    setEditError('')
    setConfirmDeleteId(null)
  }

  function cancelarEdicao() {
    setEditandoId(null)
    setEditHabitantes('')
    setEditError('')
  }

  async function salvarEdicao(m: MunicipioComContagem) {
    const hab = parseInt(editHabitantes.replace(/\D/g, ''), 10)
    if (!hab || hab <= 0) { setEditError('Informe um número válido.'); return }
    setSavingEdit(true)
    setEditError('')
    try {
      const atualizado = await updateMunicipio(m.id, { habitantes: hab })
      setMunicipios((prev) =>
        prev.map((x) => x.id === m.id ? { ...x, habitantes: atualizado.habitantes } : x)
      )
      cancelarEdicao()
    } catch {
      setEditError('Erro ao salvar.')
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      // Apenas remove o município — UBS e lançamentos ficam no banco
      const { error } = await supabase.from('municipios').delete().eq('id', id)
      if (error) throw error
      setMunicipios((prev) => prev.filter((m) => m.id !== id))
      setConfirmDeleteId(null)
    } catch {
      // silencia — pode ter FK constraint
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">Bem-vindo(a)!</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 hidden sm:block">
                Selecione um município para gerenciar suas UBS e lançamentos de custos
              </p>
            </div>
            <Button onClick={() => setShowForm(true)} type="button" size="md" className="shrink-0">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Município</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-8">
        {/* Stats rápidas */}
        {municipios.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Municípios</p>
              <p className="text-2xl sm:text-3xl font-bold text-[#01884d]">{municipios.length}</p>
              <p className="text-xs text-gray-400 mt-1">cadastrados</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total UBS</p>
              <p className="text-2xl sm:text-3xl font-bold text-[#004aad]">
                {municipios.reduce((s, m) => s + m.totalUbs, 0)}
              </p>
              <p className="text-xs text-gray-400 mt-1">unidades cadastradas</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 col-span-2 sm:col-span-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Habitantes</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800">
                {municipios.reduce((s, m) => s + m.habitantes, 0).toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-gray-400 mt-1">total coberto</p>
            </div>
          </div>
        )}

        {/* Formulário novo município */}
        {showForm && (
          <Card className="mb-6 border-[#01884d]/20 bg-green-50/30">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-[#01884d] flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-gray-800">Cadastrar Município</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="Estado (UF)"
                  required
                  value={estado}
                  onChange={(e) => handleEstadoChange(e.target.value)}
                  options={ESTADOS}
                  placeholder="Selecione"
                />
                <Select
                  label="Município"
                  required
                  value={nomeMunicipio}
                  onChange={(e) => setNomeMunicipio(e.target.value)}
                  options={municipiosDoEstado}
                  placeholder={!estado ? 'Selecione o estado primeiro' : 'Selecione o município'}
                  disabled={!estado || municipiosDoEstado.length === 0}
                />
                <Input
                  label="Habitantes"
                  required
                  type="text"
                  inputMode="numeric"
                  value={habitantes}
                  onChange={(e) => setHabitantes(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ex: 50000"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
              )}
              <div className="flex gap-2 pt-1">
                <Button variant="ghost" onClick={handleCancelar} type="button">Cancelar</Button>
                <Button onClick={handleCreate} loading={saving} type="button">Salvar e Continuar</Button>
              </div>
            </div>
          </Card>
        )}

        {/* Lista */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Municípios cadastrados</h2>
            <p className="text-sm text-gray-500 mt-0.5">Clique em um município para gerenciar suas UBS</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin w-8 h-8 border-2 border-[#01884d] border-t-transparent rounded-full" />
              <p className="text-sm text-gray-400">Carregando municípios...</p>
            </div>
          </div>
        ) : municipios.length === 0 ? (
          <Card className="text-center py-16">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <Building2 className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-600 font-semibold">Nenhum município cadastrado</p>
            <p className="text-sm text-gray-400 mt-1">Clique em "Novo Município" para começar</p>
          </Card>
        ) : (
          <div className="grid gap-3">
            {municipios.map((m) => {
              const isEditando = editandoId === m.id
              const isConfirmando = confirmDeleteId === m.id

              return (
                <div
                  key={m.id}
                  className={[
                    'bg-white border rounded-2xl shadow-sm transition-all duration-200',
                    isConfirmando ? 'border-red-200' : 'border-gray-100 hover:shadow-md',
                  ].join(' ')}
                >
                  {/* Linha principal */}
                  <div className="flex items-center justify-between gap-4 p-5">
                    {/* Clicável para entrar no município */}
                    <button
                      type="button"
                      onClick={() => !isEditando && !isConfirmando && onSelectMunicipio(m)}
                      className="flex items-center gap-4 flex-1 min-w-0 text-left group"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-[#01884d] to-[#016038] rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                        <span className="text-sm font-bold text-white">{m.estado}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 group-hover:text-[#01884d] transition-colors">
                          {m.nome}
                        </p>
                        <div className="flex items-center gap-4 mt-1.5">
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Users className="w-3 h-3 text-gray-400" />
                            {m.habitantes.toLocaleString('pt-BR')} hab.
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {m.totalUbs} UBS
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Ações */}
                    {!isConfirmando && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => iniciarEdicao(m)}
                          title="Editar população"
                          className="p-2 rounded-xl text-gray-400 hover:text-[#004aad] hover:bg-blue-50 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setConfirmDeleteId(m.id); cancelarEdicao() }}
                          title="Excluir município"
                          className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectMunicipio(m)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-[#01884d] text-white text-xs font-semibold rounded-xl hover:bg-[#016038] transition-colors shadow-sm"
                        >
                          Gerenciar
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Painel editar população */}
                  {isEditando && (
                    <div className="px-5 pb-4 border-t border-gray-100 pt-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Atualizar população
                      </p>
                      <div className="flex items-end gap-2">
                        <div className="w-48">
                          <Input
                            label="Habitantes"
                            type="text"
                            inputMode="numeric"
                            value={editHabitantes}
                            onChange={(e) => setEditHabitantes(e.target.value.replace(/\D/g, ''))}
                            placeholder="Ex: 52000"
                            autoFocus
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => salvarEdicao(m)}
                          disabled={savingEdit}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#01884d] rounded-xl hover:bg-[#016038] disabled:opacity-50 transition-colors"
                        >
                          {savingEdit
                            ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            : <Check className="w-3.5 h-3.5" />}
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={cancelarEdicao}
                          className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          Cancelar
                        </button>
                      </div>
                      {editError && (
                        <p className="text-xs text-red-600 mt-1">{editError}</p>
                      )}
                    </div>
                  )}

                  {/* Painel confirmar exclusão */}
                  {isConfirmando && (
                    <div className="px-5 pb-4 pt-3 border-t border-red-100 bg-red-50 rounded-b-2xl">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 text-red-700">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <p className="text-sm font-medium">
                            Excluir <strong>{m.nome}</strong>? Esta ação não pode ser desfeita.
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
                            onClick={() => handleDelete(m.id)}
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
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
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
