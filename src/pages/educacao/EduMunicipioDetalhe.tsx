import { useState, useEffect } from 'react'
import { ArrowLeft, GraduationCap, MapPin, Plus, School, Trash2, Users } from 'lucide-react'
import type { Municipio } from '@/types'
import type { Escola, NivelEnsino, ZonaEscola } from '@/types/educacao'
import { getEscolasByMunicipio, createEscola, deleteEscola } from '@/services/escolas'

interface EduMunicipioDetalheProps {
  municipio: Municipio
  onBack: () => void
  onLancar: (escola: Escola, mes: number, ano: number) => void
}

const NIVEL_LABELS: Record<NivelEnsino, string> = {
  infantil: 'Educação Infantil',
  fundamental_ai: 'Fundamental (Anos Iniciais)',
  fundamental_af: 'Fundamental (Anos Finais)',
  medio: 'Ensino Médio',
}

export function EduMunicipioDetalhe({ municipio, onBack, onLancar }: EduMunicipioDetalheProps) {
  const [escolas, setEscolas] = useState<Escola[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [ano, setAno] = useState(new Date().getFullYear())

  // Form state
  const [formNome, setFormNome] = useState('')
  const [formEndereco, setFormEndereco] = useState('')
  const [formNivel, setFormNivel] = useState<NivelEnsino>('fundamental_ai')
  const [formZona, setFormZona] = useState<ZonaEscola>('urbana')
  const [formAlunos, setFormAlunos] = useState(0)
  const [formProfessores, setFormProfessores] = useState(0)
  const [formFuncionarios, setFormFuncionarios] = useState(0)

  useEffect(() => {
    loadEscolas()
  }, [municipio.id])

  async function loadEscolas() {
    setLoading(true)
    try {
      const data = await getEscolasByMunicipio(municipio.id)
      setEscolas(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateEscola(e: React.FormEvent) {
    e.preventDefault()
    try {
      await createEscola({
        nome: formNome,
        endereco: formEndereco,
        nivel_ensino: formNivel,
        zona: formZona,
        num_alunos: formAlunos,
        num_professores: formProfessores,
        num_funcionarios: formFuncionarios,
        municipio_id: municipio.id,
      })
      setShowForm(false)
      setFormNome('')
      setFormEndereco('')
      setFormAlunos(0)
      setFormProfessores(0)
      setFormFuncionarios(0)
      loadEscolas()
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDeleteEscola(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta escola e todos os dados associados?')) return
    try {
      await deleteEscola(id)
      loadEscolas()
    } catch (err) {
      console.error(err)
    }
  }

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
            <MapPin className="w-5 h-5 text-[#1066C6]" />
            {municipio.nome}
          </h1>
          <p className="text-xs text-gray-400">{municipio.estado} • {municipio.habitantes?.toLocaleString('pt-BR')} habitantes</p>
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
          <School className="w-4 h-4 text-[#1066C6]" />
          Escolas ({escolas.length})
        </h2>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 bg-[#1066C6] hover:bg-[#072F76] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nova Escola
        </button>
      </div>

      {/* Formulário de nova escola */}
      {showForm && (
        <form onSubmit={handleCreateEscola} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Cadastrar Nova Escola</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Nome da Escola *</label>
              <input
                type="text"
                required
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1066C6]/20 focus:border-[#1066C6] outline-none"
                placeholder="E.M. Exemplo"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Endereço *</label>
              <input
                type="text"
                required
                value={formEndereco}
                onChange={(e) => setFormEndereco(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1066C6]/20 focus:border-[#1066C6] outline-none"
                placeholder="Rua..."
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Nível de Ensino</label>
              <select
                value={formNivel}
                onChange={(e) => setFormNivel(e.target.value as NivelEnsino)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1066C6]/20 focus:border-[#1066C6] outline-none"
              >
                <option value="infantil">Educação Infantil</option>
                <option value="fundamental_ai">Fundamental (Anos Iniciais)</option>
                <option value="fundamental_af">Fundamental (Anos Finais)</option>
                <option value="medio">Ensino Médio</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Zona</label>
              <select
                value={formZona}
                onChange={(e) => setFormZona(e.target.value as ZonaEscola)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1066C6]/20 focus:border-[#1066C6] outline-none"
              >
                <option value="urbana">Urbana</option>
                <option value="rural">Rural</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Nº de Alunos</label>
              <input
                type="number"
                min={0}
                value={formAlunos}
                onChange={(e) => setFormAlunos(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1066C6]/20 focus:border-[#1066C6] outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Nº de Professores</label>
              <input
                type="number"
                min={0}
                value={formProfessores}
                onChange={(e) => setFormProfessores(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1066C6]/20 focus:border-[#1066C6] outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Nº de Funcionários</label>
              <input
                type="number"
                min={0}
                value={formFuncionarios}
                onChange={(e) => setFormFuncionarios(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1066C6]/20 focus:border-[#1066C6] outline-none"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              className="bg-[#1066C6] hover:bg-[#072F76] text-white text-xs font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista de escolas */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando escolas...</div>
      ) : escolas.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200">
          <School className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Nenhuma escola cadastrada</p>
          <p className="text-xs text-gray-300 mt-1">Clique em "Nova Escola" para começar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {escolas.map((escola) => (
            <div
              key={escola.id}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:border-[#1066C6]/30 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-[#AECBE6]/30 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5 text-[#1066C6]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{escola.nome}</p>
                    <p className="text-xs text-gray-400">
                      {NIVEL_LABELS[escola.nivel_ensino]} • {escola.zona === 'urbana' ? 'Urbana' : 'Rural'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-gray-500">
                      <Users className="w-3 h-3 inline mr-1" />
                      {escola.num_alunos} alunos • {escola.num_professores} prof.
                    </p>
                  </div>

                  {/* Seletor de período + botão lançar */}
                  <div className="flex items-center gap-2">
                    <select
                      value={mes}
                      onChange={(e) => setMes(Number(e.target.value))}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-[#1066C6]/20 outline-none"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {(i + 1).toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                    <select
                      value={ano}
                      onChange={(e) => setAno(Number(e.target.value))}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-[#1066C6]/20 outline-none"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => onLancar(escola, mes, ano)}
                      className="bg-[#1066C6] hover:bg-[#072F76] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Lançar
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteEscola(escola.id)}
                    className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                    title="Excluir escola"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
