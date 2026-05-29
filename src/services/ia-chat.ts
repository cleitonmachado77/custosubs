import { supabase } from '@/lib/supabase'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

// Schema do banco para contexto da IA
const DB_SCHEMA = `
Você é um assistente de análise de custos de saúde pública municipal.
Você tem acesso ao banco de dados PostgreSQL (Supabase) com as seguintes tabelas:

1. municipios (id UUID PK, nome TEXT, estado TEXT, habitantes INT, created_at, updated_at)
2. secretarias_saude (id UUID PK, nome TEXT, responsavel TEXT, telefone TEXT, municipio_id UUID FK→municipios, created_at, updated_at)
3. ubs (id UUID PK, nome TEXT, endereco TEXT, cnes TEXT, populacao_referencia INT, num_equipes_esf INT, servicos TEXT[], municipio_id UUID FK→municipios, secretaria_id UUID FK→secretarias_saude nullable, created_at, updated_at)
4. outras_unidades_saude (id UUID PK, nome TEXT, tipo TEXT, endereco TEXT, municipio_id UUID FK→municipios, created_at, updated_at)
5. funcionarios (id UUID PK, ubs_id UUID FK, nome TEXT, cargo TEXT, vinculo TEXT ['concursado','clt','terceirizado'], salario NUMERIC, equipe INT, mes INT, ano INT, created_at)
6. producao_eventos (id UUID PK, ubs_id UUID FK, evento TEXT, quantidade_atendimentos INT, responsaveis TEXT[], mes INT, ano INT, created_at)
7. itens_custo (id UUID PK, ubs_id UUID FK, categoria TEXT ['material_consumo','insumo','administrativo','terceirizado'], nome TEXT, valor NUMERIC, mes INT, ano INT, created_at)

IMPORTANTE:
- O campo ubs_id em funcionarios, producao_eventos e itens_custo pode referenciar tanto uma UBS, quanto uma secretaria_saude ou outra_unidade_saude (todos usam o mesmo campo).
- Valores monetários estão em Reais (BRL).
- O campo "mes" vai de 1 a 12, "ano" é o ano completo (ex: 2025).
- Vinculos: concursado, clt, terceirizado.
- Categorias de itens_custo: material_consumo, insumo, administrativo, terceirizado.
- Os itens de custo são identificados pelo campo "nome" (texto livre). Exemplos: "Conta de água", "Energia elétrica", "Aluguel", "Internet", "Material de limpeza", "Luvas", "Seringas", etc.
- Para buscar custos específicos como água, energia, aluguel, use ILIKE no campo "nome" da tabela itens_custo. Ex: WHERE nome ILIKE '%água%' ou WHERE nome ILIKE '%energia%'.
- NUNCA filtre apenas por categoria quando o usuário perguntar sobre um item específico. Use o campo "nome" com ILIKE.
`

const SYSTEM_PROMPT = `${DB_SCHEMA}

REGRAS:
1. Quando o usuário fizer uma pergunta sobre custos, dados ou indicadores, gere APENAS o SQL necessário dentro de um bloco \`\`\`sql ... \`\`\`.
2. NÃO inclua explicações, comentários ou texto antes ou depois do bloco SQL. Retorne SOMENTE o bloco SQL.
3. Use APENAS SELECT. NUNCA gere INSERT, UPDATE, DELETE, DROP, ALTER ou qualquer comando que modifique dados.
4. Se a pergunta não for sobre dados do banco (ex: saudação, pergunta conceitual), responda normalmente em português sem SQL.
5. Se precisar de mais informações para gerar a query (ex: qual município), pergunte de forma curta e direta SEM gerar SQL.
6. NUNCA mostre código SQL, nomes de tabelas, colunas ou termos técnicos na resposta final ao usuário.
7. Quando for formatar resultados, use linguagem simples, formato de moeda brasileira (R$ X.XXX,XX) e seja conciso.
`

interface ChatMsg {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// Extrai SQL de uma resposta do modelo
function extractSQL(text: string): string | null {
  const match = text.match(/```sql\s*([\s\S]*?)```/)
  if (match) return match[1].trim().replace(/;\s*$/, '')
  const partial = text.match(/```sql\s*([\s\S]+)$/)
  if (partial) {
    const sql = partial[1].trim().replace(/;\s*$/, '')
    if (sql.toUpperCase().startsWith('SELECT') || sql.toUpperCase().startsWith('WITH')) return sql
  }
  const loose = text.match(/(SELECT\s+[\s\S]+?FROM\s+[\s\S]+?)(?:\n\n|$)/i)
  if (loose) return loose[1].trim().replace(/;\s*$/, '')
  return null
}

// Valida que o SQL é apenas SELECT
function isReadOnlySQL(sql: string): boolean {
  const upper = sql.toUpperCase().trim()
  if (!upper.startsWith('SELECT') && !upper.startsWith('WITH')) return false
  const forbidden = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE', 'CREATE', 'GRANT', 'REVOKE']
  return !forbidden.some((cmd) => upper.includes(cmd))
}

// Executa SQL no Supabase via RPC
async function executeSQL(sql: string): Promise<{ data: unknown[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc('execute_readonly_query', { query_text: sql })
    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (e) {
    return { data: null, error: String(e) }
  }
}

// Chama a API do Groq (formato OpenAI)
async function callLLM(messages: ChatMsg[]): Promise<string> {
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.3,
      max_tokens: 2048,
    }),
  })

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Limite de requisições atingido. Aguarde alguns segundos e tente novamente.')
    }
    if (response.status === 503) {
      throw new Error('O serviço de IA está temporariamente sobrecarregado. Tente novamente em alguns segundos.')
    }
    throw new Error('Não foi possível processar sua pergunta no momento. Tente novamente.')
  }

  const result = await response.json()
  return result.choices?.[0]?.message?.content ?? 'Sem resposta do modelo.'
}

// Função principal: processa uma pergunta do usuário
export async function askIA(userQuestion: string): Promise<{ answer: string; sqlUsed?: string }> {
  // 1. Pede para o modelo gerar SQL ou responder diretamente
  const messages: ChatMsg[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userQuestion },
  ]

  const firstResponse = await callLLM(messages)

  // 2. Verifica se o modelo gerou SQL
  const sql = extractSQL(firstResponse)

  if (!sql) {
    // Sem SQL — limpa resquícios técnicos e retorna
    const clean = firstResponse
      .replace(/```sql[\s\S]*/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/SELECT\s+[\s\S]*?FROM[\s\S]*?(?:WHERE|GROUP|ORDER|LIMIT|$)/gi, '')
      .replace(/\b(ubs_id|municipio_id|secretaria_id|created_at|updated_at)\b/gi, '')
      .trim()
    return { answer: clean || 'Pode reformular sua pergunta? Preciso de mais detalhes para buscar os dados.' }
  }

  // 3. Valida segurança
  if (!isReadOnlySQL(sql)) {
    return { answer: 'Desculpe, não posso executar esse tipo de operação. Apenas consultas de leitura são permitidas.' }
  }

  // 4. Executa o SQL
  const { data, error } = await executeSQL(sql)

  if (error) {
    // Tenta corrigir
    const retryMessages: ChatMsg[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userQuestion },
      { role: 'assistant', content: firstResponse },
      { role: 'user', content: `A query retornou erro: "${error}". Corrija o SQL. Retorne SOMENTE o bloco \`\`\`sql ... \`\`\` corrigido.` },
    ]
    const retryResponse = await callLLM(retryMessages)
    const retrySql = extractSQL(retryResponse)

    if (retrySql && isReadOnlySQL(retrySql)) {
      const retry = await executeSQL(retrySql)
      if (retry.error) {
        return { answer: 'Não consegui encontrar esses dados. Tente reformular com mais detalhes (município, período, nome da UBS).', sqlUsed: retrySql }
      }
      // Formata resultado
      const fmtMessages: ChatMsg[] = [
        { role: 'system', content: 'Você é um assistente que responde em português brasileiro. NUNCA mostre SQL, nomes de tabelas ou termos técnicos. Use R$ para valores monetários. Seja conciso e use listas quando apropriado.' },
        { role: 'user', content: `Pergunta do usuário: "${userQuestion}"\n\nDados encontrados:\n${JSON.stringify(retry.data, null, 2)}\n\nResponda de forma clara e amigável.` },
      ]
      const finalAnswer = await callLLM(fmtMessages)
      return { answer: finalAnswer, sqlUsed: retrySql }
    }
    return { answer: 'Não consegui encontrar esses dados. Tente ser mais específico (município, período ou nome da UBS).', sqlUsed: sql }
  }

  // 5. Formata a resposta final
  const formatMessages: ChatMsg[] = [
    { role: 'system', content: 'Você é um assistente que responde em português brasileiro. NUNCA mostre SQL, nomes de tabelas ou termos técnicos. Use formato de moeda brasileira (R$ X.XXX,XX) para valores. Seja conciso e direto. Use listas com bullet points quando houver múltiplos itens. Se não houver dados, diga que não foram encontrados registros.' },
    { role: 'user', content: `Pergunta do usuário: "${userQuestion}"\n\nDados encontrados:\n${JSON.stringify(data, null, 2)}\n\nResponda de forma clara e amigável.` },
  ]

  const finalAnswer = await callLLM(formatMessages)
  return { answer: finalAnswer, sqlUsed: sql }
}
