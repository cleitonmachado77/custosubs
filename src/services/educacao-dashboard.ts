import { supabase } from '@/lib/supabase'

export interface EduDashboardData {
  // Contexto
  municipioId: string
  municipioNome: string
  municipioEstado: string
  municipioHabitantes: number
  mes: number
  ano: number

  // Escolas
  totalEscolas: number
  escolasLista: {
    id: string
    nome: string
    codigo_inep?: string | null
    nivel_ensino: string
    zona: string
    num_alunos: number
    num_professores: number
    num_funcionarios: number
    nse_nivel?: string | null
    nse_valor?: number | null
    infraestrutura_indice?: number | null
  }[]

  // Totais de alunos e pessoal
  totalAlunos: number
  totalProfessores: number
  totalFuncionarios: number

  // Custos por categoria (município inteiro)
  custoPedagogico: number
  custoSocial: number
  custoAdministrativo: number
  custoMaterialPedagogico: number
  custoMerenda: number
  custoDespesasFixas: number
  custoTerceirizados: number
  custoTotal: number

  // Custos por escola
  custosPorEscola: {
    nome: string
    pedagogico: number
    social: number
    administrativo: number
    materialPedagogico: number
    merenda: number
    despesasFixas: number
    terceirizados: number
    total: number
    numAlunos: number
    custoPorAluno: number
  }[]

  // Funcionários
  totalServidores: number
  totalSalarios: number
  salariosPorCargo: { cargo: string; total: number; quantidade: number }[]

  // Distribuição por tipo de custo (pessoal)
  funcionariosPorTipoCusto: {
    tipo: string
    label: string
    quantidade: number
    totalSalarios: number
  }[]

  // Distribuição por vínculo
  funcionariosPorVinculo: {
    vinculo: string
    label: string
    quantidade: number
    totalSalarios: number
  }[]

  // Indicadores calculados (KPIs)
  custoMedioPorAluno: number
  custoPedagogicoPorAluno: number
  custoSocialPorAluno: number
  custoAdministrativoPorAluno: number
  custoPerCapitaMunicipal: number
  relacaoAlunoProfessor: number
  relacaoAlunoFuncionario: number
  escolasPor10kHab: number
  professorPor10kHab: number
  custoAlunoPctSalarioMinimo: number

  // Percentuais sobre custo total
  pctPedagogico: number
  pctSocial: number
  pctAdministrativo: number
  pctMaterialPedagogico: number
  pctMerenda: number
  pctDespesasFixas: number
  pctTerceirizados: number

  // Desempenho educacional
  desempenho: {
    escola_id: string
    escola_nome: string
    ano_referencia: number
    ideb: number | null
    nota_portugues: number | null
    nota_matematica: number | null
    taxa_aprovacao: number | null
    nse_nivel: string | null
    nse_valor: number | null
    custoPorAluno: number
  }[]

  // Coeficiente de variação dos custos
  cvCustos: number
}

export async function getEduDashboardData(
  municipioId: string,
  mes: number,
  ano: number
): Promise<EduDashboardData> {
  // Busca município
  const { data: municipio, error: errMun } = await supabase
    .from('municipios')
    .select('*')
    .eq('id', municipioId)
    .single()
  if (errMun) throw errMun

  // Busca todas as escolas do município
  const { data: escolasLista, error: errEsc } = await supabase
    .from('escolas')
    .select('id, nome, codigo_inep, nivel_ensino, zona, num_alunos, num_professores, num_funcionarios, nse_nivel, nse_valor, infraestrutura_indice')
    .eq('municipio_id', municipioId)
    .order('nome')
  if (errEsc) throw errEsc

  const escolaIds = (escolasLista ?? []).map((e) => e.id)

  if (escolaIds.length === 0) {
    return emptyEduDashboard(municipio, mes, ano)
  }

  // Busca dados do período em paralelo
  const buildQuery = (table: string, fkField = 'escola_id') => {
    let q = supabase.from(table).select('*').in(fkField, escolaIds).eq('ano', ano)
    if (mes > 0) q = q.eq('mes', mes)
    return q
  }

  const [funcionarios, itensCusto, desempenhoResult] = await Promise.all([
    buildQuery('edu_funcionarios'),
    buildQuery('edu_itens_custo'),
    supabase.from('edu_desempenho').select('*').in('escola_id', escolaIds).order('ano_referencia', { ascending: false }),
  ])

  if (funcionarios.error) throw funcionarios.error
  if (itensCusto.error) throw itensCusto.error
  if (desempenhoResult.error) throw desempenhoResult.error

  const funcs = funcionarios.data ?? []
  const itens = itensCusto.data ?? []
  const desempenhoData = desempenhoResult.data ?? []

  // ── Totais de alunos e pessoal ────────────────────────────────
  const totalAlunos = (escolasLista ?? []).reduce((s, e) => s + e.num_alunos, 0)
  const totalProfessores = (escolasLista ?? []).reduce((s, e) => s + e.num_professores, 0)
  const totalFuncionarios = (escolasLista ?? []).reduce((s, e) => s + e.num_funcionarios, 0)

  // ── Custos de pessoal por tipo ────────────────────────────────
  const custoPedagogico = funcs
    .filter((f) => f.tipo_custo === 'pedagogico')
    .reduce((s, f) => s + Number(f.salario), 0)
  const custoSocial = funcs
    .filter((f) => f.tipo_custo === 'social')
    .reduce((s, f) => s + Number(f.salario), 0)
  const custoAdministrativo = funcs
    .filter((f) => f.tipo_custo === 'administrativo')
    .reduce((s, f) => s + Number(f.salario), 0)

  // ── Custos de itens por categoria ─────────────────────────────
  const custoMaterialPedagogico = itens
    .filter((i) => i.categoria === 'material_pedagogico')
    .reduce((s, i) => s + Number(i.valor), 0)
  const custoMerenda = itens
    .filter((i) => i.categoria === 'merenda')
    .reduce((s, i) => s + Number(i.valor), 0)
  const custoDespesasFixas = itens
    .filter((i) => i.categoria === 'despesa_fixa')
    .reduce((s, i) => s + Number(i.valor), 0)
  const custoTerceirizados = itens
    .filter((i) => i.categoria === 'terceirizado')
    .reduce((s, i) => s + Number(i.valor), 0)

  const custoTotal =
    custoPedagogico + custoSocial + custoAdministrativo +
    custoMaterialPedagogico + custoMerenda + custoDespesasFixas + custoTerceirizados

  // ── Custos por escola ─────────────────────────────────────────
  const custosPorEscola = (escolasLista ?? []).map((escola) => {
    const pedagogico = funcs
      .filter((f) => f.escola_id === escola.id && f.tipo_custo === 'pedagogico')
      .reduce((s, f) => s + Number(f.salario), 0)
    const social = funcs
      .filter((f) => f.escola_id === escola.id && f.tipo_custo === 'social')
      .reduce((s, f) => s + Number(f.salario), 0)
    const administrativo = funcs
      .filter((f) => f.escola_id === escola.id && f.tipo_custo === 'administrativo')
      .reduce((s, f) => s + Number(f.salario), 0)
    const materialPedagogico = itens
      .filter((i) => i.escola_id === escola.id && i.categoria === 'material_pedagogico')
      .reduce((s, i) => s + Number(i.valor), 0)
    const merenda = itens
      .filter((i) => i.escola_id === escola.id && i.categoria === 'merenda')
      .reduce((s, i) => s + Number(i.valor), 0)
    const despesasFixas = itens
      .filter((i) => i.escola_id === escola.id && i.categoria === 'despesa_fixa')
      .reduce((s, i) => s + Number(i.valor), 0)
    const terceirizados = itens
      .filter((i) => i.escola_id === escola.id && i.categoria === 'terceirizado')
      .reduce((s, i) => s + Number(i.valor), 0)
    const total = pedagogico + social + administrativo + materialPedagogico + merenda + despesasFixas + terceirizados
    const numAlunos = escola.num_alunos
    return {
      nome: escola.nome,
      pedagogico,
      social,
      administrativo,
      materialPedagogico,
      merenda,
      despesasFixas,
      terceirizados,
      total,
      numAlunos,
      custoPorAluno: numAlunos > 0 ? total / numAlunos : 0,
    }
  })

  // ── Funcionários ──────────────────────────────────────────────
  const totalServidores = funcs.length
  const totalSalarios = funcs.reduce((s, f) => s + Number(f.salario), 0)

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

  // ── Distribuição por tipo de custo ────────────────────────────
  const TIPO_LABELS: Record<string, string> = {
    pedagogico: 'Pedagógico',
    social: 'Social',
    administrativo: 'Administrativo',
  }
  const tipoMap: Record<string, { quantidade: number; totalSalarios: number }> = {}
  funcs.forEach((f) => {
    const t = f.tipo_custo || 'pedagogico'
    if (!tipoMap[t]) tipoMap[t] = { quantidade: 0, totalSalarios: 0 }
    tipoMap[t].quantidade += 1
    tipoMap[t].totalSalarios += Number(f.salario)
  })
  const funcionariosPorTipoCusto = Object.entries(tipoMap).map(([tipo, v]) => ({
    tipo,
    label: TIPO_LABELS[tipo] ?? tipo,
    ...v,
  })).sort((a, b) => b.totalSalarios - a.totalSalarios)

  // ── Distribuição por vínculo ──────────────────────────────────
  const VINCULO_LABELS: Record<string, string> = {
    concursado: 'Concursado',
    clt: 'CLT',
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

  // ── Indicadores (KPIs) ────────────────────────────────────────
  const hab = municipio.habitantes
  const custoMedioPorAluno = totalAlunos > 0 ? custoTotal / totalAlunos : 0
  const custoPedagogicoPorAluno = totalAlunos > 0 ? (custoPedagogico + custoMaterialPedagogico) / totalAlunos : 0
  const custoSocialPorAluno = totalAlunos > 0 ? (custoSocial + custoMerenda) / totalAlunos : 0
  const custoAdministrativoPorAluno = totalAlunos > 0 ? (custoAdministrativo + custoDespesasFixas + custoTerceirizados) / totalAlunos : 0
  const custoPerCapitaMunicipal = hab > 0 ? custoTotal / hab : 0
  const relacaoAlunoProfessor = totalProfessores > 0 ? totalAlunos / totalProfessores : 0
  const relacaoAlunoFuncionario = totalFuncionarios > 0 ? totalAlunos / totalFuncionarios : 0
  const escolasPor10kHab = hab > 0 ? ((escolasLista ?? []).length / hab) * 10000 : 0
  const professorPor10kHab = hab > 0 ? (totalProfessores / hab) * 10000 : 0

  // Custo/Aluno como % do salário mínimo (2026: R$ 1.518,00)
  const SALARIO_MINIMO = 1518.00
  const custoAlunoPctSalarioMinimo = custoMedioPorAluno > 0 ? (custoMedioPorAluno / SALARIO_MINIMO) * 100 : 0

  // Coeficiente de variação dos custos entre escolas
  const custosAluno = custosPorEscola.filter((e) => e.custoPorAluno > 0).map((e) => e.custoPorAluno)
  let cvCustos = 0
  if (custosAluno.length > 1) {
    const media = custosAluno.reduce((s, v) => s + v, 0) / custosAluno.length
    const variancia = custosAluno.reduce((s, v) => s + Math.pow(v - media, 2), 0) / custosAluno.length
    const desvio = Math.sqrt(variancia)
    cvCustos = media > 0 ? (desvio / media) * 100 : 0
  }

  // Desempenho educacional com custo por aluno
  const desempenho = desempenhoData.map((d) => {
    const escola = (escolasLista ?? []).find((e) => e.id === d.escola_id)
    const custoEscola = custosPorEscola.find((e) => e.nome === escola?.nome)
    return {
      escola_id: d.escola_id,
      escola_nome: escola?.nome ?? 'Desconhecida',
      ano_referencia: d.ano_referencia,
      ideb: d.ideb,
      nota_portugues: d.nota_portugues,
      nota_matematica: d.nota_matematica,
      taxa_aprovacao: d.taxa_aprovacao,
      nse_nivel: escola?.nse_nivel ?? null,
      nse_valor: escola?.nse_valor ?? null,
      custoPorAluno: custoEscola?.custoPorAluno ?? 0,
    }
  })

  const pct = (v: number) => (custoTotal > 0 ? (v / custoTotal) * 100 : 0)

  return {
    municipioId,
    municipioNome: municipio.nome,
    municipioEstado: municipio.estado,
    municipioHabitantes: hab,
    mes,
    ano,
    totalEscolas: (escolasLista ?? []).length,
    escolasLista: escolasLista ?? [],
    totalAlunos,
    totalProfessores,
    totalFuncionarios,
    custoPedagogico,
    custoSocial,
    custoAdministrativo,
    custoMaterialPedagogico,
    custoMerenda,
    custoDespesasFixas,
    custoTerceirizados,
    custoTotal,
    custosPorEscola,
    totalServidores,
    totalSalarios,
    salariosPorCargo,
    funcionariosPorTipoCusto,
    funcionariosPorVinculo,
    custoMedioPorAluno,
    custoPedagogicoPorAluno,
    custoSocialPorAluno,
    custoAdministrativoPorAluno,
    custoPerCapitaMunicipal,
    relacaoAlunoProfessor,
    relacaoAlunoFuncionario,
    escolasPor10kHab,
    professorPor10kHab,
    custoAlunoPctSalarioMinimo,
    pctPedagogico: pct(custoPedagogico + custoMaterialPedagogico),
    pctSocial: pct(custoSocial + custoMerenda),
    pctAdministrativo: pct(custoAdministrativo + custoDespesasFixas + custoTerceirizados),
    pctMaterialPedagogico: pct(custoMaterialPedagogico),
    pctMerenda: pct(custoMerenda),
    pctDespesasFixas: pct(custoDespesasFixas),
    pctTerceirizados: pct(custoTerceirizados),
    desempenho,
    cvCustos,
  }
}

function emptyEduDashboard(
  municipio: { id: string; nome: string; estado: string; habitantes: number },
  mes: number,
  ano: number
): EduDashboardData {
  return {
    municipioId: municipio.id,
    municipioNome: municipio.nome,
    municipioEstado: municipio.estado,
    municipioHabitantes: municipio.habitantes,
    mes,
    ano,
    totalEscolas: 0,
    escolasLista: [],
    totalAlunos: 0,
    totalProfessores: 0,
    totalFuncionarios: 0,
    custoPedagogico: 0,
    custoSocial: 0,
    custoAdministrativo: 0,
    custoMaterialPedagogico: 0,
    custoMerenda: 0,
    custoDespesasFixas: 0,
    custoTerceirizados: 0,
    custoTotal: 0,
    custosPorEscola: [],
    totalServidores: 0,
    totalSalarios: 0,
    salariosPorCargo: [],
    funcionariosPorTipoCusto: [],
    funcionariosPorVinculo: [],
    custoMedioPorAluno: 0,
    custoPedagogicoPorAluno: 0,
    custoSocialPorAluno: 0,
    custoAdministrativoPorAluno: 0,
    custoPerCapitaMunicipal: 0,
    relacaoAlunoProfessor: 0,
    relacaoAlunoFuncionario: 0,
    escolasPor10kHab: 0,
    professorPor10kHab: 0,
    custoAlunoPctSalarioMinimo: 0,
    pctPedagogico: 0,
    pctSocial: 0,
    pctAdministrativo: 0,
    pctMaterialPedagogico: 0,
    pctMerenda: 0,
    pctDespesasFixas: 0,
    pctTerceirizados: 0,
    desempenho: [],
    cvCustos: 0,
  }
}
