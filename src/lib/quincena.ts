// Quincenas: del 1 al 15, y del 16 al fin de mes.

export interface Quincena {
  key: string // "2026-07-Q1"
  start: string // YYYY-MM-DD
  end: string // YYYY-MM-DD
  label: string
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

export function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function quincenaOf(dateStr: string): Quincena {
  const [y, m, d] = dateStr.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  const q1 = d <= 15
  const mm = String(m).padStart(2, '0')
  return {
    key: `${y}-${mm}-${q1 ? 'Q1' : 'Q2'}`,
    start: `${y}-${mm}-${q1 ? '01' : '16'}`,
    end: `${y}-${mm}-${q1 ? '15' : String(lastDay).padStart(2, '0')}`,
    label: q1 ? `1–15 de ${MESES[m - 1]}` : `16–${lastDay} de ${MESES[m - 1]}`,
  }
}

export function currentQuincena(): Quincena {
  return quincenaOf(todayStr())
}

export function prevQuincena(q: Quincena): Quincena {
  const [y, m] = q.start.split('-').map(Number)
  if (q.key.endsWith('Q2')) return quincenaOf(`${y}-${String(m).padStart(2, '0')}-01`)
  const py = m === 1 ? y - 1 : y
  const pm = m === 1 ? 12 : m - 1
  return quincenaOf(`${py}-${String(pm).padStart(2, '0')}-16`)
}

export function inQuincena(dateStr: string, q: Quincena): boolean {
  return dateStr >= q.start && dateStr <= q.end
}

/** Días restantes de la quincena actual (incluye hoy). */
export function diasRestantes(q: Quincena): number {
  const today = todayStr()
  const [, , de] = q.end.split('-').map(Number)
  const [, , dh] = today.split('-').map(Number)
  return Math.max(1, de - dh + 1)
}

export function fmtFecha(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const hoy = todayStr()
  if (dateStr === hoy) return 'Hoy'
  const ayer = new Date(y, m - 1, d)
  const hoyD = new Date()
  hoyD.setHours(0, 0, 0, 0)
  ayer.setHours(0, 0, 0, 0)
  if (hoyD.getTime() - ayer.getTime() === 86400000) return 'Ayer'
  return `${d} de ${MESES[m - 1]}`
}
