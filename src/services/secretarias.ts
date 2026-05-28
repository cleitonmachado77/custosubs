import { supabase } from '@/lib/supabase'
import type { SecretariaSaude } from '@/types'

export async function getSecretariasByMunicipio(municipioId: string): Promise<SecretariaSaude[]> {
  const { data, error } = await supabase
    .from('secretarias_saude')
    .select('*')
    .eq('municipio_id', municipioId)
    .order('nome')
  if (error) throw error
  return data ?? []
}

export async function getSecretaria(id: string): Promise<SecretariaSaude | null> {
  const { data, error } = await supabase
    .from('secretarias_saude')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createSecretaria(
  payload: Omit<SecretariaSaude, 'id' | 'created_at' | 'updated_at'>
): Promise<SecretariaSaude> {
  const { data, error } = await supabase
    .from('secretarias_saude')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateSecretaria(
  id: string,
  payload: Partial<Omit<SecretariaSaude, 'id' | 'created_at'>>
): Promise<SecretariaSaude> {
  const { data, error } = await supabase
    .from('secretarias_saude')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteSecretaria(id: string): Promise<void> {
  const { error } = await supabase.from('secretarias_saude').delete().eq('id', id)
  if (error) throw error
}
