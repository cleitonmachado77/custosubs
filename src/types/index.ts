// ─── Município ───────────────────────────────────────────────────────────────
export interface Municipio {
  id: string
  nome: string
  estado: string
  habitantes: number
  created_at?: string
  updated_at?: string
}

// ─── UBS ─────────────────────────────────────────────────────────────────────
export interface UBS {
  id: string
  nome: string
  endereco: string
  cnes?: string | null
  municipio_id: string
  created_at?: string
  updated_at?: string
}

// ─── Funcionário ─────────────────────────────────────────────────────────────
export type VinculoFuncionario = 'concursado' | 'clt' | 'terceirizado'

export interface Funcionario {
  id: string
  ubs_id: string
  nome: string
  cargo: string
  vinculo: VinculoFuncionario
  salario: number
  created_at?: string
}

// ─── Produção ─────────────────────────────────────────────────────────────────
export interface ProducaoEvento {
  id: string
  ubs_id: string
  evento: string
  quantidade_atendimentos: number
  responsaveis?: string[] | null
  created_at?: string
}

// ─── Item de Custo Genérico (Materiais, Insumos, Administrativos, Terceirizados)
export interface ItemCusto {
  id: string
  ubs_id: string
  categoria: CategoriaItemCusto
  nome: string
  valor: number
  created_at?: string
}

export type CategoriaItemCusto =
  | 'material_consumo'
  | 'insumo'
  | 'administrativo'
  | 'terceirizado'

// ─── Formulário Multi-Etapas ──────────────────────────────────────────────────
export interface FormData {
  // Etapa 1 - Município
  municipio_id: string
  municipio_estado: string
  municipio_habitantes: number

  // Etapa 2 - UBS
  ubs_id: string
  ubs_nome: string
  ubs_endereco: string

  // Etapa 3 - Funcionários
  funcionarios: Omit<Funcionario, 'id' | 'ubs_id' | 'created_at'>[]

  // Etapa 4 - Produção
  producao: Omit<ProducaoEvento, 'id' | 'ubs_id' | 'created_at'>[]

  // Etapa 5 - Materiais de Consumo
  materiais_consumo: { nome: string; valor: number }[]

  // Etapa 6 - Insumos
  insumos: { nome: string; valor: number }[]

  // Etapa 7 - Administrativos
  administrativos: { nome: string; valor: number }[]

  // Etapa 8 - Terceirizados
  terceirizados: { nome: string; valor: number }[]
}

// ─── Período de referência ────────────────────────────────────────────────────
export interface PeriodoReferencia {
  mes: number
  ano: number
}
