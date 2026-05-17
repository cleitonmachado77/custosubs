import { supabase } from '@/lib/supabase'
import type { Escola } from '@/types/educacao'

export async function getEscolasByMunicipio(municipioId: string): Promise<Escola[]> {
  const { data, error } = await supabase
    .from('escolas')
    .select('*')
    .eq('municipio_id', municipioId)
    .order('nome')
  if (error) throw error
  return data ?? []
}

export async function createEscola(escola: Omit<Escola, 'id' | 'created_at' | 'updated_at'>): Promise<Escola> {
  const { data, error } = await supabase
    .from('escolas')
    .insert(escola)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateEscola(id: string, updates: Partial<Omit<Escola, 'id' | 'created_at' | 'updated_at'>>): Promise<Escola> {
  const { data, error } = await supabase
    .from('escolas')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteEscola(id: string): Promise<void> {
  const { error } = await supabase
    .from('escolas')
    .delete()
    .eq('id', id)
  if (error) throw error
}
