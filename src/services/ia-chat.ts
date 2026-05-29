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
- Os itens de custo são identificados pelo campo "nome" (texto livre).
- Para buscar custos específicos como água, energia, aluguel, use ILIKE no campo "nome" da tabela itens_custo. Ex: WHERE nome ILIKE '%água%' ou WHERE nome ILIKE '%energia%'.
- NUNCA filtre apenas por categoria quando o usuário perguntar sobre um item específico. Use o campo "nome" com ILIKE.
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

// ─── Context Snapshot ─────────────────────────────────────────────────────────
// Carrega um resumo dos dados existentes no banco para dar contexto à IA

let cachedSnapshot: string | null = null
let snapshotTimestamp = 0
const SNAPSHOT_TTL = 5 * 60 * 1000 // 5 minutos de cache

export async function loadContextSnapshot(): Promise<string> {
  const now = Date.now()
  if (cachedSnapshot && (now - snapshotTimestamp) < SNAPSHOT_TTL) {
    return cachedSnapshot
  }

  try {
    const [municipios, ubs, itensNomes, cargos, periodos, outrasUnidades, secretarias] = await Promise.all([
      supabase.from('municipios').select('nome, estado, habitantes').order('nome'),
      supabase.from('ubs').select('nome, municipio_id, municipios(nome)').order('nome'),
      supabase.rpc('execute_readonly_query', { query_text: "SELECT DISTINCT nome FROM itens_custo ORDER BY nome" }),
      supabase.rpc('execute_readonly_query', { query_text: "SELECT DISTINCT cargo FROM funcionarios ORDER BY cargo" }),
      supabase.rpc('execute_readonly_query', { query_text: "SELECT DISTINCT mes, ano FROM funcionarios ORDER BY ano DESC, mes DESC LIMIT 12" }),
      supabase.from('outras_unidades_saude').select('nome, tipo, municipio_id, municipios(nome)').order('nome'),
      supabase.from('secretarias_saude').select('nome, municipio_id, municipios(nome)').order('nome'),
    ])

    const munList = (municipios.data ?? []).map((m: { nome: string; estado: string; habitantes: number }) =>
      `• ${m.nome} (${m.estado}, ${m.habitantes?.toLocaleString('pt-BR')} hab.)`
    ).join('\n')

    const ubsList = (ubs.data ?? []).map((u: any) =>
      `• ${u.nome} — ${u.municipios?.nome ?? 'N/A'}`
    ).join('\n')

    const itensArr = (itensNomes.data ?? []) as { nome: string }[]
    const itensList = itensArr.map((i) => i.nome).join(', ')

    const cargosArr = (cargos.data ?? []) as { cargo: string }[]
    const cargosList = cargosArr.map((c) => c.cargo).join(', ')

    const periodosArr = (periodos.data ?? []) as { mes: number; ano: number }[]
    const MESES_NOME = ['','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
    const periodosList = periodosArr.map((p) => `${MESES_NOME[p.mes]}/${p.ano}`).join(', ')

    const outrasArr = (outrasUnidades.data ?? []).map((o: any) =>
      `• ${o.nome} (${o.tipo}) — ${o.municipios?.nome ?? 'N/A'}`
    ).join('\n')

    const secArr = (secretarias.data ?? []).map((s: any) =>
      `• ${s.nome} — ${s.municipios?.nome ?? 'N/A'}`
    ).join('\n')

    cachedSnapshot = `
DADOS EXISTENTES NO BANCO (use para gerar queries precisas):

MUNICÍPIOS CADASTRADOS:
${munList || '(nenhum)'}

UBS CADASTRADAS:
${ubsList || '(nenhuma)'}

SECRETARIAS DE SAÚDE:
${secArr || '(nenhuma)'}

OUTRAS UNIDADES DE SAÚDE:
${outrasArr || '(nenhuma)'}

NOMES DE ITENS DE CUSTO EXISTENTES:
${itensList || '(nenhum)'}

CARGOS DE FUNCIONÁRIOS EXISTENTES:
${cargosList || '(nenhum)'}

PERÍODOS COM DADOS LANÇADOS:
${periodosList || '(nenhum)'}
`.trim()

    snapshotTimestamp = now
    return cachedSnapshot
  } catch {
    return '(Não foi possível carregar o resumo dos dados)'
  }
}

// ─── Funções auxiliares ───────────────────────────────────────────────────────

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

function isReadOnlySQL(sql: string): boolean {
  const upper = sql.toUpperCase().trim()
  if (!upper.startsWith('SELECT') && !upper.startsWith('WITH')) return false
  const forbidden = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE', 'CREATE', 'GRANT', 'REVOKE']
  return !forbidden.some((cmd) => upper.includes(cmd))
}

async function executeSQL(sql: string): Promise<{ data: unknown[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc('execute_readonly_query', { query_text: sql })
    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (e) {
    return { data: null, error: String(e) }
  }
}

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
    if (response.status === 429) throw new Error('Limite de requisições atingido. Aguarde alguns segundos e tente novamente.')
    if (response.status === 503) throw new Error('O serviço de IA está temporariamente sobrecarregado. Tente novamente em alguns segundos.')
    throw new Error('Não foi possível processar sua pergunta no momento. Tente novamente.')
  }

  const result = await response.json()
  return result.choices?.[0]?.message?.content ?? 'Sem resposta do modelo.'
}

// ─── Função principal ─────────────────────────────────────────────────────────

const RULES = `
REGRAS:
1. Quando o usuário fizer uma pergunta sobre custos, dados ou indicadores, gere APENAS o SQL necessário dentro de um bloco \`\`\`sql ... \`\`\`.
2. NÃO inclua explicações ou texto antes/depois do bloco SQL. Retorne SOMENTE o bloco SQL.
3. Use APENAS SELECT. NUNCA gere INSERT, UPDATE, DELETE, DROP, ALTER.
4. Se a pergunta não for sobre dados do banco, responda normalmente em português sem SQL.
5. Se precisar de mais informações, pergunte de forma curta SEM gerar SQL.
6. NUNCA mostre SQL, nomes de tabelas ou termos técnicos ao usuário.
7. Use os DADOS EXISTENTES NO BANCO acima para saber exatamente quais municípios, UBS, itens e cargos existem. Use os nomes EXATOS dos itens de custo nas queries com ILIKE.
`

export async function askIA(userQuestion: string): Promise<{ answer: string; sqlUsed?: string }> {
  // Carrega contexto dos dados existentes
  const snapshot = await loadContextSnapshot()

  const systemPrompt = `${DB_SCHEMA}\n${snapshot}\n${RULES}`

  // 1. Pede para o modelo gerar SQL ou responder diretamente
  const messages: ChatMsg[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userQuestion },
  ]

  const firstResponse = await callLLM(messages)

  // 2. Verifica se gerou SQL
  const sql = extractSQL(firstResponse)

  if (!sql) {
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
    return { answer: 'Desculpe, não posso executar esse tipo de operação.' }
  }

  // 4. Executa o SQL
  const { data, error } = await executeSQL(sql)

  if (error) {
    // Tenta corrigir
    const retryMessages: ChatMsg[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userQuestion },
      { role: 'assistant', content: firstResponse },
      { role: 'user', content: `Erro: "${error}". Corrija o SQL. Retorne SOMENTE o bloco \`\`\`sql ... \`\`\` corrigido.` },
    ]
    const retryResponse = await callLLM(retryMessages)
    const retrySql = extractSQL(retryResponse)

    if (retrySql && isReadOnlySQL(retrySql)) {
      const retry = await executeSQL(retrySql)
      if (retry.error) {
        return { answer: 'Não consegui encontrar esses dados. Tente reformular com mais detalhes.', sqlUsed: retrySql }
      }
      const fmtMessages: ChatMsg[] = [
        { role: 'system', content: 'Responda em português brasileiro. NUNCA mostre SQL ou termos técnicos. Use R$ para valores. Seja conciso.' },
        { role: 'user', content: `Pergunta: "${userQuestion}"\nDados:\n${JSON.stringify(retry.data, null, 2)}\nResponda de forma clara.` },
      ]
      return { answer: await callLLM(fmtMessages), sqlUsed: retrySql }
    }
    return { answer: 'Não consegui encontrar esses dados. Tente ser mais específico.', sqlUsed: sql }
  }

  // 5. Formata a resposta
  const formatMessages: ChatMsg[] = [
    { role: 'system', content: 'Responda em português brasileiro. NUNCA mostre SQL, nomes de tabelas ou termos técnicos. Use R$ X.XXX,XX para valores. Seja conciso. Use listas quando houver múltiplos itens. Se dados vazios, diga que não há registros.' },
    { role: 'user', content: `Pergunta: "${userQuestion}"\nDados:\n${JSON.stringify(data, null, 2)}\nResponda de forma clara e amigável.` },
  ]

  return { answer: await callLLM(formatMessages), sqlUsed: sql }
}
