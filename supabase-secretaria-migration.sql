-- Migration: Adicionar Secretaria de Saúde e Outras Unidades de Saúde
-- Execute este SQL no Supabase SQL Editor

-- 1. Criar tabela secretarias_saude
CREATE TABLE IF NOT EXISTS secretarias_saude (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  responsavel TEXT,
  telefone TEXT,
  municipio_id UUID NOT NULL REFERENCES municipios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Adicionar coluna secretaria_id na tabela ubs (nullable para manter compatibilidade)
ALTER TABLE ubs
ADD COLUMN IF NOT EXISTS secretaria_id UUID REFERENCES secretarias_saude(id) ON DELETE SET NULL;

-- 3. Criar tabela outras_unidades_saude
CREATE TABLE IF NOT EXISTS outras_unidades_saude (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  endereco TEXT,
  municipio_id UUID NOT NULL REFERENCES municipios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_secretarias_saude_municipio_id ON secretarias_saude(municipio_id);
CREATE INDEX IF NOT EXISTS idx_ubs_secretaria_id ON ubs(secretaria_id);
CREATE INDEX IF NOT EXISTS idx_outras_unidades_saude_municipio_id ON outras_unidades_saude(municipio_id);

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE secretarias_saude ENABLE ROW LEVEL SECURITY;
ALTER TABLE outras_unidades_saude ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (ajuste conforme sua necessidade de auth)
CREATE POLICY "Allow all access to secretarias_saude"
  ON secretarias_saude
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to outras_unidades_saude"
  ON outras_unidades_saude
  FOR ALL
  USING (true)
  WITH CHECK (true);
