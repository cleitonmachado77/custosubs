// ─── SICM-Educação: Tipos ─────────────────────────────────────────────────────

// ─── Escola ──────────────────────────────────────────────────────────────────
export type NivelEnsino = 'infantil' | 'fundamental_ai' | 'fundamental_af' | 'medio'
export type ZonaEscola = 'urbana' | 'rural'
export type NivelNSE = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII'

export interface Escola {
  id: string
  nome: string
  endereco: string
  codigo_inep?: string | null
  nivel_ensino: NivelEnsino
  zona: ZonaEscola
  num_alunos: number
  num_professores: number
  num_funcionarios: number
  nse_nivel?: NivelNSE | null
  nse_valor?: number | null
  infraestrutura_indice?: number | null
  municipio_id: string
  created_at?: string
  updated_at?: string
}

// ─── Funcionário da Educação ─────────────────────────────────────────────────
export type TipoCustoFuncionario = 'pedagogico' | 'social' | 'administrativo'
export type VinculoEdu = 'concursado' | 'clt' | 'terceirizado'

export interface EduFuncionario {
  id: string
  escola_id: string
  nome: string
  cargo: string
  tipo_custo: TipoCustoFuncionario
  vinculo: VinculoEdu
  salario: number
  mes: number
  ano: number
  created_at?: string
}

// ─── Item de Custo da Educação ───────────────────────────────────────────────
export type CategoriaEduCusto =
  | 'material_pedagogico'
  | 'merenda'
  | 'despesa_fixa'
  | 'terceirizado'

export interface EduItemCusto {
  id: string
  escola_id: string
  categoria: CategoriaEduCusto
  nome: string
  valor: number
  mes: number
  ano: number
  created_at?: string
}

// ─── Desempenho Educacional ──────────────────────────────────────────────────
export interface EduDesempenho {
  id: string
  escola_id: string
  ano_referencia: number
  ideb?: number | null
  nota_portugues?: number | null
  nota_matematica?: number | null
  taxa_aprovacao?: number | null
  taxa_reprovacao?: number | null
  taxa_abandono?: number | null
  aprendizado_adequado_port?: number | null
  aprendizado_adequado_mat?: number | null
  created_at?: string
}

// ─── Infraestrutura Escolar ──────────────────────────────────────────────────
export interface EduInfraestrutura {
  id: string
  escola_id: string
  agua_rede_publica: boolean
  energia_eletrica: boolean
  esgoto_rede_publica: boolean
  coleta_lixo: boolean
  agua_filtrada: boolean
  sala_diretoria: boolean
  sala_professores: boolean
  secretaria: boolean
  refeitorio: boolean
  cozinha: boolean
  biblioteca: boolean
  lab_informatica: boolean
  lab_ciencias: boolean
  quadra_esportes: boolean
  parque_infantil: boolean
  computadores: boolean
  internet: boolean
  tv_dvd: boolean
  projetor: boolean
  acessibilidade: boolean
  sala_atendimento_especial: boolean
  created_at?: string
  updated_at?: string
}

// ─── Formulário Multi-Etapas (Lançamento) ────────────────────────────────────
export interface EduFormData {
  // Etapa 1 - Município
  municipio_id: string
  municipio_estado: string
  municipio_habitantes: number

  // Etapa 2 - Escola
  escola_id: string
  escola_nome: string
  escola_endereco: string

  // Etapa 3 - Funcionários (Pedagógico: professores)
  funcionarios_pedagogico: { nome: string; cargo: string; vinculo: VinculoEdu; salario: number }[]

  // Etapa 4 - Funcionários (Social: cozinha/merenda)
  funcionarios_social: { nome: string; cargo: string; vinculo: VinculoEdu; salario: number }[]

  // Etapa 5 - Funcionários (Administrativo: zeladores, secretários, etc.)
  funcionarios_administrativo: { nome: string; cargo: string; vinculo: VinculoEdu; salario: number }[]

  // Etapa 6 - Material Pedagógico
  materiais_pedagogicos: { nome: string; valor: number }[]

  // Etapa 7 - Merenda Escolar (gêneros alimentícios)
  merenda: { nome: string; valor: number }[]

  // Etapa 8 - Despesas Fixas (energia, água, internet)
  despesas_fixas: { nome: string; valor: number }[]

  // Etapa 9 - Terceirizados
  terceirizados: { nome: string; valor: number }[]
}
