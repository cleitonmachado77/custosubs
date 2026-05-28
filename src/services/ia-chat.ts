import { supabase } from '@/lib/supabase'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`

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

interface GeminiMessage {
  role: 'user' | 'model'
  parts: { text: string }[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// Extrai SQL de uma resposta do modelo
function extractSQL(text: string): string | null {
  // Tenta capturar bloco completo ```sql ... ```
  const match = text.match(/```sql\s*([\s\S]*?)```/)
  if (match) {
    return match[1].trim().replace(/;\s*$/, '')
  }
  // Tenta capturar bloco incompleto (sem fechamento ```)
  const partial = text.match(/```sql\s*([\s\S]+)$/)
  if (partial) {
    const sql = partial[1].trim().replace(/;\s*$/, '')
    if (sql.toUpperCase().startsWith('SELECT') || sql.toUpperCase().startsWith('WITH')) {
      return sql
    }
  }
  // Tenta capturar SQL solto (sem bloco de código)
  const loose = text.match(/(SELECT\s+[\s\S]+?FROM\s+[\s\S]+?)(?:\n\n|$)/i)
  if (loose) {
    return loose[1].trim().replace(/;\s*$/, '')
  }
  return null
}

// Valida que o SQL é apenas SELECT
function isReadOnlySQL(sql: string): boolean {
  const upper = sql.toUpperCase().trim()
  if (!upper.startsWith('SELECT') && !upper.startsWith('WITH')) return false
  const forbidden = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE', 'CREATE', 'GRANT', 'REVOKE']
  return !forbidden.some((cmd) => upper.includes(cmd))
}

// Executa SQL no Supabase via RPC ou query direta
async function executeSQL(sql: string): Promise<{ data: unknown[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc('execute_readonly_query', { query_text: sql })
    if (error) {
      // Fallback: tenta via REST se a function não existir
      return { data: null, error: error.message }
    }
    return { data, error: null }
  } catch (e) {
    return { data: null, error: String(e) }
  }
}

// Chama a API do Gemini
async function callGemini(messages: GeminiMessage[]): Promise<string> {
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: messages,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
      },
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    if (response.status === 429) {
      throw new Error('Limite de requisições atingido. Aguarde alguns segundos e tente novamente.')
    }
    throw new Error(`Erro na API: ${response.status} - ${err}`)
  }

  const result = await response.json()
  return result.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Sem resposta do modelo.'
}

// Função principal: processa uma pergunta do usuário
export async function askIA(
  userQuestion: string,
  conversationHistory: GeminiMessage[] = []
): Promise<{ answer: string; sqlUsed?: string }> {
  // 1. Envia a pergunta para o Gemini com o histórico
  const messages: GeminiMessage[] = [
    ...conversationHistory,
    { role: 'user', parts: [{ text: userQuestion }] },
  ]

  const firstResponse = await callGemini(messages)

  // 2. Verifica se o modelo gerou SQL
  const sql = extractSQL(firstResponse)

  if (!sql) {
    // Sem SQL — resposta direta, mas limpa qualquer resquício técnico
    const cleanResponse = firstResponse
      .replace(/```sql[\s\S]*/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/SELECT\s+[\s\S]*?FROM[\s\S]*?(?:WHERE|GROUP|ORDER|LIMIT|$)/gi, '')
      .replace(/\b(ubs_id|municipio_id|secretaria_id|created_at|updated_at)\b/gi, '')
      .trim()
    return { answer: cleanResponse || 'Pode reformular sua pergunta? Preciso de mais detalhes para buscar os dados.' }
  }

  // 3. Valida segurança do SQL
  if (!isReadOnlySQL(sql)) {
    return {
      answer: 'Desculpe, não posso executar esse tipo de operação. Apenas consultas de leitura são permitidas.',
    }
  }

  // 4. Executa o SQL no banco
  const { data, error } = await executeSQL(sql)

  if (error) {
    // Se deu erro, pede para o modelo reformular
    const retryMessages: GeminiMessage[] = [
      ...messages,
      { role: 'model', parts: [{ text: firstResponse }] },
      {
        role: 'user',
        parts: [{ text: `A query retornou erro: "${error}". Por favor, corrija a query SQL e tente novamente. Lembre-se que as tabelas são: municipios, ubs, secretarias_saude, outras_unidades_saude, funcionarios, producao_eventos, itens_custo.` }],
      },
    ]

    const retryResponse = await callGemini(retryMessages)
    const retrySql = extractSQL(retryResponse)

    if (retrySql && isReadOnlySQL(retrySql)) {
      const retry = await executeSQL(retrySql)
      if (retry.error) {
        return {
          answer: 'Não consegui encontrar esses dados no momento. Tente reformular sua pergunta com mais detalhes (ex: nome do município, período, etc).',
          sqlUsed: retrySql,
        }
      }
      // Pede para formatar o resultado
      const formatMessages: GeminiMessage[] = [
        ...messages,
        { role: 'model', parts: [{ text: retryResponse }] },
        {
          role: 'user',
          parts: [{ text: `Resultado da consulta:\n${JSON.stringify(retry.data, null, 2)}\n\nAgora responda a pergunta original do usuário de forma clara e amigável em português. NUNCA mostre SQL ou termos técnicos. Use R$ para valores monetários. Seja conciso.` }],
        },
      ]
      const finalAnswer = await callGemini(formatMessages)
      return { answer: finalAnswer, sqlUsed: retrySql }
    }

    return {
      answer: 'Não consegui encontrar esses dados. Tente ser mais específico (ex: informe o município, período ou nome da UBS).',
      sqlUsed: sql,
    }
  }

  // 5. Envia os resultados para o modelo formatar a resposta
  const formatMessages: GeminiMessage[] = [
    ...messages,
    { role: 'model', parts: [{ text: firstResponse }] },
    {
      role: 'user',
      parts: [{ text: `Resultado da consulta:\n${JSON.stringify(data, null, 2)}\n\nAgora responda a pergunta original do usuário de forma clara e amigável em português. REGRAS OBRIGATÓRIAS:\n- NUNCA mostre SQL, nomes de tabelas, colunas ou termos técnicos\n- Use formato de moeda brasileira (R$ X.XXX,XX) para valores\n- Seja conciso e direto\n- Use listas com bullet points quando houver múltiplos itens\n- Se não houver dados, diga que não foram encontrados registros` }],
    },
  ]

  const finalAnswer = await callGemini(formatMessages)
  return { answer: finalAnswer, sqlUsed: sql }
}
