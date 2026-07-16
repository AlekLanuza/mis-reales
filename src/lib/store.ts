import { AppState, EMPTY_STATE, DEFAULT_PROFILE } from '../types'

const KEY = 'misreales:v1'

function migrate(parsed: Record<string, unknown>): AppState {
  const s: AppState = { ...EMPTY_STATE, ...parsed, version: 2 }
  s.profile = { ...DEFAULT_PROFILE, ...(parsed.profile as object | undefined) }
  if (!Array.isArray(s.customCats)) s.customCats = []
  if (!Array.isArray(s.fixed)) s.fixed = []
  s.fixed = s.fixed.map((f) => ({ ...f, resolved: f.resolved ?? {} }))
  return s
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY_STATE
    return migrate(JSON.parse(raw))
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
  return JSON.stringify({ app: 'mis-reales', version: 2, exportedAt: new Date().toISOString(), data: s }, null, 2)
}

export function importBackup(json: string): AppState | null {
  try {
    const parsed = JSON.parse(json)
    const data = parsed?.data ?? parsed
    if (!Array.isArray(data.txs)) return null
    return migrate(data)
  } catch {
    return null
  }
}
