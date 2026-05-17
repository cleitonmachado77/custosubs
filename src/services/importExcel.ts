import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import type { VinculoFuncionario } from '@/types'
import { salvarLancamentoCompleto } from './lancamentos'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ImportError {
  aba: string
  linha: number
  campo: string
  mensagem: string
}

export interface ImportResult {
  success: boolean
  errors: ImportError[]
  resumo?: {
    funcionarios: number
    producao: number
    materiais: number
    insumos: number
    administrativos: number
    terceirizados: number
  }
}

interface RawFuncionario {
  nome?: string
  cargo?: string
  vinculo?: string
  salario?: number
  equipe?: number
}

interface RawProducao {
  evento?: string
  quantidade_atendimentos?: number
  responsaveis?: string
}

interface RawCusto {
  nome?: string
  valor?: number
}

// ─── Validação ────────────────────────────────────────────────────────────────

const VINCULOS_VALIDOS: VinculoFuncionario[] = ['concursado', 'clt', 'terceirizado']

function normalizeVinculo(v: string | undefined): VinculoFuncionario | null {
  if (!v) return null
  const lower = v.toLowerCase().trim()
  if (lower === 'concursado') return 'concursado'
  if (lower === 'clt') return 'clt'
  if (lower === 'terceirizado') return 'terceirizado'
  return null
}

// ─── Parser ───────────────────────────────────────────────────────────────────

export function parseExcel(file: ArrayBuffer): {
  funcionarios: RawFuncionario[]
  producao: RawProducao[]
  materiais_consumo: RawCusto[]
  insumos: RawCusto[]
  administrativos: RawCusto[]
  terceirizados: RawCusto[]
} {
  const wb = XLSX.read(file, { type: 'array' })

  function getSheet<T>(name: string): T[] {
    const ws = wb.Sheets[name]
    if (!ws) return []
    return XLSX.utils.sheet_to_json<T>(ws, { defval: '' })
  }

  return {
    funcionarios: getSheet<RawFuncionario>('Funcionarios'),
    producao: getSheet<RawProducao>('Producao'),
    materiais_consumo: getSheet<RawCusto>('MateriaisConsumo'),
    insumos: getSheet<RawCusto>('Insumos'),
    administrativos: getSheet<RawCusto>('Administrativos'),
    terceirizados: getSheet<RawCusto>('Terceirizados'),
  }
}

// ─── Validação completa ───────────────────────────────────────────────────────

export function validateImport(data: ReturnType<typeof parseExcel>): ImportError[] {
  const errors: ImportError[] = []

  // Funcionários
  data.funcionarios.forEach((f, i) => {
    const linha = i + 2 // +2 porque linha 1 é header
    if (!f.nome || String(f.nome).trim() === '') {
      errors.push({ aba: 'Funcionarios', linha, campo: 'nome', mensagem: 'Nome é obrigatório' })
    }
    if (!f.cargo || String(f.cargo).trim() === '') {
      errors.push({ aba: 'Funcionarios', linha, campo: 'cargo', mensagem: 'Cargo é obrigatório' })
    }
    const vinculo = normalizeVinculo(String(f.vinculo ?? ''))
    if (!vinculo) {
      errors.push({ aba: 'Funcionarios', linha, campo: 'vinculo', mensagem: `Vínculo inválido. Use: ${VINCULOS_VALIDOS.join(', ')}` })
    }
    const salario = Number(f.salario)
    if (isNaN(salario) || salario < 0) {
      errors.push({ aba: 'Funcionarios', linha, campo: 'salario', mensagem: 'Salário deve ser um número >= 0' })
    }
    if (f.equipe !== undefined && f.equipe !== '' && f.equipe !== null) {
      const eq = Number(f.equipe)
      if (isNaN(eq) || eq < 0 || !Number.isInteger(eq)) {
        errors.push({ aba: 'Funcionarios', linha, campo: 'equipe', mensagem: 'Equipe deve ser um número inteiro >= 0' })
      }
    }
  })

  // Produção
  data.producao.forEach((p, i) => {
    const linha = i + 2
    if (!p.evento || String(p.evento).trim() === '') {
      errors.push({ aba: 'Producao', linha, campo: 'evento', mensagem: 'Evento é obrigatório' })
    }
    const qtd = Number(p.quantidade_atendimentos)
    if (isNaN(qtd) || qtd < 0) {
      errors.push({ aba: 'Producao', linha, campo: 'quantidade_atendimentos', mensagem: 'Quantidade deve ser um número >= 0' })
    }
  })

  // Custos genéricos
  function validateCustos(items: RawCusto[], aba: string) {
    items.forEach((item, i) => {
      const linha = i + 2
      if (!item.nome || String(item.nome).trim() === '') {
        errors.push({ aba, linha, campo: 'nome', mensagem: 'Nome é obrigatório' })
      }
      const valor = Number(item.valor)
      if (isNaN(valor) || valor < 0) {
        errors.push({ aba, linha, campo: 'valor', mensagem: 'Valor deve ser um número >= 0' })
      }
    })
  }

  validateCustos(data.materiais_consumo, 'MateriaisConsumo')
  validateCustos(data.insumos, 'Insumos')
  validateCustos(data.administrativos, 'Administrativos')
  validateCustos(data.terceirizados, 'Terceirizados')

  return errors
}

// ─── Importar para o banco ────────────────────────────────────────────────────

export async function importarDados(
  ubsId: string,
  mes: number,
  ano: number,
  data: ReturnType<typeof parseExcel>
): Promise<ImportResult> {
  const errors = validateImport(data)
  if (errors.length > 0) {
    return { success: false, errors }
  }

  // Converte para o formato do salvarLancamentoCompleto
  const funcionarios = data.funcionarios
    .filter((f) => f.nome && String(f.nome).trim())
    .map((f) => ({
      nome: String(f.nome).trim(),
      cargo: String(f.cargo).trim(),
      vinculo: normalizeVinculo(String(f.vinculo))!,
      salario: Number(f.salario) || 0,
      equipe: f.equipe ? Number(f.equipe) : 0,
    }))

  const producao = data.producao
    .filter((p) => p.evento && String(p.evento).trim())
    .map((p) => ({
      evento: String(p.evento).trim(),
      quantidade_atendimentos: Number(p.quantidade_atendimentos) || 0,
      responsaveis: p.responsaveis
        ? String(p.responsaveis).split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    }))

  const mapCusto = (items: RawCusto[]) =>
    items
      .filter((i) => i.nome && String(i.nome).trim())
      .map((i) => ({ nome: String(i.nome).trim(), valor: Number(i.valor) || 0 }))

  try {
    await salvarLancamentoCompleto({
      ubsId,
      mes,
      ano,
      funcionarios,
      producao,
      materiais_consumo: mapCusto(data.materiais_consumo),
      insumos: mapCusto(data.insumos),
      administrativos: mapCusto(data.administrativos),
      terceirizados: mapCusto(data.terceirizados),
    })

    return {
      success: true,
      errors: [],
      resumo: {
        funcionarios: funcionarios.length,
        producao: producao.length,
        materiais: mapCusto(data.materiais_consumo).length,
        insumos: mapCusto(data.insumos).length,
        administrativos: mapCusto(data.administrativos).length,
        terceirizados: mapCusto(data.terceirizados).length,
      },
    }
  } catch (e) {
    return {
      success: false,
      errors: [{ aba: 'Geral', linha: 0, campo: '', mensagem: `Erro ao salvar no banco: ${e}` }],
    }
  }
}

// ─── Gerar modelo Excel ───────────────────────────────────────────────────────

export function gerarModeloExcel(): ArrayBuffer {
  const wb = XLSX.utils.book_new()

  // Aba Funcionários
  const funcData = [
    { nome: 'Maria Silva', cargo: 'Enfermeira', vinculo: 'concursado', salario: 5500, equipe: 1 },
    { nome: 'João Santos', cargo: 'ACS', vinculo: 'clt', salario: 2200, equipe: 1 },
    { nome: 'Ana Costa', cargo: 'Médico', vinculo: 'terceirizado', salario: 12000, equipe: 2 },
  ]
  const wsFunc = XLSX.utils.json_to_sheet(funcData)
  wsFunc['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, wsFunc, 'Funcionarios')

  // Aba Produção
  const prodData = [
    { evento: 'Consulta Médica', quantidade_atendimentos: 320, responsaveis: 'Ana Costa' },
    { evento: 'Vacinação', quantidade_atendimentos: 150, responsaveis: 'Maria Silva, João Santos' },
    { evento: 'Visita Domiciliar', quantidade_atendimentos: 80, responsaveis: '' },
  ]
  const wsProd = XLSX.utils.json_to_sheet(prodData)
  wsProd['!cols'] = [{ wch: 25 }, { wch: 24 }, { wch: 35 }]
  XLSX.utils.book_append_sheet(wb, wsProd, 'Producao')

  // Aba Materiais de Consumo
  const matData = [
    { nome: 'Luvas descartáveis', valor: 450.00 },
    { nome: 'Seringas', valor: 320.00 },
    { nome: 'Algodão', valor: 85.50 },
  ]
  const wsMat = XLSX.utils.json_to_sheet(matData)
  wsMat['!cols'] = [{ wch: 30 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsMat, 'MateriaisConsumo')

  // Aba Insumos
  const insData = [
    { nome: 'Medicamento A', valor: 1200.00 },
    { nome: 'Medicamento B', valor: 800.00 },
  ]
  const wsIns = XLSX.utils.json_to_sheet(insData)
  wsIns['!cols'] = [{ wch: 30 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsIns, 'Insumos')

  // Aba Administrativos
  const admData = [
    { nome: 'Água', valor: 350.00 },
    { nome: 'Energia', valor: 1200.00 },
    { nome: 'Internet', valor: 250.00 },
    { nome: 'Aluguel', valor: 3000.00 },
  ]
  const wsAdm = XLSX.utils.json_to_sheet(admData)
  wsAdm['!cols'] = [{ wch: 30 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsAdm, 'Administrativos')

  // Aba Terceirizados
  const tercData = [
    { nome: 'Empresa de Limpeza', valor: 2500.00 },
    { nome: 'Segurança', valor: 1800.00 },
  ]
  const wsTerc = XLSX.utils.json_to_sheet(tercData)
  wsTerc['!cols'] = [{ wch: 30 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsTerc, 'Terceirizados')

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
}

export function downloadModelo() {
  const buffer = gerarModeloExcel()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'modelo_lancamento_SICM_Saude.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}
