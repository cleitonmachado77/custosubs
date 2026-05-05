import { supabase } from '@/lib/supabase'

export interface DashboardData {
  // Contexto
  municipioId: string
  municipioNome: string
  municipioEstado: string
  municipioHabitantes: number
  mes: number
  ano: number

  // UBS
  totalUbs: number
  ubsLista: { id: string; nome: string }[]

  // Atendimentos
  totalAtendimentos: number
  atendimentosPorUbs: { nome: string; total: number }[]

  // Custos por categoria (município inteiro)
  custosPessoal: number
  custosMateriaisConsumo: number
  custosInsumos: number
  custosAdministrativos: number
  custosTerceirizados: number
  custoTotal: number

  // Custos por UBS
  custosPorUbs: {
    nome: string
    pessoal: number
    materiais: number
    insumos: number
    administrativo: number
    terceirizados: number
    total: number
  }[]

  // Funcionários
  totalFuncionarios: number
  totalSalarios: number
  salariosPorCargo: { cargo: string; total: number; quantidade: number }[]

  // Indicadores calculados
  custoMedioPorServidor: number
  custoPorAtendimento: number
  custoPerCapita: number
  atendimentosPerCapita: number
  ubsPor10kHab: number
  servidoresPor10kHab: number

  // % sobre custo total
  pctPessoal: number
  pctMateriais: number
  pctInsumos: number
  pctTerceirizados: number
  pctAdministrativo: number
}

export async function getDashboardData(
  municipioId: string,
  mes: number,
  ano: number
): Promise<DashboardData> {
  // Busca município
  const { data: municipio, error: errMun } = await supabase
    .from('municipios')
    .select('*')
    .eq('id', municipioId)
    .single()
  if (errMun) throw errMun

  // Busca todas as UBS do município
  const { data: ubsLista, error: errUbs } = await supabase
    .from('ubs')
    .select('id, nome')
    .eq('municipio_id', municipioId)
    .order('nome')
  if (errUbs) throw errUbs

  const ubsIds = (ubsLista ?? []).map((u) => u.id)

  if (ubsIds.length === 0) {
    return emptyDashboard(municipio, mes, ano)
  }

  // Busca todos os dados do período em paralelo
  const [funcionarios, producao, itensCusto] = await Promise.all([
    supabase
      .from('funcionarios')
      .select('*')
      .in('ubs_id', ubsIds)
      .eq('mes', mes)
      .eq('ano', ano),
    supabase
      .from('producao_eventos')
      .select('*')
      .in('ubs_id', ubsIds)
      .eq('mes', mes)
      .eq('ano', ano),
    supabase
      .from('itens_custo')
      .select('*')
      .in('ubs_id', ubsIds)
      .eq('mes', mes)
      .eq('ano', ano),
  ])

  if (funcionarios.error) throw funcionarios.error
  if (producao.error) throw producao.error
  if (itensCusto.error) throw itensCusto.error

  const funcs = funcionarios.data ?? []
  const prod = producao.data ?? []
  const itens = itensCusto.data ?? []

  // ── Atendimentos ──────────────────────────────────────────────
  const totalAtendimentos = prod.reduce((s, p) => s + p.quantidade_atendimentos, 0)

  const atendimentosPorUbs = (ubsLista ?? []).map((ubs) => ({
    nome: ubs.nome,
    total: prod
      .filter((p) => p.ubs_id === ubs.id)
      .reduce((s, p) => s + p.quantidade_atendimentos, 0),
  }))

  // ── Custos por categoria ──────────────────────────────────────
  const custosPessoal = funcs.reduce((s, f) => s + Number(f.salario), 0)
  const custosMateriaisConsumo = itens
    .filter((i) => i.categoria === 'material_consumo')
    .reduce((s, i) => s + Number(i.valor), 0)
  const custosInsumos = itens
    .filter((i) => i.categoria === 'insumo')
    .reduce((s, i) => s + Number(i.valor), 0)
  const custosAdministrativos = itens
    .filter((i) => i.categoria === 'administrativo')
    .reduce((s, i) => s + Number(i.valor), 0)
  const custosTerceirizados = itens
    .filter((i) => i.categoria === 'terceirizado')
    .reduce((s, i) => s + Number(i.valor), 0)
  const custoTotal =
    custosPessoal + custosMateriaisConsumo + custosInsumos + custosAdministrativos + custosTerceirizados

  // ── Custos por UBS ────────────────────────────────────────────
  const custosPorUbs = (ubsLista ?? []).map((ubs) => {
    const pessoal = funcs
      .filter((f) => f.ubs_id === ubs.id)
      .reduce((s, f) => s + Number(f.salario), 0)
    const materiais = itens
      .filter((i) => i.ubs_id === ubs.id && i.categoria === 'material_consumo')
      .reduce((s, i) => s + Number(i.valor), 0)
    const insumos = itens
      .filter((i) => i.ubs_id === ubs.id && i.categoria === 'insumo')
      .reduce((s, i) => s + Number(i.valor), 0)
    const administrativo = itens
      .filter((i) => i.ubs_id === ubs.id && i.categoria === 'administrativo')
      .reduce((s, i) => s + Number(i.valor), 0)
    const terceirizados = itens
      .filter((i) => i.ubs_id === ubs.id && i.categoria === 'terceirizado')
      .reduce((s, i) => s + Number(i.valor), 0)
    return {
      nome: ubs.nome,
      pessoal,
      materiais,
      insumos,
      administrativo,
      terceirizados,
      total: pessoal + materiais + insumos + administrativo + terceirizados,
    }
  })

  // ── Funcionários ──────────────────────────────────────────────
  const totalFuncionarios = funcs.length
  const totalSalarios = custosPessoal

  const cargoMap: Record<string, { total: number; quantidade: number }> = {}
  funcs.forEach((f) => {
    const cargo = f.cargo || 'Não informado'
    if (!cargoMap[cargo]) cargoMap[cargo] = { total: 0, quantidade: 0 }
    cargoMap[cargo].total += Number(f.salario)
    cargoMap[cargo].quantidade += 1
  })
  const salariosPorCargo = Object.entries(cargoMap)
    .map(([cargo, v]) => ({ cargo, ...v }))
    .sort((a, b) => b.total - a.total)

  // ── Indicadores ───────────────────────────────────────────────
  const hab = municipio.habitantes
  const custoMedioPorServidor = totalFuncionarios > 0 ? totalSalarios / totalFuncionarios : 0
  const custoPorAtendimento = totalAtendimentos > 0 ? custoTotal / totalAtendimentos : 0
  const custoPerCapita = hab > 0 ? custoTotal / hab : 0
  const atendimentosPerCapita = hab > 0 ? totalAtendimentos / hab : 0
  const ubsPor10kHab = hab > 0 ? ((ubsLista ?? []).length / hab) * 10000 : 0
  const servidoresPor10kHab = hab > 0 ? (totalFuncionarios / hab) * 10000 : 0

  const pct = (v: number) => (custoTotal > 0 ? (v / custoTotal) * 100 : 0)

  return {
    municipioId,
    municipioNome: municipio.nome,
    municipioEstado: municipio.estado,
    municipioHabitantes: hab,
    mes,
    ano,
    totalUbs: (ubsLista ?? []).length,
    ubsLista: ubsLista ?? [],
    totalAtendimentos,
    atendimentosPorUbs,
    custosPessoal,
    custosMateriaisConsumo,
    custosInsumos,
    custosAdministrativos,
    custosTerceirizados,
    custoTotal,
    custosPorUbs,
    totalFuncionarios,
    totalSalarios,
    salariosPorCargo,
    custoMedioPorServidor,
    custoPorAtendimento,
    custoPerCapita,
    atendimentosPerCapita,
    ubsPor10kHab,
    servidoresPor10kHab,
    pctPessoal: pct(custosPessoal),
    pctMateriais: pct(custosMateriaisConsumo),
    pctInsumos: pct(custosInsumos),
    pctTerceirizados: pct(custosTerceirizados),
    pctAdministrativo: pct(custosAdministrativos),
  }
}

function emptyDashboard(municipio: { id: string; nome: string; estado: string; habitantes: number }, mes: number, ano: number): DashboardData {
  return {
    municipioId: municipio.id,
    municipioNome: municipio.nome,
    municipioEstado: municipio.estado,
    municipioHabitantes: municipio.habitantes,
    mes, ano,
    totalUbs: 0, ubsLista: [],
    totalAtendimentos: 0, atendimentosPorUbs: [],
    custosPessoal: 0, custosMateriaisConsumo: 0, custosInsumos: 0,
    custosAdministrativos: 0, custosTerceirizados: 0, custoTotal: 0,
    custosPorUbs: [], totalFuncionarios: 0, totalSalarios: 0,
    salariosPorCargo: [], custoMedioPorServidor: 0, custoPorAtendimento: 0,
    custoPerCapita: 0, atendimentosPerCapita: 0, ubsPor10kHab: 0,
    servidoresPor10kHab: 0, pctPessoal: 0, pctMateriais: 0,
    pctInsumos: 0, pctTerceirizados: 0, pctAdministrativo: 0,
  }
}
