import { supabase } from '@/lib/supabase'
import type { UBS } from '@/types'

export async function getUBSByMunicipio(municipioId: string): Promise<UBS[]> {
  const { data, error } = await supabase
    .from('ubs')
    .select('*')
    .eq('municipio_id', municipioId)
    .order('nome')
  if (error) throw error
  return data ?? []
}

export async function getUBSBySecretaria(secretariaId: string): Promise<UBS[]> {
  const { data, error } = await supabase
    .from('ubs')
    .select('*')
    .eq('secretaria_id', secretariaId)
    .order('nome')
  if (error) throw error
  return data ?? []
}

export async function getUBSSemSecretaria(municipioId: string): Promise<UBS[]> {
  const { data, error } = await supabase
    .from('ubs')
    .select('*')
    .eq('municipio_id', municipioId)
    .is('secretaria_id', null)
    .order('nome')
  if (error) throw error
  return data ?? []
}

export async function getUBS(id: string): Promise<UBS | null> {
  const { data, error } = await supabase
    .from('ubs')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createUBS(
  payload: Omit<UBS, 'id' | 'created_at' | 'updated_at'>
): Promise<UBS> {
  const { data, error } = await supabase
    .from('ubs')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateUBS(
  id: string,
  payload: Partial<Omit<UBS, 'id' | 'created_at'>>
): Promise<UBS> {
  const { data, error } = await supabase
    .from('ubs')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteUBS(id: string): Promise<void> {
  const { error } = await supabase.from('ubs').delete().eq('id', id)
  if (error) throw error
}
