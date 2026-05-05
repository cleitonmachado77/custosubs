const BASE = 'https://servicodados.ibge.gov.br/api/v1/localidades'

export interface MunicipioIBGE {
  id: number
  nome: string
}

// Cache simples em memória para não repetir chamadas durante a sessão
const cache: Record<string, MunicipioIBGE[]> = {}

export async function getMunicipiosPorEstado(uf: string): Promise<MunicipioIBGE[]> {
  if (cache[uf]) return cache[uf]

  const res = await fetch(`${BASE}/estados/${uf}/municipios?orderBy=nome`)
  if (!res.ok) throw new Error(`Erro ao buscar municípios: ${res.status}`)

  const data: MunicipioIBGE[] = await res.json()
  cache[uf] = data
  return data
}
