import { supabase } from '@/lib/supabase'
import type { EduFuncionario, EduItemCusto, TipoCustoFuncionario, VinculoEdu, CategoriaEduCusto } from '@/types/educacao'

// ─── Períodos Lançados ───────────────────────────────────────────────────────

export interface EduPeriodoLancado {
  mes: number
  ano: number
  totalFuncionarios: number
  totalCusto: number
}

export async function getEduPeriodosLancados(escolaId: string): Promise<EduPeriodoLancado[]> {
  const [funcionarios, itens] = await Promise.all([
    supabase.from('edu_funcionarios').select('mes, ano, salario').eq('escola_id', escolaId),
    supabase.from('edu_itens_custo').select('mes, ano, valor').eq('escola_id', escolaId),
  ])

  const map = new Map<string, EduPeriodoLancado>()

  const key = (mes: number, ano: number) => `${ano}-${String(mes).padStart(2, '0')}`
  const get = (mes: number, ano: number): EduPeriodoLancado => {
    const k = key(mes, ano)
    if (!map.has(k)) map.set(k, { mes, ano, totalFuncionarios: 0, totalCusto: 0 })
    return map.get(k)!
  }

  for (const r of funcionarios.data ?? []) {
    const p = get(r.mes, r.ano)
    p.totalFuncionarios += 1
    p.totalCusto += Number(r.salario) ?? 0
  }
  for (const r of itens.data ?? []) {
    const p = get(r.mes, r.ano)
    p.totalCusto += Number(r.valor) ?? 0
  }

  return Array.from(map.values()).sort((a, b) =>
    b.ano !== a.ano ? b.ano - a.ano : b.mes - a.mes
  )
}

export async function deleteEduLancamentoCompleto(
  escolaId: string,
  mes: number,
  ano: number
): Promise<void> {
  await Promise.all([
    supabase.from('edu_funcionarios').delete().eq('escola_id', escolaId).eq('mes', mes).eq('ano', ano),
    supabase.from('edu_itens_custo').delete().eq('escola_id', escolaId).eq('mes', mes).eq('ano', ano),
  ])
}

// ─── Funcionários ────────────────────────────────────────────────────────────

export async function getEduFuncionarios(escolaId: string, mes: number, ano: number): Promise<EduFuncionario[]> {
  const { data, error } = await supabase
    .from('edu_funcionarios')
    .select('*')
    .eq('escola_id', escolaId)
    .eq('mes', mes)
    .eq('ano', ano)
    .order('tipo_custo')
    .order('nome')
  if (error) throw error
  return data ?? []
}

export async function upsertEduFuncionarios(
  escolaId: string,
  mes: number,
  ano: number,
  funcionarios: { nome: string; cargo: string; tipo_custo: TipoCustoFuncionario; vinculo: VinculoEdu; salario: number }[]
): Promise<void> {
  // Remove existentes do período
  const { error: delErr } = await supabase
    .from('edu_funcionarios')
    .delete()
    .eq('escola_id', escolaId)
    .eq('mes', mes)
    .eq('ano', ano)
  if (delErr) throw delErr

  if (funcionarios.length === 0) return

  // Insere novos
  const rows = funcionarios.map((f) => ({
    escola_id: escolaId,
    nome: f.nome,
    cargo: f.cargo,
    tipo_custo: f.tipo_custo,
    vinculo: f.vinculo,
    salario: f.salario,
    mes,
    ano,
  }))

  const { error: insErr } = await supabase
    .from('edu_funcionarios')
    .insert(rows)
  if (insErr) throw insErr
}

// ─── Itens de Custo ──────────────────────────────────────────────────────────

export async function getEduItensCusto(escolaId: string, mes: number, ano: number): Promise<EduItemCusto[]> {
  const { data, error } = await supabase
    .from('edu_itens_custo')
    .select('*')
    .eq('escola_id', escolaId)
    .eq('mes', mes)
    .eq('ano', ano)
    .order('categoria')
    .order('nome')
  if (error) throw error
  return data ?? []
}

export async function upsertEduItensCusto(
  escolaId: string,
  mes: number,
  ano: number,
  itens: { categoria: CategoriaEduCusto; nome: string; valor: number }[]
): Promise<void> {
  // Remove existentes do período
  const { error: delErr } = await supabase
    .from('edu_itens_custo')
    .delete()
    .eq('escola_id', escolaId)
    .eq('mes', mes)
    .eq('ano', ano)
  if (delErr) throw delErr

  if (itens.length === 0) return

  const rows = itens.map((i) => ({
    escola_id: escolaId,
    categoria: i.categoria,
    nome: i.nome,
    valor: i.valor,
    mes,
    ano,
  }))

  const { error: insErr } = await supabase
    .from('edu_itens_custo')
    .insert(rows)
  if (insErr) throw insErr
}
