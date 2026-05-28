import { supabase } from '@/lib/supabase'
import type { OutraUnidadeSaude } from '@/types'

export async function getOutrasUnidadesByMunicipio(municipioId: string): Promise<OutraUnidadeSaude[]> {
  const { data, error } = await supabase
    .from('outras_unidades_saude')
    .select('*')
    .eq('municipio_id', municipioId)
    .order('nome')
  if (error) throw error
  return data ?? []
}

export async function getOutraUnidade(id: string): Promise<OutraUnidadeSaude | null> {
  const { data, error } = await supabase
    .from('outras_unidades_saude')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createOutraUnidade(
  payload: Omit<OutraUnidadeSaude, 'id' | 'created_at' | 'updated_at'>
): Promise<OutraUnidadeSaude> {
  const { data, error } = await supabase
    .from('outras_unidades_saude')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateOutraUnidade(
  id: string,
  payload: Partial<Omit<OutraUnidadeSaude, 'id' | 'created_at'>>
): Promise<OutraUnidadeSaude> {
  const { data, error } = await supabase
    .from('outras_unidades_saude')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteOutraUnidade(id: string): Promise<void> {
  const { error } = await supabase.from('outras_unidades_saude').delete().eq('id', id)
  if (error) throw error
}
