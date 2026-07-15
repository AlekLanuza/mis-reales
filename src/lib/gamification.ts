import { AppState, Tx } from '../types'
import { currentQuincena, prevQuincena, inQuincena, quincenaOf, todayStr } from './quincena'

// ---------- Racha ----------

/** Días consecutivos (terminando hoy o ayer) con al menos un movimiento. */
export function streak(txs: Tx[]): number {
  if (txs.length === 0) return 0
  const days = new Set(txs.map((t) => t.date))
  const d = new Date()
  const key = () =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  // La racha no se rompe si hoy todavía no has anotado nada
  if (!days.has(key())) d.setDate(d.getDate() - 1)
  let n = 0
  while (days.has(key())) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

// ---------- Niveles ----------

export interface Level {
  n: number
  name: string
  minXp: number
}

export const LEVELS: Level[] = [
  { n: 1, name: 'Gatito Novato', minXp: 0 },
  { n: 2, name: 'Cazador de Gastos', minXp: 100 },
  { n: 3, name: 'Guardián del Súper', minXp: 250 },
  { n: 4, name: 'Contador Felino', minXp: 500 },
  { n: 5, name: 'Ninja del Ahorro', minXp: 900 },
  { n: 6, name: 'Tigre de la Quincena', minXp: 1400 },
  { n: 7, name: 'Pantera Financiera', minXp: 2000 },
  { n: 8, name: 'Rey de los Reales', minXp: 3000 },
]

export function levelOf(xp: number): Level {
  let lv = LEVELS[0]
  for (const l of LEVELS) if (xp >= l.minXp) lv = l
  return lv
}

export function nextLevel(xp: number): Level | null {
  return LEVELS.find((l) => l.minXp > xp) ?? null
}

// ---------- Logros ----------

export interface Achievement {
  id: string
  name: string
  desc: string
  emoji: string
  test: (s: AppState) => boolean
}

function quincenaVerde(s: AppState): boolean {
  // Alguna quincena YA TERMINADA donde hubo presupuesto y no se pasó
  const totalBudget = Object.values(s.budgets).reduce((a, b) => a + b, 0)
  if (totalBudget <= 0) return false
  const prev = prevQuincena(currentQuincena())
  const gastos = s.txs.filter((t) => t.type === 'gasto' && inQuincena(t.date, prev))
  if (gastos.length === 0) return false
  const total = gastos.reduce((a, t) => a + t.amount, 0)
  return total <= totalBudget
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'primer-paso', name: 'Primer Paso', desc: 'Registraste tu primer movimiento', emoji: '🐾', test: (s) => s.txs.length >= 1 },
  { id: 'racha-3', name: 'Calentando Motores', desc: '3 días seguidos anotando', emoji: '🔥', test: (s) => streak(s.txs) >= 3 || s.bestStreak >= 3 },
  { id: 'racha-7', name: 'Semana Perfecta', desc: '7 días seguidos anotando', emoji: '⚡', test: (s) => streak(s.txs) >= 7 || s.bestStreak >= 7 },
  { id: 'racha-15', name: 'Quincena de Hierro', desc: '15 días seguidos anotando', emoji: '🏆', test: (s) => streak(s.txs) >= 15 || s.bestStreak >= 15 },
  { id: 'contador', name: 'Contador Serio', desc: '25 movimientos registrados', emoji: '📒', test: (s) => s.txs.length >= 25 },
  { id: 'maraton', name: 'Maratonista', desc: '100 movimientos registrados', emoji: '💯', test: (s) => s.txs.length >= 100 },
  { id: 'sonador', name: 'Soñador', desc: 'Creaste tu primera meta', emoji: '🌟', test: (s) => s.goals.length >= 1 },
  { id: 'meta-cumplida', name: '¡Lo Lograste!', desc: 'Completaste una meta de ahorro', emoji: '🎯', test: (s) => s.goals.some((g) => g.saved >= g.target && g.target > 0) },
  { id: 'ahorrista', name: 'Ahorrista', desc: 'Abonaste B/. 100 a tus metas', emoji: '🐷', test: (s) => s.goals.reduce((a, g) => a + g.saved, 0) >= 100 },
  { id: 'sin-deudas', name: 'Libre como Gato', desc: 'Saldaste una deuda completa', emoji: '🕊️', test: (s) => s.debts.some((d) => d.paid >= d.total && d.total > 0) },
  { id: 'quincena-verde', name: 'Quincena Verde', desc: 'Cerraste una quincena sin pasarte del presupuesto', emoji: '💚', test: quincenaVerde },
  { id: 'presupuestador', name: 'Con Plan', desc: 'Definiste tu primer presupuesto', emoji: '🗺️', test: (s) => Object.values(s.budgets).some((v) => v > 0) },
]

/** Devuelve los logros recién desbloqueados y el estado actualizado. */
export function checkAchievements(s: AppState): { state: AppState; nuevos: Achievement[] } {
  const nuevos: Achievement[] = []
  const unlocked = { ...s.unlocked }
  for (const a of ACHIEVEMENTS) {
    if (!unlocked[a.id] && a.test(s)) {
      unlocked[a.id] = Date.now()
      nuevos.push(a)
    }
  }
  if (nuevos.length === 0) return { state: s, nuevos }
  return { state: { ...s, unlocked, xp: s.xp + nuevos.length * 30 }, nuevos }
}

// ---------- Estado de ánimo del gato ----------

export type Mood = 'feliz' | 'neutral' | 'preocupado' | 'juzgando' | 'fiesta'

export function catMood(s: AppState): Mood {
  const q = currentQuincena()
  const totalBudget = Object.values(s.budgets).reduce((a, b) => a + b, 0)
  const gastado = s.txs
    .filter((t) => t.type === 'gasto' && inQuincena(t.date, q))
    .reduce((a, t) => a + t.amount, 0)
  if (totalBudget <= 0) return 'neutral'
  const ratio = gastado / totalBudget
  if (ratio > 1) return 'juzgando'
  if (ratio > 0.85) return 'preocupado'
  if (ratio < 0.5) return 'feliz'
  return 'neutral'
}

const FRASES: Record<Mood, string[]> = {
  feliz: [
    '¡Qué xopa! Vamos suave con la plata. Sigue así. 😼',
    'Tus reales están más tranquilos que yo en una siesta.',
    'Ahorro detectado. Te concedo un ronroneo. 🐾',
    'Miau. Traducción: vas muy bien esta quincena.',
    'Si la plata fuera lana, tendrías una madeja gigante.',
  ],
  neutral: [
    'Todo bajo control. Yo vigilo, tú anota.',
    'Ni muy muy, ni tan tan. Vamos bien.',
    'Recuerda anotar hasta el café. TODO cuenta.',
    'Yo duermo 16 horas, pero tus finanzas nunca duermen.',
    'La quincena avanza. Tú también. 🐾',
  ],
  preocupado: [
    'Ehhh… el presupuesto está que arde. Cuidado. 🙀',
    'Queda poca quincena y menos plata. Solo digo.',
    'Yo que tú, lo pienso dos veces antes del próximo gasto.',
    'El presupuesto está en las últimas vidas… y no tiene 9.',
    'Alerta amarilla: tu plata se está escapando como ratón.',
  ],
  juzgando: [
    'Te pasaste del presupuesto. Te estoy juzgando. Fuerte. 😾',
    '¿Otra vez delivery? Miau… (eso fue un suspiro).',
    'Mis bigotes detectan gastos fuera de control.',
    'No estoy enojado, estoy decepcionado. Bueno, un poquito enojado.',
    'El presupuesto murió. Presenta tus respetos y ajusta. 🪦',
  ],
  fiesta: [
    '¡¡MIAU!! ¡Eso hay que celebrarlo! 🎉',
    '¡Logro desbloqueado! Hoy te dejo dormir en MI cama.',
    '¡Qué pritti! Sigue así y te nombro humano del año.',
  ],
}

export function fraseDelGato(mood: Mood): string {
  const arr = FRASES[mood]
  return arr[Math.floor(Math.random() * arr.length)]
}

// Reacciones a eventos puntuales
export function reaccion(tx: { type: string; amount: number }, budgetTotal: number): string | null {
  if (tx.type === 'ingreso') {
    const opts = ['¡Llegó la plata! 🤑 Ahora no la sueltes toda.', '¡Ingreso registrado! Mis bigotes vibran de emoción.', '¡Billete! ¿Apartamos algo pa’ la meta? 👀']
    return opts[Math.floor(Math.random() * opts.length)]
  }
  if (budgetTotal > 0 && tx.amount > budgetTotal * 0.25) {
    const opts = ['¡¿B/. cuánto?! Casi me caigo del sofá. 🙀', 'Ese gasto estuvo pesado. Anotado… y juzgado.', 'Guau. Digo… miau. Qué gastote.']
    return opts[Math.floor(Math.random() * opts.length)]
  }
  const opts = ['Anotado. 🐾', 'Registrado, jefe.', 'Ok, lo apunto con mi patita.', '+10 XP por ser responsable. 😽']
  return opts[Math.floor(Math.random() * opts.length)]
}
