// Quincenas basadas en los días de cobro del usuario (p.ej. 15 y 30):
// van del día de cobro hasta el día anterior al siguiente cobro.
// Ej. con 15/30: del 15 al 29, y del 30 al 14 del mes siguiente.
// Los días mayores al largo del mes se ajustan (feb: el "30" es el 28/29).

export interface Quincena {
  key: string // fecha de inicio, "2026-07-15"
  start: string // YYYY-MM-DD
  end: string // YYYY-MM-DD
  label: string
}

export interface Paydays {
  payday1: number
  payday2: number
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]
const MESES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function lastDayOf(y: number, m: number): number {
  return new Date(y, m, 0).getDate()
}

function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d + n)
  return ymd(dt.getFullYear(), dt.getMonth() + 1, dt.getDate())
}

/** Día de corte ajustado al mes (payday 30 en febrero -> 28/29). */
function clampDay(day: number, y: number, m: number): number {
  return Math.min(day, lastDayOf(y, m))
}

function normalize(p: Paydays): { a: number; b: number } {
  let a = Math.max(1, Math.min(31, Math.floor(p.payday1) || 15))
  let b = Math.max(1, Math.min(31, Math.floor(p.payday2) || 30))
  if (a > b) [a, b] = [b, a]
  if (a === b) b = a === 31 ? 15 : Math.min(31, a + 15)
  return { a, b }
}

export function quincenaOf(dateStr: string, p: Paydays): Quincena {
  const { a, b } = normalize(p)
  const [y, m, d] = dateStr.split('-').map(Number)
  const ca = clampDay(a, y, m)
  const cb = clampDay(b, y, m)

  let start: string
  let end: string
  if (d >= ca && d < cb) {
    start = ymd(y, m, ca)
    end = addDays(ymd(y, m, cb), -1)
  } else if (d >= cb) {
    start = ymd(y, m, cb)
    const ny = m === 12 ? y + 1 : y
    const nm = m === 12 ? 1 : m + 1
    end = addDays(ymd(ny, nm, clampDay(a, ny, nm)), -1)
  } else {
    const py = m === 1 ? y - 1 : y
    const pm = m === 1 ? 12 : m - 1
    start = ymd(py, pm, clampDay(b, py, pm))
    end = addDays(ymd(y, m, ca), -1)
  }
  return { key: start, start, end, label: labelFor(start, end) }
}

function labelFor(start: string, end: string): string {
  const [, sm, sd] = start.split('-').map(Number)
  const [, em, ed] = end.split('-').map(Number)
  if (sm === em) return `${sd}–${ed} de ${MESES[sm - 1]}`
  return `${sd} ${MESES_CORTO[sm - 1]} – ${ed} ${MESES_CORTO[em - 1]}`
}

export function currentQuincena(p: Paydays): Quincena {
  return quincenaOf(todayStr(), p)
}

export function prevQuincena(q: Quincena, p: Paydays): Quincena {
  return quincenaOf(addDays(q.start, -1), p)
}

export function nextQuincena(q: Quincena, p: Paydays): Quincena {
  return quincenaOf(addDays(q.end, 1), p)
}

export function inQuincena(dateStr: string, q: Quincena): boolean {
  return dateStr >= q.start && dateStr <= q.end
}

/** Días restantes de la quincena (incluye hoy). */
export function diasRestantes(q: Quincena): number {
  const t = todayStr()
  if (t > q.end) return 1
  let n = 0
  let d = t
  while (d <= q.end) {
    n++
    d = addDays(d, 1)
  }
  return Math.max(1, n)
}

export function fmtFecha(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const hoy = todayStr()
  if (dateStr === hoy) return 'Hoy'
  if (dateStr === addDays(hoy, -1)) return 'Ayer'
  const suf = y !== Number(hoy.slice(0, 4)) ? ` ${y}` : ''
  return `${d} de ${MESES[m - 1]}${suf}`
}

export function fmtFechaCorta(dateStr: string): string {
  const [, m, d] = dateStr.split('-').map(Number)
  return `${d} ${MESES_CORTO[m - 1]}`
}

export { addDays, MESES, MESES_CORTO }
