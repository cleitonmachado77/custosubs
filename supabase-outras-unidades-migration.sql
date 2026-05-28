-- Migration: Adicionar tabela Outras Unidades de Saúde
-- Execute este SQL no Supabase SQL Editor

-- 1. Criar tabela outras_unidades_saude
CREATE TABLE IF NOT EXISTS outras_unidades_saude (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  endereco TEXT,
  municipio_id UUID NOT NULL REFERENCES municipios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Índice para performance
CREATE INDEX IF NOT EXISTS idx_outras_unidades_saude_municipio_id ON outras_unidades_saude(municipio_id);

-- 3. Habilitar RLS
ALTER TABLE outras_unidades_saude ENABLE ROW LEVEL SECURITY;

-- 4. Política permissiva
CREATE POLICY "Allow all access to outras_unidades_saude"
  ON outras_unidades_saude
  FOR ALL
  USING (true)
  WITH CHECK (true);
