import { AppState, EMPTY_STATE } from '../types'

const KEY = 'misreales:v1'

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY_STATE
    const parsed = JSON.parse(raw)
    return { ...EMPTY_STATE, ...parsed }
  } catch {
    return EMPTY_STATE
  }
}

export function saveState(s: AppState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    // almacenamiento lleno o no disponible: la app sigue en memoria
  }
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function exportBackup(s: AppState): string {
  return JSON.stringify({ app: 'mis-reales', version: 1, exportedAt: new Date().toISOString(), data: s }, null, 2)
}

export function importBackup(json: string): AppState | null {
  try {
    const parsed = JSON.parse(json)
    const data = parsed?.data ?? parsed
    if (!Array.isArray(data.txs)) return null
    return { ...EMPTY_STATE, ...data }
  } catch {
    return null
  }
}
