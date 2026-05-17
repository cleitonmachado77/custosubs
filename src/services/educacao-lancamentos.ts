import { supabase } from '@/lib/supabase'
import type { EduFuncionario, EduItemCusto, TipoCustoFuncionario, VinculoEdu, CategoriaEduCusto } from '@/types/educacao'

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
