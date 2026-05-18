import { useEffect, useState } from 'react'
import {
  Activity, Building2, DollarSign,
  TrendingDown, Users, MapPin, Stethoscope, RefreshCw, Download,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, LabelList,
} from 'recharts'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { ChartCard } from '@/components/dashboard/ChartCard'
import { KpiExplainModal, type KpiExplain } from '@/components/dashboard/KpiExplainModal'
import { getDashboardData, type DashboardData } from '@/services/dashboard'
import { getMunicipios } from '@/services/municipios'
import { formatCurrency } from '@/lib/utils'
import type { Municipio } from '@/types'

const MESES = [
  { value: '0', label: '📅 Ano inteiro' },
  { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },   { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },    { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },   { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },{ value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },{ value: '12', label: 'Dezembro' },
]
const MESES_LABEL = ['Ano inteiro','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const currentYear = new Date().getFullYear()
const ANOS = Array.from({ length: 6 }, (_, i) => ({ value: String(currentYear - i), label: String(currentYear - i) }))

const CORES_CATEGORIA = ['#01884d','#004aad','#fce029','#ef4444','#14b8a6']
const CORES_BARRAS = ['#01884d','#004aad','#fce029','#f97316','#ef4444','#8b5cf6','#14b8a6','#f59e0b']

function fmtCur(v: number) { return formatCurrency(v) }
function fmtNum(v: number, dec = 1) { return v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) }

// Tooltip customizado para moeda
function TooltipMoeda({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      {label && <p className="font-semibold text-gray-700 mb-2">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-semibold text-gray-900">{fmtCur(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function TooltipNumero({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      {label && <p className="font-semibold text-gray-700 mb-2">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-semibold text-gray-900">{p.value.toLocaleString('pt-BR')}</span>
        </div>
      ))}
    </div>
  )
}

// Label customizado para pizza
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number
}) {
  if (percent < 0.04) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

interface DashboardProps {
  onBack: () => void
}

export function Dashboard({ onBack: _onBack }: DashboardProps) {
  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [municipioId, setMunicipioId] = useState('')
  const [mes, setMes] = useState(String(new Date().getMonth() + 1))
  const [ano, setAno] = useState(String(currentYear))
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMun, setLoadingMun] = useState(true)
  const [error, setError] = useState('')
  const [explain, setExplain] = useState<KpiExplain | null>(null)

  // Monta a explicação de cada KPI com os dados atuais
  function makeExplain(key: string): KpiExplain | null {
    if (!data) return null
    const hab = data.municipioHabitantes
    const periodo = `${MESES_LABEL[data.mes]}/${data.ano}`

    switch (key) {
      case 'totalUbs':
        return {
          title: 'Total de UBS',
          value: String(data.totalUbs),
          formula: 'Contagem de UBS cadastradas no município',
          steps: [
            { label: 'Município', value: data.municipioNome },
            { label: 'UBS cadastradas', value: String(data.totalUbs), highlight: true },
          ],
          note: 'Inclui todas as Unidades Básicas de Saúde vinculadas ao município, independente de terem lançamentos no período.',
        }

      case 'totalAtendimentos':
        return {
          title: 'Total de Atendimentos',
          value: data.totalAtendimentos.toLocaleString('pt-BR'),
          formula: 'Σ quantidade_atendimentos de todos os eventos de produção do período',
          steps: [
            { label: 'Período', value: periodo },
            ...data.atendimentosPorUbs.map((u) => ({
              label: u.nome,
              value: u.total.toLocaleString('pt-BR'),
            })),
            { label: 'Total', value: data.totalAtendimentos.toLocaleString('pt-BR'), highlight: true },
          ],
          note: 'Soma de todos os atendimentos registrados nos eventos de produção de cada UBS no período selecionado.',
        }

      case 'servidores':
        return {
          title: 'Servidores',
          value: String(data.totalFuncionarios),
          formula: 'Contagem de funcionários lançados no período',
          steps: [
            { label: 'Período', value: periodo },
            ...data.funcionariosPorVinculo.map((v) => ({
              label: v.label,
              value: `${v.quantidade} serv.`,
            })),
            { label: 'Total de servidores', value: String(data.totalFuncionarios), highlight: true },
          ],
          note: 'Contagem de todos os funcionários (Concursados, CLT e Terceirizados) lançados nas UBS do município no período.',
        }

      case 'ubsPor10k':
        return {
          title: 'UBS por 10 mil habitantes',
          value: fmtNum(data.ubsPor10kHab),
          formula: '(Total de UBS ÷ Habitantes) × 10.000',
          steps: [
            { label: 'Total de UBS', value: String(data.totalUbs) },
            { label: 'Habitantes', value: hab.toLocaleString('pt-BR') },
            { label: 'Cálculo', value: `(${data.totalUbs} ÷ ${hab.toLocaleString('pt-BR')}) × 10.000` },
            { label: 'Resultado', value: fmtNum(data.ubsPor10kHab), highlight: true },
          ],
          note: 'Indica a cobertura territorial de UBS. A OMS recomenda ao menos 1 UBS por 3.000 a 4.000 habitantes (≈ 2,5 a 3,3 por 10 mil hab.).',
        }

      case 'serv10k':
        return {
          title: 'Servidores por 10 mil habitantes',
          value: fmtNum(data.servidoresPor10kHab),
          formula: '(Total de Servidores ÷ Habitantes) × 10.000',
          steps: [
            { label: 'Total de servidores', value: String(data.totalFuncionarios) },
            { label: 'Habitantes', value: hab.toLocaleString('pt-BR') },
            { label: 'Cálculo', value: `(${data.totalFuncionarios} ÷ ${hab.toLocaleString('pt-BR')}) × 10.000` },
            { label: 'Resultado', value: fmtNum(data.servidoresPor10kHab), highlight: true },
          ],
          note: 'Mede a densidade de pessoal de saúde em relação à população. Útil para comparar a capacidade de atendimento entre municípios.',
        }

      case 'atendPerCapita':
        return {
          title: 'Atendimentos per capita',
          value: fmtNum(data.atendimentosPerCapita, 3),
          formula: 'Total de Atendimentos ÷ Habitantes',
          steps: [
            { label: 'Total de atendimentos', value: data.totalAtendimentos.toLocaleString('pt-BR') },
            { label: 'Habitantes', value: hab.toLocaleString('pt-BR') },
            { label: 'Cálculo', value: `${data.totalAtendimentos.toLocaleString('pt-BR')} ÷ ${hab.toLocaleString('pt-BR')}` },
            { label: 'Resultado', value: fmtNum(data.atendimentosPerCapita, 4), highlight: true },
          ],
          note: 'Representa quantos atendimentos foram realizados por habitante no período. Valores próximos a 0,3–0,5 por mês indicam boa cobertura.',
        }

      case 'custoTotal':
        return {
          title: 'Custo Total',
          value: fmtCur(data.custoTotal),
          formula: 'Pessoal + Mat. Consumo + Insumos + Administrativo + Serv. Terceirizados',
          steps: [
            { label: 'Pessoal', value: fmtCur(data.custosPessoal) },
            { label: 'Materiais de Consumo', value: fmtCur(data.custosMateriaisConsumo) },
            { label: 'Insumos', value: fmtCur(data.custosInsumos) },
            { label: 'Administrativo', value: fmtCur(data.custosAdministrativos) },
            { label: 'Serv. Terceirizados', value: fmtCur(data.custosTerceirizados) },
            { label: 'Total Geral', value: fmtCur(data.custoTotal), highlight: true },
          ],
          note: 'Soma de todas as categorias de custo lançadas para as UBS do município no período selecionado.',
        }

      case 'custoPorAtend':
        return {
          title: 'Custo por Atendimento',
          value: data.totalAtendimentos > 0 ? fmtCur(data.custoPorAtendimento) : '—',
          formula: 'Custo Total ÷ Total de Atendimentos',
          steps: [
            { label: 'Custo Total', value: fmtCur(data.custoTotal) },
            { label: 'Total de atendimentos', value: data.totalAtendimentos.toLocaleString('pt-BR') },
            { label: 'Cálculo', value: `${fmtCur(data.custoTotal)} ÷ ${data.totalAtendimentos.toLocaleString('pt-BR')}` },
            { label: 'Resultado', value: data.totalAtendimentos > 0 ? fmtCur(data.custoPorAtendimento) : '—', highlight: true },
          ],
          note: 'Indica quanto custa, em média, cada atendimento realizado. É um dos principais indicadores de eficiência da atenção básica.',
        }

      case 'custoPerCapita':
        return {
          title: 'Custo per Capita',
          value: fmtCur(data.custoPerCapita),
          formula: 'Custo Total ÷ Habitantes',
          steps: [
            { label: 'Custo Total', value: fmtCur(data.custoTotal) },
            { label: 'Habitantes', value: hab.toLocaleString('pt-BR') },
            { label: 'Cálculo', value: `${fmtCur(data.custoTotal)} ÷ ${hab.toLocaleString('pt-BR')}` },
            { label: 'Resultado', value: fmtCur(data.custoPerCapita), highlight: true },
          ],
          note: 'Representa o custo mensal de saúde básica por habitante. Permite comparar o investimento entre municípios de tamanhos diferentes.',
        }

      case 'totalSalarios':
        return {
          title: 'Total de Salários',
          value: fmtCur(data.totalSalarios),
          formula: 'Σ salários de todos os funcionários lançados no período',
          steps: [
            { label: 'Período', value: periodo },
            ...data.funcionariosPorVinculo.map((v) => ({
              label: `${v.label} (${v.quantidade} serv.)`,
              value: fmtCur(v.totalSalarios),
            })),
            { label: 'Total de salários', value: fmtCur(data.totalSalarios), highlight: true },
            { label: '% do custo total', value: `${fmtNum(data.pctPessoal, 1)}%` },
          ],
          note: 'Soma de todos os salários e custos de pessoal (Concursados, CLT e Terceirizados) lançados no período.',
        }

      case 'custoMedioServidor':
        return {
          title: 'Custo Médio por Servidor',
          value: data.totalFuncionarios > 0 ? fmtCur(data.custoMedioPorServidor) : '—',
          formula: 'Total de Salários ÷ Total de Servidores',
          steps: [
            { label: 'Total de salários', value: fmtCur(data.totalSalarios) },
            { label: 'Total de servidores', value: String(data.totalFuncionarios) },
            { label: 'Cálculo', value: `${fmtCur(data.totalSalarios)} ÷ ${data.totalFuncionarios}` },
            { label: 'Resultado', value: data.totalFuncionarios > 0 ? fmtCur(data.custoMedioPorServidor) : '—', highlight: true },
          ],
          note: 'Salário médio dos servidores no período. Inclui todos os vínculos (Concursado, CLT, Terceirizado).',
        }

      default:
        return null
    }
  }

  useEffect(() => {
    getMunicipios()
      .then((lista) => {
        setMunicipios(lista)
        if (lista.length === 1) {
          setMunicipioId(lista[0].id)
        } else if (lista.length > 1) {
          // Seleciona o município com updated_at mais recente
          const sorted = [...lista].sort((a, b) =>
            (b.updated_at ?? b.created_at ?? '').localeCompare(a.updated_at ?? a.created_at ?? '')
          )
          setMunicipioId(sorted[0].id)
        }
      })
      .finally(() => setLoadingMun(false))
  }, [])

  useEffect(() => {
    if (!municipioId) return
    setLoading(true)
    setError('')
    getDashboardData(municipioId, parseInt(mes), parseInt(ano))
      .then(setData)
      .catch(() => setError('Erro ao carregar dados. Verifique sua conexão.'))
      .finally(() => setLoading(false))
  }, [municipioId, mes, ano])

  // Dados para gráfico de pizza (distribuição de custos)
  const pieData = data ? [
    { name: 'Pessoal',           value: data.custosPessoal,          pct: data.pctPessoal },
    { name: 'Mat. Consumo',      value: data.custosMateriaisConsumo, pct: data.pctMateriais },
    { name: 'Insumos',           value: data.custosInsumos,          pct: data.pctInsumos },
    { name: 'Administrativo',    value: data.custosAdministrativos,  pct: data.pctAdministrativo },
    { name: 'Serv. Terceiriz.',  value: data.custosTerceirizados,    pct: data.pctTerceirizados },
  ].filter((d) => d.value > 0) : []

  // Dados para gráfico de pizza — distribuição por vínculo
  const VINCULO_CORES: Record<string, string> = {
    concursado:   '#004aad',
    clt:          '#f59e0b',
    terceirizado: '#14b8a6',
  }
  const pieVinculo = data?.funcionariosPorVinculo.map((v) => ({
    name: v.label,
    value: v.quantidade,
    vinculo: v.vinculo,
  })) ?? []

  function exportarTxt() {
    if (!data) return
    const sep = '─'.repeat(52)
    const linha = (label: string, valor: string) =>
      `  ${label.padEnd(30)} ${valor}`

    const ubsCustos = data.custosPorUbs.map((u) =>
      `  • ${u.nome.padEnd(28)} ${fmtCur(u.total)}`
    ).join('\n')

    const ubsAtend = data.atendimentosPorUbs.map((u) =>
      `  • ${u.nome.padEnd(28)} ${u.total.toLocaleString('pt-BR')} atend.`
    ).join('\n')

    const salarios = data.salariosPorCargo.map((c) =>
      `  • ${c.cargo.padEnd(28)} ${fmtCur(c.total)} (${c.quantidade} serv.)`
    ).join('\n')

    const vinculos = data.funcionariosPorVinculo.map((v) =>
      `  • ${v.label.padEnd(28)} ${v.quantidade} serv.  ${fmtCur(v.totalSalarios)}`
    ).join('\n')

    const txt = [
      '╔══════════════════════════════════════════════════════╗',
      '║         GESTÃO DE CUSTOS UBS — NIGEP / UEL           ║',
      '╚══════════════════════════════════════════════════════╝',
      '',
      `  Município : ${data.municipioNome} — ${data.municipioEstado}`,
      `  Período   : ${MESES_LABEL[data.mes]}/${data.ano}`,
      `  Habitantes: ${data.municipioHabitantes.toLocaleString('pt-BR')}`,
      `  Gerado em : ${new Date().toLocaleString('pt-BR')}`,
      '',
      sep,
      '  INDICADORES DE ESTRUTURA',
      sep,
      linha('Total de UBS', String(data.totalUbs)),
      linha('Total de Atendimentos', data.totalAtendimentos.toLocaleString('pt-BR')),
      linha('Servidores', String(data.totalFuncionarios)),
      linha('UBS / 10 mil hab.', fmtNum(data.ubsPor10kHab)),
      linha('Servidores / 10 mil hab.', fmtNum(data.servidoresPor10kHab)),
      linha('Atendimentos per capita', fmtNum(data.atendimentosPerCapita, 4)),
      '',
      sep,
      '  INDICADORES DE CUSTO',
      sep,
      linha('Custo Total', fmtCur(data.custoTotal)),
      linha('Custo por Atendimento', data.totalAtendimentos > 0 ? fmtCur(data.custoPorAtendimento) : '—'),
      linha('Custo per Capita', fmtCur(data.custoPerCapita)),
      linha('Total de Salários', fmtCur(data.totalSalarios)),
      linha('Custo Médio por Servidor', data.totalFuncionarios > 0 ? fmtCur(data.custoMedioPorServidor) : '—'),
      '',
      sep,
      '  DISTRIBUIÇÃO DE CUSTOS POR CATEGORIA',
      sep,
      linha('Pessoal', `${fmtCur(data.custosPessoal)}  (${fmtNum(data.pctPessoal, 1)}%)`),
      linha('Materiais de Consumo', `${fmtCur(data.custosMateriaisConsumo)}  (${fmtNum(data.pctMateriais, 1)}%)`),
      linha('Insumos', `${fmtCur(data.custosInsumos)}  (${fmtNum(data.pctInsumos, 1)}%)`),
      linha('Administrativo', `${fmtCur(data.custosAdministrativos)}  (${fmtNum(data.pctAdministrativo, 1)}%)`),
      linha('Serv. Terceirizados (empresas)', `${fmtCur(data.custosTerceirizados)}  (${fmtNum(data.pctTerceirizados, 1)}%)`),
      '',
      ...(data.custosPorUbs.length > 0 ? [
        sep,
        '  CUSTO TOTAL POR UBS',
        sep,
        ubsCustos,
        '',
      ] : []),
      ...(data.atendimentosPorUbs.some((u) => u.total > 0) ? [
        sep,
        '  ATENDIMENTOS POR UBS',
        sep,
        ubsAtend,
        '',
      ] : []),
      ...(data.salariosPorCargo.length > 0 ? [
        sep,
        '  SALÁRIOS POR CARGO',
        sep,
        salarios,
        '',
      ] : []),
      ...(data.funcionariosPorVinculo.length > 0 ? [
        sep,
        '  SERVIDORES POR VÍNCULO',
        sep,
        vinculos,
        '',
      ] : []),
      sep,
      '  Gestão de Custos UBS · Desenvolvido por NIGEP / UEL',
      sep,
    ].join('\n')

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `custos-ubs_${data.municipioNome.replace(/\s+/g, '-')}_${MESES_LABEL[data.mes]}-${data.ano}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">Bem-vindo(a)!</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Indicadores de custos e saúde das UBS
              </p>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:flex-wrap">
              <Select
                value={municipioId}
                onChange={(e) => setMunicipioId(e.target.value)}
                options={municipios.map((m) => ({ value: m.id, label: `${m.nome} — ${m.estado}` }))}
                placeholder={loadingMun ? 'Carregando...' : 'Selecione o município'}
                disabled={loadingMun}
                className="col-span-2 sm:w-56"
              />
              <Select
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                options={MESES}
                className="sm:w-44"
              />
              <Select
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                options={ANOS}
                className="sm:w-24"
              />
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  if (!municipioId) return
                  setLoading(true)
                  setError('')
                  getDashboardData(municipioId, parseInt(mes), parseInt(ano))
                    .then(setData)
                    .catch(() => setError('Erro ao carregar dados.'))
                    .finally(() => setLoading(false))
                }}
                disabled={!municipioId || loading}
                className="col-span-2 sm:col-span-1"
              >
                <RefreshCw className="w-4 h-4" />
                Atualizar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Estado vazio */}
        {!municipioId && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#01884d]/10 to-[#01884d]/20 rounded-2xl flex items-center justify-center mb-5 border border-[#01884d]/10">
              <Building2 className="w-10 h-10 text-[#01884d]/50" />
            </div>
            <p className="text-gray-600 font-semibold text-lg">Selecione um município</p>
            <p className="text-gray-400 text-sm mt-1">
              Escolha o município e o período para visualizar os indicadores
            </p>
          </div>
        )}

        {/* Loading */}
        {municipioId && loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="animate-spin w-10 h-10 border-2 border-[#01884d] border-t-transparent rounded-full" />
            <p className="text-sm text-gray-400">Carregando indicadores...</p>
          </div>
        )}

        {/* Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 flex items-center gap-2">
            <span className="text-red-500">⚠</span>
            {error}
          </div>
        )}

        {/* Dashboard */}
        {data && !loading && (
          <>
            {/* Modal de explicação */}
            <KpiExplainModal explain={explain} onClose={() => setExplain(null)} />
            {/* Título do período */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {data.municipioNome} — {data.municipioEstado}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {MESES_LABEL[data.mes]}/{data.ano} · {data.municipioHabitantes.toLocaleString('pt-BR')} habitantes
                </p>
              </div>
              <div className="flex items-center gap-2">
                {data.custoTotal === 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm text-amber-700 flex items-center gap-2">
                    <span>⚠</span>
                    Nenhum lançamento encontrado para este período
                  </div>
                )}
                <button
                  type="button"
                  onClick={exportarTxt}
                  title="Baixar relatório em texto"
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:text-gray-700 hover:shadow-sm transition-all duration-150"
                >
                  <Download className="w-3.5 h-3.5" />
                  Exportar .txt
                </button>
              </div>
            </div>

            {/* ── KPIs Linha 1 — Estrutura ─────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              <KpiCard
                title="Total de UBS"
                value={String(data.totalUbs)}
                subtitle="no município"
                icon={<MapPin className="w-5 h-5" />}
                color="blue"
                onClick={() => setExplain(makeExplain('totalUbs'))}
              />
              <KpiCard
                title="Total Atendimentos"
                value={data.totalAtendimentos.toLocaleString('pt-BR')}
                subtitle={`${MESES_LABEL[data.mes]}/${data.ano}`}
                icon={<Stethoscope className="w-5 h-5" />}
                color="green"
                onClick={() => setExplain(makeExplain('totalAtendimentos'))}
              />
              <KpiCard
                title="Servidores"
                value={String(data.totalFuncionarios)}
                subtitle="funcionários ativos"
                icon={<Users className="w-5 h-5" />}
                color="indigo"
                onClick={() => setExplain(makeExplain('servidores'))}
              />
              <KpiCard
                title="UBS / 10k hab."
                value={fmtNum(data.ubsPor10kHab)}
                subtitle="cobertura territorial"
                icon={<Building2 className="w-5 h-5" />}
                color="teal"
                onClick={() => setExplain(makeExplain('ubsPor10k'))}
              />
              <KpiCard
                title="Serv. / 10k hab."
                value={fmtNum(data.servidoresPor10kHab)}
                subtitle="densidade de pessoal"
                icon={<Users className="w-5 h-5" />}
                color="purple"
                onClick={() => setExplain(makeExplain('serv10k'))}
              />
              <KpiCard
                title="Atend. per capita"
                value={fmtNum(data.atendimentosPerCapita, 3)}
                subtitle="atend. por habitante"
                icon={<Activity className="w-5 h-5" />}
                color="orange"
                onClick={() => setExplain(makeExplain('atendPerCapita'))}
              />
            </div>

            {/* ── KPIs Linha 2 — Cobertura ESF ─────────────────────── */}
            {data.totalEquipesEsf > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <KpiCard
                  title="Equipes ESF"
                  value={String(data.totalEquipesEsf)}
                  subtitle="equipes da saúde da família"
                  icon={<Users className="w-5 h-5" />}
                  color="green"
                  onClick={() => setExplain({
                    title: 'Equipes ESF',
                    value: String(data.totalEquipesEsf),
                    formula: 'Σ equipes ESF de todas as UBS',
                    steps: data.ubsLista.filter((u) => (u.num_equipes_esf ?? 0) > 0).map((u) => ({
                      label: u.nome,
                      value: `${u.num_equipes_esf} equipe(s)`,
                    })).concat([{ label: 'Total', value: String(data.totalEquipesEsf), highlight: true } as { label: string; value: string; highlight?: boolean }]),
                    note: 'Soma das equipes de Saúde da Família cadastradas em cada UBS do município.',
                  })}
                />
                <KpiCard
                  title="Pop. de Referência"
                  value={data.totalPopReferencia.toLocaleString('pt-BR')}
                  subtitle="população coberta"
                  icon={<Users className="w-5 h-5" />}
                  color="blue"
                  onClick={() => setExplain({
                    title: 'População de Referência',
                    value: data.totalPopReferencia.toLocaleString('pt-BR'),
                    formula: 'Σ população de referência de todas as UBS',
                    steps: data.ubsLista.filter((u) => (u.populacao_referencia ?? 0) > 0).map((u) => ({
                      label: u.nome,
                      value: (u.populacao_referencia ?? 0).toLocaleString('pt-BR'),
                    })).concat([{ label: 'Total', value: data.totalPopReferencia.toLocaleString('pt-BR'), highlight: true } as { label: string; value: string; highlight?: boolean }]),
                    note: 'Soma da população de referência atribuída a cada UBS.',
                  })}
                />
                <KpiCard
                  title="Pop. por Equipe"
                  value={fmtNum(data.popPorEquipeEsf, 0)}
                  subtitle="habitantes por equipe ESF"
                  icon={<Activity className="w-5 h-5" />}
                  color="orange"
                  onClick={() => setExplain({
                    title: 'População por Equipe ESF',
                    value: fmtNum(data.popPorEquipeEsf, 0),
                    formula: 'Pop. de Referência Total ÷ Total de Equipes ESF',
                    steps: [
                      { label: 'Pop. de referência', value: data.totalPopReferencia.toLocaleString('pt-BR') },
                      { label: 'Equipes ESF', value: String(data.totalEquipesEsf) },
                      { label: 'Resultado', value: fmtNum(data.popPorEquipeEsf, 0), highlight: true },
                    ],
                    note: 'O Ministério da Saúde recomenda entre 2.000 e 3.500 pessoas por equipe ESF.',
                  })}
                />
                <KpiCard
                  title="Cobertura ESF"
                  value={`${fmtNum(data.coberturaEsf, 1)}%`}
                  subtitle="da população municipal"
                  icon={<Stethoscope className="w-5 h-5" />}
                  color="teal"
                  onClick={() => setExplain({
                    title: 'Cobertura ESF',
                    value: `${fmtNum(data.coberturaEsf, 1)}%`,
                    formula: '(Pop. de Referência ÷ Habitantes do Município) × 100',
                    steps: [
                      { label: 'Pop. de referência', value: data.totalPopReferencia.toLocaleString('pt-BR') },
                      { label: 'Habitantes do município', value: data.municipioHabitantes.toLocaleString('pt-BR') },
                      { label: 'Cobertura', value: `${fmtNum(data.coberturaEsf, 1)}%`, highlight: true },
                    ],
                    note: 'Percentual da população do município coberta pelas equipes de Saúde da Família.',
                  })}
                />
              </div>
            )}

            {/* ── KPIs Linha 3 — Custos ────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
              <KpiCard
                title="Custo Total"
                value={fmtCur(data.custoTotal)}
                subtitle="todas as UBS"
                icon={<DollarSign className="w-5 h-5" />}
                color="blue"
                onClick={() => setExplain(makeExplain('custoTotal'))}
              />
              <KpiCard
                title="Custo por Atend."
                value={data.totalAtendimentos > 0 ? fmtCur(data.custoPorAtendimento) : '—'}
                subtitle="custo total ÷ atendimentos"
                icon={<TrendingDown className="w-5 h-5" />}
                color="green"
                onClick={() => setExplain(makeExplain('custoPorAtend'))}
              />
              <KpiCard
                title="Custo per Capita"
                value={fmtCur(data.custoPerCapita)}
                subtitle="custo ÷ habitantes"
                icon={<Users className="w-5 h-5" />}
                color="indigo"
                onClick={() => setExplain(makeExplain('custoPerCapita'))}
              />
              <KpiCard
                title="Total Salários"
                value={fmtCur(data.totalSalarios)}
                subtitle={`${fmtNum(data.pctPessoal, 1)}% do custo total`}
                icon={<DollarSign className="w-5 h-5" />}
                color="orange"
                onClick={() => setExplain(makeExplain('totalSalarios'))}
              />
              <KpiCard
                title="Custo Médio/Servidor"
                value={data.totalFuncionarios > 0 ? fmtCur(data.custoMedioPorServidor) : '—'}
                subtitle="salário médio"
                icon={<Users className="w-5 h-5" />}
                color="purple"
                onClick={() => setExplain(makeExplain('custoMedioServidor'))}
              />
            </div>

            {/* ── Gráficos Linha 1 ─────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Pizza — Distribuição de custos */}
              <ChartCard
                title="Distribuição de Custos"
                subtitle="% de cada categoria sobre o custo total"
                minHeight="min-h-80"
              >
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        labelLine={false}
                        label={PieLabel as never}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={CORES_CATEGORIA[i % CORES_CATEGORIA.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v) => fmtCur(Number(v))}
                        contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                      />
                      <Legend
                        formatter={(value) => <span style={{ fontSize: 12, color: '#374151' }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </ChartCard>

              {/* Barras — Custo por UBS */}
              <ChartCard
                title="Custo Total por UBS"
                subtitle="soma de todas as categorias"
                minHeight="min-h-80"
              >
                {data.custosPorUbs.some((u) => u.total > 0) ? (
                  <ResponsiveContainer width="100%" height={Math.max(240, data.custosPorUbs.length * 48)}>
                    <BarChart
                      data={data.custosPorUbs}
                      layout="vertical"
                      margin={{ top: 5, right: 70, left: 8, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={130} />
                      <Tooltip content={<TooltipMoeda />} />
                      <Bar dataKey="total" name="Custo Total" radius={[0, 4, 4, 0]}>
                        {data.custosPorUbs.map((_, i) => (
                          <Cell key={i} fill={CORES_BARRAS[i % CORES_BARRAS.length]} />
                        ))}
                        <LabelList
                          dataKey="total"
                          position="right"
                          formatter={(v: unknown) => `R$${(Number(v) / 1000).toFixed(1)}k`}
                          style={{ fontSize: 10, fill: '#6b7280' }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </ChartCard>
            </div>

            {/* ── Gráficos Linha 2 ─────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Barras empilhadas — Custo por UBS por categoria */}
              <ChartCard
                title="Custo por UBS — Detalhado por Categoria"
                subtitle="composição do custo de cada unidade"
                minHeight="min-h-80"
              >
                {data.custosPorUbs.some((u) => u.total > 0) ? (
                  <ResponsiveContainer width="100%" height={Math.max(240, data.custosPorUbs.length * 48)}>
                    <BarChart
                      data={data.custosPorUbs}
                      layout="vertical"
                      margin={{ top: 5, right: 10, left: 8, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={130} />
                      <Tooltip content={<TooltipMoeda />} />
                      <Legend formatter={(v) => <span style={{ fontSize: 11, color: '#374151' }}>{v}</span>} />
                      <Bar dataKey="pessoal"        name="Pessoal"           stackId="a" fill="#01884d" />
                      <Bar dataKey="materiais"      name="Mat. Consumo"      stackId="a" fill="#004aad" />
                      <Bar dataKey="insumos"        name="Insumos"           stackId="a" fill="#fce029" />
                      <Bar dataKey="administrativo" name="Administrativo"    stackId="a" fill="#ef4444" />
                      <Bar dataKey="terceirizados"  name="Serv. Terceiriz."  stackId="a" fill="#14b8a6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </ChartCard>

              {/* Barras — Atendimentos por UBS */}
              <ChartCard
                title="Atendimentos por UBS"
                subtitle="total de atendimentos no período"
                minHeight="min-h-80"
              >
                {data.atendimentosPorUbs.some((u) => u.total > 0) ? (
                  <ResponsiveContainer width="100%" height={Math.max(240, data.atendimentosPorUbs.length * 48)}>
                    <BarChart
                      data={data.atendimentosPorUbs}
                      layout="vertical"
                      margin={{ top: 5, right: 70, left: 8, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={130} />
                      <Tooltip content={<TooltipNumero />} />
                      <Bar dataKey="total" name="Atendimentos" radius={[0, 4, 4, 0]}>
                        {data.atendimentosPorUbs.map((_, i) => (
                          <Cell key={i} fill={CORES_BARRAS[i % CORES_BARRAS.length]} />
                        ))}
                        <LabelList
                          dataKey="total"
                          position="right"
                          formatter={(v: unknown) => Number(v).toLocaleString('pt-BR')}
                          style={{ fontSize: 10, fill: '#6b7280' }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </ChartCard>
            </div>

            {/* ── Gráfico — Salários por Cargo ─────────────────────── */}
            {data.salariosPorCargo.length > 0 && (
              <ChartCard
                title="Distribuição de Salários por Cargo"
                subtitle="total de salários e quantidade de servidores por cargo"
                minHeight="min-h-72"
              >
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={data.salariosPorCargo}
                    layout="vertical"
                    margin={{ top: 5, right: 80, left: 120, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="cargo" tick={{ fontSize: 11 }} width={110} />
                    <Tooltip content={<TooltipMoeda />} />
                    <Bar dataKey="total" name="Total Salários" fill="#01884d" radius={[0, 4, 4, 0]}>
                      <LabelList
                        dataKey="quantidade"
                        position="right"
                        formatter={(v: unknown) => `${v} serv.`}
                        style={{ fontSize: 11, fill: '#6b7280' }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* ── Gráfico — Distribuição por Vínculo ───────────────── */}
            {data.funcionariosPorVinculo.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard
                  title="Servidores por Vínculo"
                  subtitle="quantidade de funcionários por tipo de vínculo"
                  minHeight="min-h-64"
                >
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={pieVinculo}
                        cx="50%"
                        cy="50%"
                        outerRadius={85}
                        dataKey="value"
                        labelLine={false}
                        label={PieLabel as never}
                      >
                        {pieVinculo.map((entry, i) => (
                          <Cell key={i} fill={VINCULO_CORES[entry.vinculo] ?? CORES_BARRAS[i]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v) => [`${v} servidores`, 'Quantidade']}
                        contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                      />
                      <Legend formatter={(value) => <span style={{ fontSize: 12, color: '#374151' }}>{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                  title="Custo de Pessoal por Vínculo"
                  subtitle="total de salários/custos por tipo de vínculo"
                  minHeight="min-h-64"
                >
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={data.funcionariosPorVinculo}
                      layout="vertical"
                      margin={{ top: 5, right: 80, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} width={95} />
                      <Tooltip content={<TooltipMoeda />} />
                      <Bar dataKey="totalSalarios" name="Total Salários" radius={[0, 4, 4, 0]}>
                        {data.funcionariosPorVinculo.map((entry, i) => (
                          <Cell key={i} fill={VINCULO_CORES[entry.vinculo] ?? CORES_BARRAS[i]} />
                        ))}
                        <LabelList
                          dataKey="quantidade"
                          position="right"
                          formatter={(v: unknown) => `${v} serv.`}
                          style={{ fontSize: 11, fill: '#6b7280' }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            )}

            {/* ── Gráfico — Serviços Disponíveis por UBS ──────────── */}
            {data.servicosDisponiveis.length > 0 && (
              <ChartCard
                title="Serviços Disponíveis"
                subtitle="quantidade de UBS que oferecem cada serviço"
                minHeight="min-h-64"
              >
                <ResponsiveContainer width="100%" height={Math.max(200, data.servicosDisponiveis.length * 40)}>
                  <BarChart
                    data={data.servicosDisponiveis}
                    layout="vertical"
                    margin={{ top: 5, right: 60, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="servico" tick={{ fontSize: 11 }} width={120} />
                    <Tooltip
                      formatter={(v) => [`${v} UBS`, 'Oferecem']}
                      contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                    />
                    <Bar dataKey="quantidade" name="UBS" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                      <LabelList
                        dataKey="quantidade"
                        position="right"
                        formatter={(v: unknown) => `${v} UBS`}
                        style={{ fontSize: 11, fill: '#6b7280' }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* ── Gráfico — Funcionários por Equipe ESF ────────────── */}
            {data.funcionariosPorEquipe.length > 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard
                  title="Servidores por Equipe ESF"
                  subtitle="distribuição de funcionários entre as equipes"
                  minHeight="min-h-64"
                >
                  <ResponsiveContainer width="100%" height={Math.max(200, data.funcionariosPorEquipe.length * 44)}>
                    <BarChart
                      data={data.funcionariosPorEquipe}
                      layout="vertical"
                      margin={{ top: 5, right: 60, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="equipe" tick={{ fontSize: 12 }} width={90} />
                      <Tooltip content={<TooltipNumero />} />
                      <Bar dataKey="quantidade" name="Servidores" fill="#01884d" radius={[0, 4, 4, 0]}>
                        <LabelList
                          dataKey="quantidade"
                          position="right"
                          formatter={(v: unknown) => `${v} serv.`}
                          style={{ fontSize: 11, fill: '#6b7280' }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                  title="Custo de Pessoal por Equipe ESF"
                  subtitle="total de salários por equipe"
                  minHeight="min-h-64"
                >
                  <ResponsiveContainer width="100%" height={Math.max(200, data.funcionariosPorEquipe.length * 44)}>
                    <BarChart
                      data={data.funcionariosPorEquipe}
                      layout="vertical"
                      margin={{ top: 5, right: 80, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="equipe" tick={{ fontSize: 12 }} width={90} />
                      <Tooltip content={<TooltipMoeda />} />
                      <Bar dataKey="totalSalarios" name="Total Salários" fill="#004aad" radius={[0, 4, 4, 0]}>
                        <LabelList
                          dataKey="totalSalarios"
                          position="right"
                          formatter={(v: unknown) => fmtCur(Number(v))}
                          style={{ fontSize: 10, fill: '#6b7280' }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            )}

            {/* ── Indicadores Consolidados ─────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <h3 className="text-sm font-bold text-gray-800">Indicadores Consolidados</h3>
                <p className="text-xs text-gray-400 mt-0.5">{MESES_LABEL[data.mes]}/{data.ano} · {data.municipioNome}</p>
              </div>

              {/* ── 1. Participação % por categoria ───────────────── */}
              <div className="px-5 py-5 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Participação de cada categoria no custo total
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  <div className="space-y-3">
                    {[
                      { label: 'Pessoal',           pct: data.pctPessoal,        valor: data.custosPessoal,          cor: 'bg-[#01884d]'  },
                      { label: 'Mat. Consumo',      pct: data.pctMateriais,      valor: data.custosMateriaisConsumo, cor: 'bg-[#004aad]'  },
                      { label: 'Insumos',           pct: data.pctInsumos,        valor: data.custosInsumos,          cor: 'bg-yellow-400' },
                      { label: 'Administrativo',    pct: data.pctAdministrativo, valor: data.custosAdministrativos,  cor: 'bg-red-500'    },
                      { label: 'Serv. Terceiriz.',  pct: data.pctTerceirizados,  valor: data.custosTerceirizados,    cor: 'bg-teal-500'   },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">{item.label}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400">{fmtCur(item.valor)}</span>
                            <span className="text-sm font-bold text-gray-800 w-12 text-right">{fmtNum(item.pct, 1)}%</span>
                          </div>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${item.cor}`} style={{ width: `${Math.min(item.pct, 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {data.custoTotal > 0 && (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart layout="vertical"
                        data={[
                          { name: 'Pessoal',        pct: parseFloat(fmtNum(data.pctPessoal, 1).replace(',', '.')) },
                          { name: 'Mat. Consumo',      pct: parseFloat(fmtNum(data.pctMateriais, 1).replace(',', '.')) },
                          { name: 'Insumos',           pct: parseFloat(fmtNum(data.pctInsumos, 1).replace(',', '.')) },
                          { name: 'Administrativo',    pct: parseFloat(fmtNum(data.pctAdministrativo, 1).replace(',', '.')) },
                          { name: 'Serv. Terceiriz.',  pct: parseFloat(fmtNum(data.pctTerceirizados, 1).replace(',', '.')) },
                        ].filter((d) => d.pct > 0)}
                        margin={{ top: 0, right: 50, left: 90, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={85} />
                        <Tooltip formatter={(v) => [`${v}%`, 'Participação']} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                        <Bar dataKey="pct" name="%" radius={[0, 4, 4, 0]}>
                          {['#01884d','#004aad','#fce029','#ef4444','#14b8a6'].map((cor, i) => <Cell key={i} fill={cor} />)}
                          <LabelList dataKey="pct" position="right" formatter={(v: unknown) => `${v}%`} style={{ fontSize: 11, fill: '#374151', fontWeight: 600 }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* ── 2. Indicadores de custo comparados ────────────── */}
              <div className="px-5 py-5 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Indicadores de custo
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  {/* Barras de progresso relativas ao custo total */}
                  <div className="space-y-3">
                    {[
                      { label: 'Total de Salários',        valor: data.totalSalarios,        cor: 'bg-[#01884d]'  },
                      { label: 'Custo Médio por Servidor', valor: data.custoMedioPorServidor, cor: 'bg-[#004aad]'  },
                      { label: 'Custo Pessoal/Atend.',     valor: data.totalAtendimentos > 0 ? data.custosPessoal / data.totalAtendimentos : 0, cor: 'bg-yellow-400' },
                      { label: 'Custo Total/Atend.',       valor: data.custoPorAtendimento,   cor: 'bg-teal-500'   },
                      { label: 'Custo Total/UBS (média)',  valor: data.totalUbs > 0 ? data.custoTotal / data.totalUbs : 0, cor: 'bg-orange-500' },
                      { label: 'Custo per Capita',         valor: data.custoPerCapita,        cor: 'bg-red-500'    },
                    ].map((item) => {
                      const max = Math.max(data.totalSalarios, data.custoMedioPorServidor, data.custoPorAtendimento, data.totalUbs > 0 ? data.custoTotal / data.totalUbs : 0, data.custoPerCapita, 1)
                      const pct = (item.valor / max) * 100
                      return (
                        <div key={item.label}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-600">{item.label}</span>
                            <span className="text-sm font-bold text-gray-800">{item.valor > 0 ? fmtCur(item.valor) : '—'}</span>
                          </div>
                          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${item.cor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {/* Gráfico de barras horizontais — valores em R$ */}
                  {data.custoTotal > 0 && (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart layout="vertical"
                        data={[
                          { name: 'Total Salários',       valor: data.totalSalarios },
                          { name: 'Custo Médio/Servidor', valor: data.custoMedioPorServidor },
                          { name: 'Custo Pessoal/Atend.', valor: data.totalAtendimentos > 0 ? parseFloat((data.custosPessoal / data.totalAtendimentos).toFixed(2)) : 0 },
                          { name: 'Custo Total/Atend.',   valor: parseFloat(data.custoPorAtendimento.toFixed(2)) },
                          { name: 'Custo Total/UBS',      valor: data.totalUbs > 0 ? parseFloat((data.custoTotal / data.totalUbs).toFixed(2)) : 0 },
                          { name: 'Custo per Capita',     valor: parseFloat(data.custoPerCapita.toFixed(2)) },
                        ].filter((d) => d.valor > 0)}
                        margin={{ top: 0, right: 60, left: 110, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                        <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={105} />
                        <Tooltip formatter={(v) => [fmtCur(Number(v)), 'Valor']} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                        <Bar dataKey="valor" name="Valor" radius={[0, 4, 4, 0]}>
                          {['#01884d','#004aad','#fce029','#10b981','#14b8a6','#f97316'].map((cor, i) => <Cell key={i} fill={cor} />)}
                          <LabelList dataKey="valor" position="right" formatter={(v: unknown) => fmtCur(Number(v))} style={{ fontSize: 10, fill: '#374151', fontWeight: 600 }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* ── 3. Cobertura populacional ──────────────────────── */}
              <div className="px-5 py-5 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Cobertura e densidade populacional
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                  {/* Cards de cobertura */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'UBS por 10k hab.',      valor: fmtNum(data.ubsPor10kHab),              sub: `${data.totalUbs} UBS · ${data.municipioHabitantes.toLocaleString('pt-BR')} hab.`, cor: 'border-[#01884d]/20 bg-[#01884d]/5',   txt: 'text-[#01884d]'   },
                      { label: 'Serv. por 10k hab.',    valor: fmtNum(data.servidoresPor10kHab),        sub: `${data.totalFuncionarios} servidores`,                                              cor: 'border-[#004aad]/20 bg-[#004aad]/5', txt: 'text-[#004aad]' },
                      { label: 'Atend. per capita',     valor: fmtNum(data.atendimentosPerCapita, 4),   sub: `${data.totalAtendimentos.toLocaleString('pt-BR')} atend.`,                          cor: 'border-teal-200 bg-teal-50',  txt: 'text-teal-700'  },
                    ].map((item) => (
                      <div key={item.label} className={`rounded-xl border p-4 ${item.cor}`}>
                        <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                        <p className={`text-2xl font-bold ${item.txt}`}>{item.valor}</p>
                        <p className="text-xs text-gray-400 mt-1">{item.sub}</p>
                      </div>
                    ))}
                  </div>
                  {/* Gráfico de barras comparando os 3 índices normalizados */}
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart
                      data={[
                        { name: 'UBS / 10k hab.',    valor: parseFloat(data.ubsPor10kHab.toFixed(2)) },
                        { name: 'Serv. / 10k hab.',  valor: parseFloat(data.servidoresPor10kHab.toFixed(2)) },
                        { name: 'Atend. per capita', valor: parseFloat(data.atendimentosPerCapita.toFixed(4)) },
                      ]}
                      margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                      <Bar dataKey="valor" name="Índice" radius={[4, 4, 0, 0]}>
                        {['#01884d','#004aad','#14b8a6'].map((cor, i) => <Cell key={i} fill={cor} />)}
                        <LabelList dataKey="valor" position="top" style={{ fontSize: 11, fill: '#374151', fontWeight: 600 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── 4. Contagens gerais ────────────────────────────── */}
              <div className="px-5 py-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Totais do período
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'UBS',           valor: data.totalUbs,           cor: 'border-[#01884d]/20 bg-[#01884d]/5',    txt: 'text-[#01884d]',   fmt: (v: number) => String(v) },
                      { label: 'Atendimentos',  valor: data.totalAtendimentos,  cor: 'border-teal-200 bg-teal-50',  txt: 'text-teal-700',  fmt: (v: number) => v.toLocaleString('pt-BR') },
                      { label: 'Servidores',    valor: data.totalFuncionarios,  cor: 'border-[#004aad]/20 bg-[#004aad]/5', txt: 'text-[#004aad]', fmt: (v: number) => String(v) },
                    ].map((item) => (
                      <div key={item.label} className={`rounded-xl border p-4 text-center ${item.cor}`}>
                        <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                        <p className={`text-2xl font-bold ${item.txt}`}>{item.fmt(item.valor)}</p>
                      </div>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart
                      data={[
                        { name: 'UBS',          valor: data.totalUbs,          fill: '#3b82f6' },
                        { name: 'Servidores',   valor: data.totalFuncionarios, fill: '#6366f1' },
                      ]}
                      margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                      <Bar dataKey="valor" name="Total" radius={[4, 4, 0, 0]}>
                        {[0, 1].map((i) => <Cell key={i} fill={['#01884d','#004aad'][i]} />)}
                        <LabelList dataKey="valor" position="top" style={{ fontSize: 13, fill: '#374151', fontWeight: 700 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

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

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-full min-h-48 text-gray-300">
      <div className="text-center">
        <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm text-gray-400">Sem dados para o período</p>
      </div>
    </div>
  )
}
