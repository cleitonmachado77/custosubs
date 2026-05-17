import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getEduDashboardData, type EduDashboardData } from '@/services/educacao-dashboard'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList, LineChart, Line, ScatterChart, Scatter, ZAxis } from 'recharts'
import { GraduationCap, Users, DollarSign, School, BookOpen, TrendingUp, UserCheck, Building2, Download, Target, Activity } from 'lucide-react'
import type { Municipio } from '@/types'

interface EduDashboardProps {
  onBack: () => void
}

const COLORS_PIE = ['#1066C6', '#1B93ED', '#072F76', '#AECBE6', '#4BA3E3', '#0A4F9E']
const COLORS_BARS = ['#1066C6', '#072F76', '#1B93ED', '#AECBE6', '#4BA3E3', '#0A4F9E', '#3B82F6', '#6366F1']

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

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatNumber(value: number, decimals = 1) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export function EduDashboard({ onBack }: EduDashboardProps) {
  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [selectedMunicipio, setSelectedMunicipio] = useState('')
  const [ano, setAno] = useState(new Date().getFullYear())
  const [mes, setMes] = useState(0) // 0 = ano inteiro
  const [data, setData] = useState<EduDashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Carrega municípios
  useEffect(() => {
    supabase
      .from('municipios')
      .select('*')
      .order('updated_at', { ascending: false })
      .then(({ data: muns }) => {
        if (muns && muns.length > 0) {
          setMunicipios(muns)
          setSelectedMunicipio(muns[0].id) // primeiro = mais recente (updated_at desc)
        }
      })
  }, [])

  // Carrega dashboard quando muda seleção
  useEffect(() => {
    if (!selectedMunicipio) return
    setLoading(true)
    setError('')
    getEduDashboardData(selectedMunicipio, mes, ano)
      .then(setData)
      .catch((err) => setError(err.message || 'Erro ao carregar dados'))
      .finally(() => setLoading(false))
  }, [selectedMunicipio, mes, ano])

  const meses = [
    { value: 0, label: 'Ano inteiro' },
    { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' }, { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' }, { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' },
  ]

  const MESES_LABEL = ['Ano inteiro','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

  function exportarTxt() {
    if (!data) return
    const sep = '─'.repeat(52)
    const linha = (label: string, valor: string) =>
      `  ${label.padEnd(30)} ${valor}`

    const escolasCustos = data.custosPorEscola.map((e) =>
      `  • ${e.nome.padEnd(35)} ${formatCurrency(e.total)}  (${formatCurrency(e.custoPorAluno)}/aluno)`
    ).join('\n')

    const salarios = data.salariosPorCargo.map((c) =>
      `  • ${c.cargo.padEnd(28)} ${formatCurrency(c.total)} (${c.quantidade} serv.)`
    ).join('\n')

    const vinculos = data.funcionariosPorVinculo.map((v) =>
      `  • ${v.label.padEnd(28)} ${v.quantidade} serv.  ${formatCurrency(v.totalSalarios)}`
    ).join('\n')

    const txt = [
      '╔══════════════════════════════════════════════════════╗',
      '║       SICM-EDUCAÇÃO — CUSTOS MUNICIPAIS              ║',
      '║       NIGEP / UEL                                    ║',
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
      linha('Total de Escolas', String(data.totalEscolas)),
      linha('Total de Alunos', data.totalAlunos.toLocaleString('pt-BR')),
      linha('Total de Professores', String(data.totalProfessores)),
      linha('Total de Funcionários', String(data.totalFuncionarios)),
      linha('Relação Aluno/Professor', formatNumber(data.relacaoAlunoProfessor)),
      linha('Relação Aluno/Funcionário', formatNumber(data.relacaoAlunoFuncionario)),
      linha('Escolas / 10 mil hab.', formatNumber(data.escolasPor10kHab)),
      '',
      sep,
      '  INDICADORES DE CUSTO',
      sep,
      linha('Custo Total', formatCurrency(data.custoTotal)),
      linha('Custo Médio por Aluno', formatCurrency(data.custoMedioPorAluno)),
      linha('Custo Pedagógico/Aluno', formatCurrency(data.custoPedagogicoPorAluno)),
      linha('Custo Social/Aluno', formatCurrency(data.custoSocialPorAluno)),
      linha('Custo Administrativo/Aluno', formatCurrency(data.custoAdministrativoPorAluno)),
      linha('Custo per Capita Municipal', formatCurrency(data.custoPerCapitaMunicipal)),
      '',
      sep,
      '  DISTRIBUIÇÃO DE CUSTOS POR CATEGORIA',
      sep,
      linha('Pedagógico (pessoal+material)', `${formatCurrency(data.custoPedagogico + data.custoMaterialPedagogico)}  (${formatNumber(data.pctPedagogico)}%)`),
      linha('Social (pessoal+merenda)', `${formatCurrency(data.custoSocial + data.custoMerenda)}  (${formatNumber(data.pctSocial)}%)`),
      linha('Administrativo (pessoal+fixo+terc)', `${formatCurrency(data.custoAdministrativo + data.custoDespesasFixas + data.custoTerceirizados)}  (${formatNumber(data.pctAdministrativo)}%)`),
      '',
      ...(data.custosPorEscola.length > 0 ? [
        sep,
        '  CUSTO POR ESCOLA',
        sep,
        escolasCustos,
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
      '  SICM-Educação · Desenvolvido por NIGEP / UEL',
      sep,
    ].join('\n')

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `custos-educacao_${data.municipioNome.replace(/\s+/g, '-')}_${MESES_LABEL[data.mes]}-${data.ano}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-[#1066C6]" />
            Dashboard Educação
          </h1>
          <p className="text-sm text-gray-500 mt-1">Indicadores de custos e desempenho da rede municipal de ensino</p>
        </div>
        {data && data.custoTotal > 0 && (
          <button
            type="button"
            onClick={exportarTxt}
            title="Baixar relatório em texto"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:text-gray-700 hover:shadow-sm transition-all duration-150"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar TXT
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-4 items-end shadow-sm">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Município</label>
          <select
            value={selectedMunicipio}
            onChange={(e) => setSelectedMunicipio(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1066C6]/20 focus:border-[#1066C6] outline-none"
          >
            {municipios.map((m) => (
              <option key={m.id} value={m.id}>{m.nome} - {m.estado}</option>
            ))}
          </select>
        </div>
        <div className="w-40">
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Ano</label>
          <select
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1066C6]/20 focus:border-[#1066C6] outline-none"
          >
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="w-44">
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Período</label>
          <select
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1066C6]/20 focus:border-[#1066C6] outline-none"
          >
            {meses.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="text-center py-16 text-gray-400">
          <div className="animate-spin w-8 h-8 border-3 border-[#1066C6] border-t-transparent rounded-full mx-auto mb-3" />
          Carregando dados...
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
          {error}
        </div>
      )}

      {data && !loading && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard
              icon={<School className="w-5 h-5" />}
              label="Escolas"
              value={data.totalEscolas.toString()}
              color="#1066C6"
            />
            <KpiCard
              icon={<Users className="w-5 h-5" />}
              label="Total de Alunos"
              value={data.totalAlunos.toLocaleString('pt-BR')}
              color="#1B93ED"
            />
            <KpiCard
              icon={<DollarSign className="w-5 h-5" />}
              label="Custo Total"
              value={formatCurrency(data.custoTotal)}
              color="#072F76"
            />
            <KpiCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Custo/Aluno (mês)"
              value={formatCurrency(data.custoMedioPorAluno)}
              color="#1066C6"
            />
          </div>

          {/* KPIs secundários */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard
              icon={<BookOpen className="w-5 h-5" />}
              label="Custo Pedagógico/Aluno"
              value={formatCurrency(data.custoPedagogicoPorAluno)}
              subtitle={`${formatNumber(data.pctPedagogico)}% do total`}
              color="#1066C6"
            />
            <KpiCard
              icon={<UserCheck className="w-5 h-5" />}
              label="Custo Social/Aluno"
              value={formatCurrency(data.custoSocialPorAluno)}
              subtitle={`${formatNumber(data.pctSocial)}% do total`}
              color="#1B93ED"
            />
            <KpiCard
              icon={<Building2 className="w-5 h-5" />}
              label="Custo Adm./Aluno"
              value={formatCurrency(data.custoAdministrativoPorAluno)}
              subtitle={`${formatNumber(data.pctAdministrativo)}% do total`}
              color="#072F76"
            />
            <KpiCard
              icon={<Users className="w-5 h-5" />}
              label="Alunos/Professor"
              value={formatNumber(data.relacaoAlunoProfessor)}
              subtitle={`${data.totalProfessores} professores`}
              color="#1B93ED"
            />
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Pizza — Distribuição de custos */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="mb-4 pb-3 border-b border-gray-50">
                <h3 className="text-sm font-bold text-gray-800">Distribuição de Custos</h3>
                <p className="text-xs text-gray-400 mt-0.5">% de cada categoria sobre o custo total</p>
              </div>
              <div className="min-h-72">
                {data.custoTotal > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Pedagógico', value: data.custoPedagogico + data.custoMaterialPedagogico },
                          { name: 'Social (Merenda)', value: data.custoSocial + data.custoMerenda },
                          { name: 'Administrativo', value: data.custoAdministrativo + data.custoDespesasFixas + data.custoTerceirizados },
                        ].filter((d) => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        labelLine={false}
                        label={PieLabel as never}
                      >
                        {COLORS_PIE.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v) => formatCurrency(Number(v))}
                        contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                      />
                      <Legend
                        formatter={(value) => <span style={{ fontSize: 12, color: '#374151' }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-300 text-sm">Sem dados</div>
                )}
              </div>
            </div>

            {/* Barras horizontais — Custo Total por Escola */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="mb-4 pb-3 border-b border-gray-50">
                <h3 className="text-sm font-bold text-gray-800">Custo Total por Escola</h3>
                <p className="text-xs text-gray-400 mt-0.5">soma de todas as categorias</p>
              </div>
              <div className="min-h-72">
                {data.custosPorEscola.some((e) => e.total > 0) ? (
                  <ResponsiveContainer width="100%" height={Math.max(240, data.custosPorEscola.length * 52)}>
                    <BarChart
                      data={data.custosPorEscola}
                      layout="vertical"
                      margin={{ top: 5, right: 80, left: 8, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={140} />
                      <Tooltip
                        formatter={(v) => formatCurrency(Number(v))}
                        contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                      />
                      <Bar dataKey="total" name="Custo Total" radius={[0, 4, 4, 0]}>
                        {data.custosPorEscola.map((_, i) => (
                          <Cell key={i} fill={COLORS_BARS[i % COLORS_BARS.length]} />
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
                  <div className="flex items-center justify-center h-64 text-gray-300 text-sm">Sem dados</div>
                )}
              </div>
            </div>
          </div>

          {/* Gráficos Linha 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Barras empilhadas — Custo por Escola por Categoria */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="mb-4 pb-3 border-b border-gray-50">
                <h3 className="text-sm font-bold text-gray-800">Custo por Escola — Detalhado</h3>
                <p className="text-xs text-gray-400 mt-0.5">composição do custo de cada unidade</p>
              </div>
              <div className="min-h-72">
                {data.custosPorEscola.some((e) => e.total > 0) ? (
                  <ResponsiveContainer width="100%" height={Math.max(240, data.custosPorEscola.length * 52)}>
                    <BarChart
                      data={data.custosPorEscola.map((e) => ({
                        nome: e.nome,
                        pedagogico: e.pedagogico + e.materialPedagogico,
                        social: e.social + e.merenda,
                        administrativo: e.administrativo + e.despesasFixas + e.terceirizados,
                      }))}
                      layout="vertical"
                      margin={{ top: 5, right: 10, left: 8, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={140} />
                      <Tooltip
                        formatter={(v) => formatCurrency(Number(v))}
                        contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                      />
                      <Legend formatter={(v) => <span style={{ fontSize: 11, color: '#374151' }}>{v}</span>} />
                      <Bar dataKey="pedagogico" name="Pedagógico" stackId="a" fill="#1066C6" />
                      <Bar dataKey="social" name="Social" stackId="a" fill="#1B93ED" />
                      <Bar dataKey="administrativo" name="Administrativo" stackId="a" fill="#072F76" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-300 text-sm">Sem dados</div>
                )}
              </div>
            </div>

            {/* Barras — Custo por Aluno */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="mb-4 pb-3 border-b border-gray-50">
                <h3 className="text-sm font-bold text-gray-800">Custo Mensal por Aluno</h3>
                <p className="text-xs text-gray-400 mt-0.5">custo total dividido pelo número de alunos</p>
              </div>
              <div className="min-h-72">
                {data.custosPorEscola.some((e) => e.custoPorAluno > 0) ? (
                  <ResponsiveContainer width="100%" height={Math.max(240, data.custosPorEscola.length * 52)}>
                    <BarChart
                      data={data.custosPorEscola}
                      layout="vertical"
                      margin={{ top: 5, right: 80, left: 8, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tickFormatter={(v) => `R$${v.toFixed(0)}`} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={140} />
                      <Tooltip
                        formatter={(v) => formatCurrency(Number(v))}
                        contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                      />
                      <Bar dataKey="custoPorAluno" name="Custo/Aluno" radius={[0, 4, 4, 0]}>
                        {data.custosPorEscola.map((_, i) => (
                          <Cell key={i} fill={COLORS_BARS[i % COLORS_BARS.length]} />
                        ))}
                        <LabelList
                          dataKey="custoPorAluno"
                          position="right"
                          formatter={(v: unknown) => formatCurrency(Number(v))}
                          style={{ fontSize: 10, fill: '#6b7280' }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-300 text-sm">Sem dados</div>
                )}
              </div>
            </div>
          </div>

          {/* Tabela de escolas */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow mb-6">
            <div className="mb-4 pb-3 border-b border-gray-50">
              <h3 className="text-sm font-bold text-gray-800">Detalhamento por Escola</h3>
              <p className="text-xs text-gray-400 mt-0.5">custos consolidados por categoria</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-2 font-semibold text-gray-600">Escola</th>
                    <th className="text-right py-2 px-2 font-semibold text-gray-600">Alunos</th>
                    <th className="text-right py-2 px-2 font-semibold text-gray-600">Pedagógico</th>
                    <th className="text-right py-2 px-2 font-semibold text-gray-600">Social</th>
                    <th className="text-right py-2 px-2 font-semibold text-gray-600">Administrativo</th>
                    <th className="text-right py-2 px-2 font-semibold text-gray-600">Total</th>
                    <th className="text-right py-2 px-2 font-semibold text-gray-600">Custo/Aluno</th>
                    <th className="text-right py-2 px-2 font-semibold text-gray-600">% SM</th>
                  </tr>
                </thead>
                <tbody>
                  {data.custosPorEscola.map((escola) => (
                    <tr key={escola.nome} className="border-b border-gray-50 hover:bg-[#AECBE6]/5">
                      <td className="py-2 px-2 font-medium text-gray-800">{escola.nome}</td>
                      <td className="py-2 px-2 text-right text-gray-600">{escola.numAlunos}</td>
                      <td className="py-2 px-2 text-right text-gray-600">{formatCurrency(escola.pedagogico + escola.materialPedagogico)}</td>
                      <td className="py-2 px-2 text-right text-gray-600">{formatCurrency(escola.social + escola.merenda)}</td>
                      <td className="py-2 px-2 text-right text-gray-600">{formatCurrency(escola.administrativo + escola.despesasFixas + escola.terceirizados)}</td>
                      <td className="py-2 px-2 text-right font-semibold text-gray-800">{formatCurrency(escola.total)}</td>
                      <td className="py-2 px-2 text-right font-semibold text-[#1066C6]">{formatCurrency(escola.custoPorAluno)}</td>
                      <td className="py-2 px-2 text-right text-gray-500">{escola.custoPorAluno > 0 ? `${((escola.custoPorAluno / 1518) * 100).toFixed(1)}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* KPI extra: Custo/Aluno vs Salário Mínimo + CV */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <KpiCard
              icon={<DollarSign className="w-5 h-5" />}
              label="Custo/Aluno vs Salário Mínimo"
              value={`${formatNumber(data.custoAlunoPctSalarioMinimo)}%`}
              subtitle={`${formatCurrency(data.custoMedioPorAluno)} de R$ 1.518,00`}
              color="#072F76"
            />
            <KpiCard
              icon={<Activity className="w-5 h-5" />}
              label="Coef. Variação (Custos)"
              value={`${formatNumber(data.cvCustos)}%`}
              subtitle={data.cvCustos < 15 ? 'Baixa dispersão (homogêneo)' : data.cvCustos < 30 ? 'Média dispersão' : 'Alta dispersão'}
              color="#1B93ED"
            />
            <KpiCard
              icon={<Target className="w-5 h-5" />}
              label="Escolas com Desempenho"
              value={`${data.desempenho.filter((d) => d.ideb !== null).length}`}
              subtitle="com nota IDEB registrada"
              color="#1066C6"
            />
          </div>

          {/* Gráficos de Desempenho */}
          {data.desempenho.length > 0 && (
            <>
              {/* Evolução do IDEB */}
              {(() => {
                const anosUnicos = [...new Set(data.desempenho.map((d) => d.ano_referencia))].sort()
                const escolasComIdeb = [...new Set(data.desempenho.filter((d) => d.ideb !== null).map((d) => d.escola_nome))]
                const lineData = anosUnicos.map((anoRef) => {
                  const row: Record<string, unknown> = { ano: anoRef }
                  escolasComIdeb.forEach((nome) => {
                    const entry = data.desempenho.find((d) => d.ano_referencia === anoRef && d.escola_nome === nome)
                    row[nome] = entry?.ideb ?? null
                  })
                  return row
                })
                const LINE_COLORS = ['#1066C6', '#1B93ED', '#072F76', '#4BA3E3', '#0A4F9E', '#6366F1', '#3B82F6', '#14B8A6']

                return anosUnicos.length > 1 ? (
                  <div className="grid grid-cols-1 gap-6 mb-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                      <div className="mb-4 pb-3 border-b border-gray-50">
                        <h3 className="text-sm font-bold text-gray-800">Evolução do IDEB por Escola</h3>
                        <p className="text-xs text-gray-400 mt-0.5">comparativo longitudinal entre avaliações</p>
                      </div>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={lineData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="ano" tick={{ fontSize: 12 }} />
                          <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                          <Legend formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
                          {escolasComIdeb.map((nome, i) => (
                            <Line
                              key={nome}
                              type="monotone"
                              dataKey={nome}
                              stroke={LINE_COLORS[i % LINE_COLORS.length]}
                              strokeWidth={2}
                              dot={{ r: 4 }}
                              connectNulls
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : null
              })()}

              {/* Scatter: IDEB x NSE e IDEB x Custo/Aluno */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Scatter IDEB x NSE */}
                {data.desempenho.some((d) => d.nse_valor && d.ideb) && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                    <div className="mb-4 pb-3 border-b border-gray-50">
                      <h3 className="text-sm font-bold text-gray-800">Correlação IDEB × NSE</h3>
                      <p className="text-xs text-gray-400 mt-0.5">relação entre nível socioeconômico e desempenho</p>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                      <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" dataKey="nse" name="NSE" tick={{ fontSize: 11 }} label={{ value: 'NSE', position: 'bottom', fontSize: 11 }} />
                        <YAxis type="number" dataKey="ideb" name="IDEB" domain={[0, 10]} tick={{ fontSize: 11 }} label={{ value: 'IDEB', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                        <ZAxis type="number" dataKey="alunos" range={[40, 200]} name="Alunos" />
                        <Tooltip
                          content={({ payload }) => {
                            if (!payload?.length) return null
                            const d = payload[0].payload
                            return (
                              <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
                                <p className="font-bold text-gray-800">{d.nome}</p>
                                <p className="text-gray-600">NSE: {d.nse} | IDEB: {d.ideb}</p>
                                <p className="text-gray-500">{d.alunos} alunos</p>
                              </div>
                            )
                          }}
                        />
                        <Scatter
                          data={data.desempenho
                            .filter((d) => d.nse_valor && d.ideb && d.ano_referencia === Math.max(...data.desempenho.map((x) => x.ano_referencia)))
                            .map((d) => {
                              const escola = data.escolasLista.find((e) => e.id === d.escola_id)
                              return { nome: d.escola_nome, nse: d.nse_valor, ideb: d.ideb, alunos: escola?.num_alunos ?? 100 }
                            })}
                          fill="#1066C6"
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Scatter IDEB x Custo/Aluno */}
                {data.desempenho.some((d) => d.custoPorAluno > 0 && d.ideb) && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                    <div className="mb-4 pb-3 border-b border-gray-50">
                      <h3 className="text-sm font-bold text-gray-800">Correlação IDEB × Custo/Aluno</h3>
                      <p className="text-xs text-gray-400 mt-0.5">relação entre investimento e desempenho</p>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                      <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" dataKey="custo" name="Custo/Aluno" tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v.toFixed(0)}`} label={{ value: 'Custo/Aluno', position: 'bottom', fontSize: 11 }} />
                        <YAxis type="number" dataKey="ideb" name="IDEB" domain={[0, 10]} tick={{ fontSize: 11 }} label={{ value: 'IDEB', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                        <Tooltip
                          content={({ payload }) => {
                            if (!payload?.length) return null
                            const d = payload[0].payload
                            return (
                              <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
                                <p className="font-bold text-gray-800">{d.nome}</p>
                                <p className="text-gray-600">Custo/Aluno: {formatCurrency(d.custo)}</p>
                                <p className="text-gray-600">IDEB: {d.ideb}</p>
                              </div>
                            )
                          }}
                        />
                        <Scatter
                          data={data.desempenho
                            .filter((d) => d.custoPorAluno > 0 && d.ideb && d.ano_referencia === Math.max(...data.desempenho.map((x) => x.ano_referencia)))
                            .map((d) => ({ nome: d.escola_nome, custo: d.custoPorAluno, ideb: d.ideb }))}
                          fill="#072F76"
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Ranking de Eficiência */}
              {data.desempenho.some((d) => d.custoPorAluno > 0 && d.ideb) && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow mb-6">
                  <div className="mb-4 pb-3 border-b border-gray-50">
                    <h3 className="text-sm font-bold text-gray-800">Ranking de Eficiência (IDEB / Custo por Aluno)</h3>
                    <p className="text-xs text-gray-400 mt-0.5">escolas com melhor relação desempenho/investimento — maior = mais eficiente</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-2 px-2 font-semibold text-gray-600">#</th>
                          <th className="text-left py-2 px-2 font-semibold text-gray-600">Escola</th>
                          <th className="text-right py-2 px-2 font-semibold text-gray-600">IDEB</th>
                          <th className="text-right py-2 px-2 font-semibold text-gray-600">Custo/Aluno</th>
                          <th className="text-right py-2 px-2 font-semibold text-gray-600">NSE</th>
                          <th className="text-right py-2 px-2 font-semibold text-gray-600">Índice Eficiência</th>
                          <th className="text-left py-2 px-2 font-semibold text-gray-600">Benchmark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.desempenho
                          .filter((d) => d.custoPorAluno > 0 && d.ideb && d.ano_referencia === Math.max(...data.desempenho.map((x) => x.ano_referencia)))
                          .map((d) => ({ ...d, eficiencia: (d.ideb ?? 0) / (d.custoPorAluno / 100) }))
                          .sort((a, b) => b.eficiencia - a.eficiencia)
                          .map((d, i, arr) => (
                            <tr key={d.escola_id} className={`border-b border-gray-50 ${i === 0 ? 'bg-[#1066C6]/5' : ''}`}>
                              <td className="py-2 px-2 font-bold text-gray-500">{i + 1}</td>
                              <td className="py-2 px-2 font-medium text-gray-800">{d.escola_nome}</td>
                              <td className="py-2 px-2 text-right font-semibold text-[#1066C6]">{d.ideb?.toFixed(1)}</td>
                              <td className="py-2 px-2 text-right text-gray-600">{formatCurrency(d.custoPorAluno)}</td>
                              <td className="py-2 px-2 text-right text-gray-600">{d.nse_nivel ?? '—'}</td>
                              <td className="py-2 px-2 text-right font-bold text-[#072F76]">{d.eficiencia.toFixed(2)}</td>
                              <td className="py-2 px-2">
                                {i === 0 && <span className="bg-[#1066C6] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">Referência</span>}
                                {i > 0 && <span className="text-gray-400 text-[10px]">Seguir: {arr[0].escola_nome}</span>}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* IDEB por Escola (barras) */}
              {(() => {
                const latestYear = Math.max(...data.desempenho.map((d) => d.ano_referencia))
                const idebData = data.desempenho
                  .filter((d) => d.ideb && d.ano_referencia === latestYear)
                  .sort((a, b) => (b.ideb ?? 0) - (a.ideb ?? 0))
                return idebData.length > 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow mb-6">
                    <div className="mb-4 pb-3 border-b border-gray-50">
                      <h3 className="text-sm font-bold text-gray-800">IDEB por Escola ({latestYear})</h3>
                      <p className="text-xs text-gray-400 mt-0.5">nota do Índice de Desenvolvimento da Educação Básica</p>
                    </div>
                    <ResponsiveContainer width="100%" height={Math.max(200, idebData.length * 48)}>
                      <BarChart
                        data={idebData.map((d) => ({ nome: d.escola_nome, ideb: d.ideb }))}
                        layout="vertical"
                        margin={{ top: 5, right: 60, left: 8, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                        <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={140} />
                        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                        <Bar dataKey="ideb" name="IDEB" radius={[0, 4, 4, 0]}>
                          {idebData.map((d, i) => (
                            <Cell key={i} fill={(d.ideb ?? 0) >= 6 ? '#1066C6' : (d.ideb ?? 0) >= 5 ? '#1B93ED' : '#AECBE6'} />
                          ))}
                          <LabelList dataKey="ideb" position="right" formatter={(v: unknown) => Number(v).toFixed(1)} style={{ fontSize: 11, fill: '#374151', fontWeight: 600 }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : null
              })()}
            </>
          )}
        </>
      )}

      {!data && !loading && !error && (
        <div className="text-center py-16 text-gray-400">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Selecione um município para visualizar os indicadores</p>
        </div>
      )}
    </div>
  )
}

// ─── KPI Card Component ──────────────────────────────────────────────────────
function KpiCard({ icon, label, value, subtitle, color }: {
  icon: React.ReactNode
  label: string
  value: string
  subtitle?: string
  color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-lg font-extrabold text-gray-900 leading-tight truncate">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}
