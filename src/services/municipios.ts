import { supabase } from '@/lib/supabase'
import type { Municipio } from '@/types'

export async function getMunicipios(): Promise<Municipio[]> {
  const { data, error } = await supabase
    .from('municipios')
    .select('*')
    .order('estado')
  if (error) throw error
  return data ?? []
}

export async function getMunicipio(id: string): Promise<Municipio | null> {
  const { data, error } = await supabase
    .from('municipios')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createMunicipio(
  payload: Omit<Municipio, 'id' | 'created_at' | 'updated_at'>
): Promise<Municipio> {
  const { data, error } = await supabase
    .from('municipios')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateMunicipio(
  id: string,
  payload: Partial<Omit<Municipio, 'id' | 'created_at'>>
): Promise<Municipio> {
  const { data, error } = await supabase
    .from('municipios')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
