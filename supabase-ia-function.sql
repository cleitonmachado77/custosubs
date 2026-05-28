-- Migration: Criar função RPC para executar queries de leitura (usada pela IA)
-- Execute este SQL no Supabase SQL Editor

-- Função que executa queries SELECT de forma segura
CREATE OR REPLACE FUNCTION execute_readonly_query(query_text TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  upper_query TEXT;
BEGIN
  -- Validação: apenas SELECT/WITH permitidos
  upper_query := UPPER(TRIM(query_text));
  
  IF NOT (upper_query LIKE 'SELECT%' OR upper_query LIKE 'WITH%') THEN
    RAISE EXCEPTION 'Apenas consultas SELECT são permitidas.';
  END IF;
  
  -- Bloqueia comandos perigosos
  IF upper_query LIKE '%INSERT%' OR upper_query LIKE '%UPDATE%' OR 
     upper_query LIKE '%DELETE%' OR upper_query LIKE '%DROP%' OR 
     upper_query LIKE '%ALTER%' OR upper_query LIKE '%TRUNCATE%' OR
     upper_query LIKE '%CREATE%' OR upper_query LIKE '%GRANT%' THEN
    RAISE EXCEPTION 'Operação não permitida. Apenas leitura.';
  END IF;

  -- Executa a query e retorna como JSON
  EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || query_text || ') t'
  INTO result;
  
  -- Se não houver resultados, retorna array vazio
  IF result IS NULL THEN
    result := '[]'::JSON;
  END IF;
  
  RETURN result;
END;
$$;

-- Permite que o role anon (frontend) execute a função
GRANT EXECUTE ON FUNCTION execute_readonly_query(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION execute_readonly_query(TEXT) TO authenticated;
