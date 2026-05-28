import { supabase } from '@/lib/supabase'

export interface CustoPorUnidade {
  nome: string
  tipo: 'ubs' | 'secretaria' | 'outra_unidade'
  pessoal: number
  materiais: number
  insumos: number
  administrativo: number
  terceirizados: number
  total: number
}

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
  ubsLista: { id: string; nome: string; cnes?: string | null; populacao_referencia?: number | null; num_equipes_esf?: number | null; servicos?: string[] | null }[]

  // Secretarias de Saúde
  totalSecretarias: number
  secretariasLista: { id: string; nome: string }[]
  custosPorSecretaria: CustoPorUnidade[]

  // Outras Unidades de Saúde
  totalOutrasUnidades: number
  outrasUnidadesLista: { id: string; nome: string; tipo: string }[]
  custosPorOutraUnidade: CustoPorUnidade[]

  // Equipes ESF e cobertura
  totalEquipesEsf: number
  totalPopReferencia: number
  popPorEquipeEsf: number
  coberturaEsf: number  // % da pop. do município coberta pelas equipes

  // Serviços disponíveis (quantas UBS oferecem cada serviço)
  servicosDisponiveis: { servico: string; quantidade: number }[]

  // Funcionários por equipe ESF
  funcionariosPorEquipe: { equipe: string; quantidade: number; totalSalarios: number }[]

  // Atendimentos
  totalAtendimentos: number
  atendimentosPorUbs: { nome: string; total: number }[]

  // Custos por categoria (município inteiro — inclui UBS + Secretarias + Outras Unidades)
  custosPessoal: number
  custosMateriaisConsumo: number
  custosInsumos: number
  custosAdministrativos: number
  custosTerceirizados: number
  custoTotal: number

  // Custos por UBS
  custosPorUbs: CustoPorUnidade[]

  // Custos consolidados por todas as unidades (UBS + Secretarias + Outras)
  custosPorTodasUnidades: CustoPorUnidade[]

  // Funcionários
  totalFuncionarios: number
  totalSalarios: number
  salariosPorCargo: { cargo: string; total: number; quantidade: number }[]

  // Distribuição por vínculo
  funcionariosPorVinculo: {
    vinculo: string
    label: string
    quantidade: number
    totalSalarios: number
  }[]

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
    .select('id, nome, cnes, populacao_referencia, num_equipes_esf, servicos')
    .eq('municipio_id', municipioId)
    .order('nome')
  if (errUbs) throw errUbs

  // Busca secretarias de saúde do município
  const { data: secretariasLista, error: errSec } = await supabase
    .from('secretarias_saude')
    .select('id, nome')
    .eq('municipio_id', municipioId)
    .order('nome')
  if (errSec) throw errSec

  // Busca outras unidades de saúde do município
  const { data: outrasUnidadesLista, error: errOutras } = await supabase
    .from('outras_unidades_saude')
    .select('id, nome, tipo')
    .eq('municipio_id', municipioId)
    .order('nome')
  if (errOutras) throw errOutras

  const ubsIds = (ubsLista ?? []).map((u) => u.id)
  const secIds = (secretariasLista ?? []).map((s) => s.id)
  const outrasIds = (outrasUnidadesLista ?? []).map((o) => o.id)
  const allIds = [...ubsIds, ...secIds, ...outrasIds]

  if (allIds.length === 0) {
    return emptyDashboard(municipio, mes, ano)
  }

  // Busca todos os dados do período em paralelo
  // Se mes === 0, busca o ano inteiro (sem filtro de mês)
  const buildQuery = (table: string) => {
    let q = supabase.from(table).select('*').in('ubs_id', allIds).eq('ano', ano)
    if (mes > 0) q = q.eq('mes', mes)
    return q
  }

  const [funcionarios, producao, itensCusto] = await Promise.all([
    buildQuery('funcionarios'),
    buildQuery('producao_eventos'),
    buildQuery('itens_custo'),
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
  const custosPorUbs: CustoPorUnidade[] = (ubsLista ?? []).map((ubs) => {
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
      tipo: 'ubs' as const,
      pessoal,
      materiais,
      insumos,
      administrativo,
      terceirizados,
      total: pessoal + materiais + insumos + administrativo + terceirizados,
    }
  })

  // ── Custos por Secretaria ─────────────────────────────────────
  const custosPorSecretaria: CustoPorUnidade[] = (secretariasLista ?? []).map((sec) => {
    const pessoal = funcs
      .filter((f) => f.ubs_id === sec.id)
      .reduce((s, f) => s + Number(f.salario), 0)
    const materiais = itens
      .filter((i) => i.ubs_id === sec.id && i.categoria === 'material_consumo')
      .reduce((s, i) => s + Number(i.valor), 0)
    const insumos = itens
      .filter((i) => i.ubs_id === sec.id && i.categoria === 'insumo')
      .reduce((s, i) => s + Number(i.valor), 0)
    const administrativo = itens
      .filter((i) => i.ubs_id === sec.id && i.categoria === 'administrativo')
      .reduce((s, i) => s + Number(i.valor), 0)
    const terceirizados = itens
      .filter((i) => i.ubs_id === sec.id && i.categoria === 'terceirizado')
      .reduce((s, i) => s + Number(i.valor), 0)
    return {
      nome: sec.nome,
      tipo: 'secretaria' as const,
      pessoal,
      materiais,
      insumos,
      administrativo,
      terceirizados,
      total: pessoal + materiais + insumos + administrativo + terceirizados,
    }
  })

  // ── Custos por Outra Unidade ──────────────────────────────────
  const custosPorOutraUnidade: CustoPorUnidade[] = (outrasUnidadesLista ?? []).map((ou) => {
    const pessoal = funcs
      .filter((f) => f.ubs_id === ou.id)
      .reduce((s, f) => s + Number(f.salario), 0)
    const materiais = itens
      .filter((i) => i.ubs_id === ou.id && i.categoria === 'material_consumo')
      .reduce((s, i) => s + Number(i.valor), 0)
    const insumos = itens
      .filter((i) => i.ubs_id === ou.id && i.categoria === 'insumo')
      .reduce((s, i) => s + Number(i.valor), 0)
    const administrativo = itens
      .filter((i) => i.ubs_id === ou.id && i.categoria === 'administrativo')
      .reduce((s, i) => s + Number(i.valor), 0)
    const terceirizados = itens
      .filter((i) => i.ubs_id === ou.id && i.categoria === 'terceirizado')
      .reduce((s, i) => s + Number(i.valor), 0)
    return {
      nome: `${ou.nome} (${ou.tipo})`,
      tipo: 'outra_unidade' as const,
      pessoal,
      materiais,
      insumos,
      administrativo,
      terceirizados,
      total: pessoal + materiais + insumos + administrativo + terceirizados,
    }
  })

  // ── Custos consolidados por todas as unidades ─────────────────
  const custosPorTodasUnidades: CustoPorUnidade[] = [
    ...custosPorUbs,
    ...custosPorSecretaria,
    ...custosPorOutraUnidade,
  ].filter((u) => u.total > 0).sort((a, b) => b.total - a.total)

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

  // ── Distribuição por vínculo ──────────────────────────────────
  const VINCULO_LABELS: Record<string, string> = {
    concursado:   'Concursado',
    clt:          'CLT',
    terceirizado: 'Terceirizado',
  }
  const vinculoMap: Record<string, { quantidade: number; totalSalarios: number }> = {}
  funcs.forEach((f) => {
    const v = f.vinculo || 'concursado'
    if (!vinculoMap[v]) vinculoMap[v] = { quantidade: 0, totalSalarios: 0 }
    vinculoMap[v].quantidade += 1
    vinculoMap[v].totalSalarios += Number(f.salario)
  })
  const funcionariosPorVinculo = Object.entries(vinculoMap).map(([vinculo, v]) => ({
    vinculo,
    label: VINCULO_LABELS[vinculo] ?? vinculo,
    ...v,
  })).sort((a, b) => b.quantidade - a.quantidade)

  // ── Indicadores ───────────────────────────────────────────────
  const hab = municipio.habitantes

  // ── Equipes ESF e cobertura ───────────────────────────────────
  const totalEquipesEsf = (ubsLista ?? []).reduce((s, u) => s + (u.num_equipes_esf ?? 0), 0)
  const totalPopReferencia = (ubsLista ?? []).reduce((s, u) => s + (u.populacao_referencia ?? 0), 0)
  const popPorEquipeEsf = totalEquipesEsf > 0 ? totalPopReferencia / totalEquipesEsf : 0
  const coberturaEsf = hab > 0 ? Math.min((totalPopReferencia / hab) * 100, 100) : 0

  // ── Serviços disponíveis ──────────────────────────────────────
  const servicoCount: Record<string, number> = {}
  ;(ubsLista ?? []).forEach((u) => {
    (u.servicos ?? []).forEach((s: string) => {
      servicoCount[s] = (servicoCount[s] || 0) + 1
    })
  })
  const servicosDisponiveis = Object.entries(servicoCount)
    .map(([servico, quantidade]) => ({ servico, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade)

  // ── Funcionários por equipe ESF ───────────────────────────────
  const equipeMap: Record<string, { quantidade: number; totalSalarios: number }> = {}
  funcs.forEach((f) => {
    const eq = f.equipe && f.equipe > 0 ? `Equipe ${f.equipe}` : 'Sem equipe'
    if (!equipeMap[eq]) equipeMap[eq] = { quantidade: 0, totalSalarios: 0 }
    equipeMap[eq].quantidade += 1
    equipeMap[eq].totalSalarios += Number(f.salario)
  })
  const funcionariosPorEquipe = Object.entries(equipeMap)
    .map(([equipe, v]) => ({ equipe, ...v }))
    .sort((a, b) => {
      if (a.equipe === 'Sem equipe') return 1
      if (b.equipe === 'Sem equipe') return -1
      return a.equipe.localeCompare(b.equipe)
    })
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
    totalSecretarias: (secretariasLista ?? []).length,
    secretariasLista: secretariasLista ?? [],
    custosPorSecretaria,
    totalOutrasUnidades: (outrasUnidadesLista ?? []).length,
    outrasUnidadesLista: outrasUnidadesLista ?? [],
    custosPorOutraUnidade,
    totalEquipesEsf,
    totalPopReferencia,
    popPorEquipeEsf,
    coberturaEsf,
    servicosDisponiveis,
    funcionariosPorEquipe,
    totalAtendimentos,
    atendimentosPorUbs,
    custosPessoal,
    custosMateriaisConsumo,
    custosInsumos,
    custosAdministrativos,
    custosTerceirizados,
    custoTotal,
    custosPorUbs,
    custosPorTodasUnidades,
    totalFuncionarios,
    totalSalarios,
    salariosPorCargo,
    funcionariosPorVinculo,
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
    totalSecretarias: 0, secretariasLista: [], custosPorSecretaria: [],
    totalOutrasUnidades: 0, outrasUnidadesLista: [], custosPorOutraUnidade: [],
    totalEquipesEsf: 0, totalPopReferencia: 0, popPorEquipeEsf: 0, coberturaEsf: 0,
    servicosDisponiveis: [], funcionariosPorEquipe: [],
    totalAtendimentos: 0, atendimentosPorUbs: [],
    custosPessoal: 0, custosMateriaisConsumo: 0, custosInsumos: 0,
    custosAdministrativos: 0, custosTerceirizados: 0, custoTotal: 0,
    custosPorUbs: [], custosPorTodasUnidades: [],
    totalFuncionarios: 0, totalSalarios: 0,
    salariosPorCargo: [], funcionariosPorVinculo: [], custoMedioPorServidor: 0, custoPorAtendimento: 0,
    custoPerCapita: 0, atendimentosPerCapita: 0, ubsPor10kHab: 0,
    servidoresPor10kHab: 0, pctPessoal: 0, pctMateriais: 0,
    pctInsumos: 0, pctTerceirizados: 0, pctAdministrativo: 0,
  }
}
