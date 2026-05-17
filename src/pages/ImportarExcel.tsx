import { useEffect, useState } from 'react'
import {
  AlertTriangle, ArrowLeft, CheckCircle2, Download,
  FileSpreadsheet, Upload, X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { getMunicipios } from '@/services/municipios'
import { getUBSByMunicipio } from '@/services/ubs'
import {
  parseExcel,
  validateImport,
  importarDados,
  downloadModelo,
  type ImportError,
  type ImportResult,
} from '@/services/importExcel'
import type { Municipio, UBS } from '@/types'

const MESES = [
  { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },   { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },    { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },   { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },{ value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },{ value: '12', label: 'Dezembro' },
]
const currentYear = new Date().getFullYear()
const ANOS = Array.from({ length: 6 }, (_, i) => ({
  value: String(currentYear - i),
  label: String(currentYear - i),
}))

interface ImportarExcelProps {
  onBack: () => void
}

export function ImportarExcel({ onBack }: ImportarExcelProps) {
  // Seleção de contexto
  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [ubsList, setUbsList] = useState<UBS[]>([])
  const [municipioId, setMunicipioId] = useState('')
  const [ubsId, setUbsId] = useState('')
  const [mes, setMes] = useState(String(new Date().getMonth() + 1))
  const [ano, setAno] = useState(String(currentYear))
  const [loadingMun, setLoadingMun] = useState(true)
  const [loadingUbs, setLoadingUbs] = useState(false)

  // Upload
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)

  // Processamento
  const [importing, setImporting] = useState(false)
  const [errors, setErrors] = useState<ImportError[]>([])
  const [result, setResult] = useState<ImportResult | null>(null)

  // Carrega municípios
  useEffect(() => {
    getMunicipios()
      .then((lista) => {
        setMunicipios(lista)
        if (lista.length === 1) setMunicipioId(lista[0].id)
      })
      .finally(() => setLoadingMun(false))
  }, [])

  // Carrega UBS quando muda município
  useEffect(() => {
    if (!municipioId) { setUbsList([]); setUbsId(''); return }
    setLoadingUbs(true)
    getUBSByMunicipio(municipioId)
      .then((lista) => {
        setUbsList(lista)
        if (lista.length === 1) setUbsId(lista[0].id)
        else setUbsId('')
      })
      .finally(() => setLoadingUbs(false))
  }, [municipioId])

  function handleFileSelect(f: File | null) {
    setFile(f)
    setErrors([])
    setResult(null)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) {
      handleFileSelect(f)
    }
  }

  async function handleImport() {
    if (!file || !ubsId) return

    setImporting(true)
    setErrors([])
    setResult(null)

    try {
      const buffer = await file.arrayBuffer()
      const data = parseExcel(buffer)

      // Valida primeiro
      const validationErrors = validateImport(data)
      if (validationErrors.length > 0) {
        setErrors(validationErrors)
        setImporting(false)
        return
      }

      // Importa
      const res = await importarDados(ubsId, parseInt(mes), parseInt(ano), data)
      setResult(res)
      if (!res.success) {
        setErrors(res.errors)
      }
    } catch (e) {
      setErrors([{ aba: 'Geral', linha: 0, campo: '', mensagem: `Erro ao processar arquivo: ${e}` }])
    } finally {
      setImporting(false)
    }
  }

  function reset() {
    setFile(null)
    setErrors([])
    setResult(null)
  }

  const canImport = !!file && !!ubsId && !!mes && !!ano && !importing

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
              <h1 className="text-lg font-bold text-gray-900">Importar via Excel</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Faça upload de uma planilha para lançar dados em lote
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 space-y-6">

        {/* Sucesso */}
        {result?.success && (
          <Card className="border-green-200 bg-green-50/50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-green-800">Importação concluída com sucesso!</h3>
                <p className="text-sm text-green-700 mt-1">
                  Os dados foram salvos no período selecionado.
                </p>
                {result.resumo && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                    {[
                      { label: 'Funcionários', value: result.resumo.funcionarios },
                      { label: 'Produção', value: result.resumo.producao },
                      { label: 'Mat. Consumo', value: result.resumo.materiais },
                      { label: 'Insumos', value: result.resumo.insumos },
                      { label: 'Administrativos', value: result.resumo.administrativos },
                      { label: 'Terceirizados', value: result.resumo.terceirizados },
                    ].filter((i) => i.value > 0).map((item) => (
                      <div key={item.label} className="bg-white rounded-lg border border-green-200 px-3 py-2">
                        <p className="text-xs text-green-600">{item.label}</p>
                        <p className="text-lg font-bold text-green-800">{item.value}</p>
                      </div>
                    ))}
                  </div>
                )}
                <Button variant="secondary" onClick={reset} className="mt-4" type="button">
                  Nova importação
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Formulário (esconde quando sucesso) */}
        {!result?.success && (
          <>
            {/* 1. Modelo para download */}
            <Card>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Modelo de planilha</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Baixe o modelo padrão, preencha e faça o upload abaixo
                    </p>
                  </div>
                </div>
                <Button variant="secondary" onClick={downloadModelo} type="button">
                  <Download className="w-4 h-4" />
                  Baixar modelo .xlsx
                </Button>
              </div>

              {/* Instruções */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Abas da planilha
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { aba: 'Funcionarios', campos: 'nome, cargo, vinculo, salario, equipe' },
                    { aba: 'Producao', campos: 'evento, quantidade_atendimentos, responsaveis' },
                    { aba: 'MateriaisConsumo', campos: 'nome, valor' },
                    { aba: 'Insumos', campos: 'nome, valor' },
                    { aba: 'Administrativos', campos: 'nome, valor' },
                    { aba: 'Terceirizados', campos: 'nome, valor' },
                  ].map((item) => (
                    <div key={item.aba} className="bg-gray-50 rounded-lg border border-gray-100 px-3 py-2">
                      <p className="text-xs font-bold text-gray-700">{item.aba}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{item.campos}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* 2. Seleção de contexto */}
            <Card>
              <h3 className="font-semibold text-gray-800 mb-4">Destino dos dados</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Select
                  label="Município"
                  required
                  value={municipioId}
                  onChange={(e) => setMunicipioId(e.target.value)}
                  options={municipios.map((m) => ({ value: m.id, label: `${m.nome} — ${m.estado}` }))}
                  placeholder={loadingMun ? 'Carregando...' : 'Selecione'}
                  disabled={loadingMun}
                />
                <Select
                  label="UBS"
                  required
                  value={ubsId}
                  onChange={(e) => setUbsId(e.target.value)}
                  options={ubsList.map((u) => ({ value: u.id, label: u.nome }))}
                  placeholder={!municipioId ? 'Selecione o município' : loadingUbs ? 'Carregando...' : 'Selecione'}
                  disabled={!municipioId || loadingUbs}
                />
                <Select
                  label="Mês"
                  required
                  value={mes}
                  onChange={(e) => setMes(e.target.value)}
                  options={MESES}
                />
                <Select
                  label="Ano"
                  required
                  value={ano}
                  onChange={(e) => setAno(e.target.value)}
                  options={ANOS}
                />
              </div>
              {ubsId && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
                  ⚠ A importação irá <strong>substituir</strong> todos os dados existentes para esta UBS no período selecionado.
                </p>
              )}
            </Card>

            {/* 3. Upload */}
            <Card>
              <h3 className="font-semibold text-gray-800 mb-4">Upload da planilha</h3>

              {/* Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={[
                  'border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer',
                  dragOver
                    ? 'border-[#01884d] bg-green-50'
                    : file
                    ? 'border-green-300 bg-green-50/30'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300',
                ].join(' ')}
                onClick={() => document.getElementById('excel-input')?.click()}
              >
                <input
                  id="excel-input"
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                />

                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileSpreadsheet className="w-8 h-8 text-green-600" />
                    <div className="text-left">
                      <p className="font-semibold text-gray-800">{file.name}</p>
                      <p className="text-xs text-gray-400">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleFileSelect(null) }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      aria-label="Remover arquivo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 font-medium">
                      Arraste o arquivo .xlsx aqui ou clique para selecionar
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Apenas arquivos Excel (.xlsx, .xls)
                    </p>
                  </>
                )}
              </div>

              {/* Botão importar */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  {!ubsId && 'Selecione município e UBS acima'}
                  {ubsId && !file && 'Selecione um arquivo para importar'}
                  {ubsId && file && 'Pronto para importar'}
                </p>
                <Button
                  onClick={handleImport}
                  disabled={!canImport}
                  loading={importing}
                  type="button"
                >
                  <Upload className="w-4 h-4" />
                  Importar dados
                </Button>
              </div>
            </Card>

            {/* 4. Erros */}
            {errors.length > 0 && (
              <Card className="border-red-200 bg-red-50/30">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  <h3 className="font-semibold text-red-800">
                    {errors.length} erro{errors.length !== 1 ? 's' : ''} encontrado{errors.length !== 1 ? 's' : ''}
                  </h3>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-1.5">
                  {errors.map((err, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 bg-white border border-red-100 rounded-lg px-3 py-2 text-sm"
                    >
                      <span className="shrink-0 text-xs font-mono bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                        {err.aba}:{err.linha}
                      </span>
                      <div className="min-w-0">
                        {err.campo && (
                          <span className="text-xs font-semibold text-red-600 mr-1">
                            [{err.campo}]
                          </span>
                        )}
                        <span className="text-red-700">{err.mensagem}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-red-600 mt-3">
                  Corrija os erros na planilha e faça o upload novamente.
                </p>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-4 mt-auto">
        <p className="text-center text-xs text-gray-400">
          SICM-Saúde ·{' '}
          <a href="https://www.uel.br/projetos/nigep/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 hover:underline underline-offset-2 transition-colors">
            Desenvolvido por NIGEP
          </a>
        </p>
      </footer>
    </div>
  )
}
