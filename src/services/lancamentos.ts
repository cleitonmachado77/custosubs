import { supabase } from '@/lib/supabase'
import type { Funcionario, ProducaoEvento, ItemCusto, CategoriaItemCusto } from '@/types'

// ─── Funcionários ─────────────────────────────────────────────────────────────

export async function getFuncionarios(ubsId: string, mes: number, ano: number): Promise<Funcionario[]> {
  const { data, error } = await supabase
    .from('funcionarios')
    .select('*')
    .eq('ubs_id', ubsId)
    .eq('mes', mes)
    .eq('ano', ano)
    .order('nome')
  if (error) throw error
  return data ?? []
}

export async function upsertFuncionarios(
  ubsId: string,
  mes: number,
  ano: number,
  funcionarios: Omit<Funcionario, 'id' | 'ubs_id' | 'created_at'>[]
): Promise<void> {
  // Remove registros anteriores do período
  await supabase.from('funcionarios').delete().eq('ubs_id', ubsId).eq('mes', mes).eq('ano', ano)

  if (funcionarios.length === 0) return

  const rows = funcionarios.map((f) => ({
    nome: f.nome,
    cargo: f.cargo,
    vinculo: f.vinculo,
    salario: f.salario,
    equipe: f.equipe && f.equipe > 0 ? f.equipe : null,
    ubs_id: ubsId,
    mes,
    ano,
  }))
  const { error } = await supabase.from('funcionarios').insert(rows)
  if (error) throw error
}

// ─── Produção ─────────────────────────────────────────────────────────────────

export async function getProducao(ubsId: string, mes: number, ano: number): Promise<ProducaoEvento[]> {
  const { data, error } = await supabase
    .from('producao_eventos')
    .select('*')
    .eq('ubs_id', ubsId)
    .eq('mes', mes)
    .eq('ano', ano)
    .order('evento')
  if (error) throw error
  return data ?? []
}

export async function upsertProducao(
  ubsId: string,
  mes: number,
  ano: number,
  eventos: { evento: string; quantidade_atendimentos: number; responsaveis?: string[] }[]
): Promise<void> {
  await supabase.from('producao_eventos').delete().eq('ubs_id', ubsId).eq('mes', mes).eq('ano', ano)

  if (eventos.length === 0) return

  const rows = eventos.map((e) => ({
    evento: e.evento,
    quantidade_atendimentos: e.quantidade_atendimentos,
    responsaveis: e.responsaveis && e.responsaveis.length > 0 ? e.responsaveis : null,
    ubs_id: ubsId,
    mes,
    ano,
  }))
  const { error } = await supabase.from('producao_eventos').insert(rows)
  if (error) throw error
}

// ─── Itens de Custo ───────────────────────────────────────────────────────────

export async function getItensCusto(
  ubsId: string,
  mes: number,
  ano: number,
  categoria?: CategoriaItemCusto
): Promise<ItemCusto[]> {
  let query = supabase
    .from('itens_custo')
    .select('*')
    .eq('ubs_id', ubsId)
    .eq('mes', mes)
    .eq('ano', ano)

  if (categoria) query = query.eq('categoria', categoria)

  const { data, error } = await query.order('nome')
  if (error) throw error
  return data ?? []
}

export async function upsertItensCusto(
  ubsId: string,
  mes: number,
  ano: number,
  categoria: CategoriaItemCusto,
  itens: { nome: string; valor: number }[]
): Promise<void> {
  await supabase
    .from('itens_custo')
    .delete()
    .eq('ubs_id', ubsId)
    .eq('mes', mes)
    .eq('ano', ano)
    .eq('categoria', categoria)

  if (itens.length === 0) return

  const rows = itens.map((i) => ({ ...i, ubs_id: ubsId, mes, ano, categoria }))
  const { error } = await supabase.from('itens_custo').insert(rows)
  if (error) throw error
}

// ─── Salvar lançamento completo ───────────────────────────────────────────────

export interface LancamentoCompleto {
  ubsId: string
  mes: number
  ano: number
  funcionarios: Omit<Funcionario, 'id' | 'ubs_id' | 'created_at'>[]
  producao: { evento: string; quantidade_atendimentos: number; responsaveis?: string[] }[]
  materiais_consumo: { nome: string; valor: number }[]
  insumos: { nome: string; valor: number }[]
  administrativos: { nome: string; valor: number }[]
  terceirizados: { nome: string; valor: number }[]
}

export async function salvarLancamentoCompleto(payload: LancamentoCompleto): Promise<void> {
  const { ubsId, mes, ano } = payload

  await Promise.all([
    upsertFuncionarios(ubsId, mes, ano, payload.funcionarios),
    upsertProducao(ubsId, mes, ano, payload.producao),
    upsertItensCusto(ubsId, mes, ano, 'material_consumo', payload.materiais_consumo),
    upsertItensCusto(ubsId, mes, ano, 'insumo', payload.insumos),
    upsertItensCusto(ubsId, mes, ano, 'administrativo', payload.administrativos),
    upsertItensCusto(ubsId, mes, ano, 'terceirizado', payload.terceirizados),
  ])
}

export async function getLancamentoCompleto(
  ubsId: string,
  mes: number,
  ano: number
): Promise<Omit<LancamentoCompleto, 'ubsId' | 'mes' | 'ano'>> {
  const [funcionarios, producao, materiais, insumos, administrativos, terceirizados] =
    await Promise.all([
      getFuncionarios(ubsId, mes, ano),
      getProducao(ubsId, mes, ano),
      getItensCusto(ubsId, mes, ano, 'material_consumo'),
      getItensCusto(ubsId, mes, ano, 'insumo'),
      getItensCusto(ubsId, mes, ano, 'administrativo'),
      getItensCusto(ubsId, mes, ano, 'terceirizado'),
    ])

  return {
    funcionarios: funcionarios.map(({ nome, cargo, vinculo, salario, equipe }) => ({ nome, cargo, vinculo, salario, equipe: equipe ?? 0 })),
    producao: producao.map(({ evento, quantidade_atendimentos, responsaveis }) => ({
      evento,
      quantidade_atendimentos,
      responsaveis: responsaveis ?? [],
    })),
    materiais_consumo: materiais.map(({ nome, valor }) => ({ nome, valor })),
    insumos: insumos.map(({ nome, valor }) => ({ nome, valor })),
    administrativos: administrativos.map(({ nome, valor }) => ({ nome, valor })),
    terceirizados: terceirizados.map(({ nome, valor }) => ({ nome, valor })),
  }
}

// ─── Listar períodos com lançamentos para uma UBS ─────────────────────────────

export interface PeriodoLancado {
  mes: number
  ano: number
  totalFuncionarios: number
  totalAtendimentos: number
  totalCusto: number
}

export async function getPeriodosLancados(ubsId: string): Promise<PeriodoLancado[]> {
  // Busca todos os registros da UBS e agrupa por mes/ano no cliente
  const [funcionarios, producao, itens] = await Promise.all([
    supabase.from('funcionarios').select('mes, ano, salario').eq('ubs_id', ubsId),
    supabase.from('producao_eventos').select('mes, ano, quantidade_atendimentos').eq('ubs_id', ubsId),
    supabase.from('itens_custo').select('mes, ano, valor').eq('ubs_id', ubsId),
  ])

  const map = new Map<string, PeriodoLancado>()

  const key = (mes: number, ano: number) => `${ano}-${String(mes).padStart(2, '0')}`
  const get = (mes: number, ano: number): PeriodoLancado => {
    const k = key(mes, ano)
    if (!map.has(k)) map.set(k, { mes, ano, totalFuncionarios: 0, totalAtendimentos: 0, totalCusto: 0 })
    return map.get(k)!
  }

  for (const r of funcionarios.data ?? []) {
    const p = get(r.mes, r.ano)
    p.totalFuncionarios += 1
    p.totalCusto += r.salario ?? 0
  }
  for (const r of producao.data ?? []) {
    const p = get(r.mes, r.ano)
    p.totalAtendimentos += r.quantidade_atendimentos ?? 0
  }
  for (const r of itens.data ?? []) {
    const p = get(r.mes, r.ano)
    p.totalCusto += r.valor ?? 0
  }

  return Array.from(map.values()).sort((a, b) =>
    b.ano !== a.ano ? b.ano - a.ano : b.mes - a.mes
  )
}

// ─── Excluir lançamento completo de um período ────────────────────────────────

export async function deleteLancamentoCompleto(
  ubsId: string,
  mes: number,
  ano: number
): Promise<void> {
  await Promise.all([
    supabase.from('funcionarios').delete().eq('ubs_id', ubsId).eq('mes', mes).eq('ano', ano),
    supabase.from('producao_eventos').delete().eq('ubs_id', ubsId).eq('mes', mes).eq('ano', ano),
    supabase.from('itens_custo').delete().eq('ubs_id', ubsId).eq('mes', mes).eq('ano', ano),
  ])
}
