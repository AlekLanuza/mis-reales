import { AppState, Tx, FixedExpense } from '../types'
import { currentQuincena, prevQuincena, inQuincena, todayStr } from './quincena'

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

// ---------- Gastos fijos pendientes ----------

export interface FixedPending {
  fixed: FixedExpense
  monthKey: string // "2026-07"
  dueDate: string // YYYY-MM-DD
}

/** Gastos fijos cuyo día ya llegó este mes y aún no se confirmaron ni omitieron. */
export function pendingFixed(s: AppState): FixedPending[] {
  const today = todayStr()
  const [y, m, d] = today.split('-').map(Number)
  const monthKey = `${y}-${String(m).padStart(2, '0')}`
  const lastDay = new Date(y, m, 0).getDate()
  const out: FixedPending[] = []
  for (const f of s.fixed) {
    const due = Math.min(f.day, lastDay)
    if (d >= due && !f.resolved[monthKey]) {
      out.push({ fixed: f, monthKey, dueDate: `${monthKey}-${String(due).padStart(2, '0')}` })
    }
  }
  return out
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
  const totalBudget = Object.values(s.budgets).reduce((a, b) => a + b, 0)
  if (totalBudget <= 0) return false
  const prev = prevQuincena(currentQuincena(s.profile), s.profile)
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
  { id: 'creativo', name: 'Creativo', desc: 'Creaste tu primera categoría propia', emoji: '🎨', test: (s) => s.customCats.length >= 1 },
  { id: 'ordenado', name: 'Todo en Orden', desc: 'Definiste tu primer gasto fijo', emoji: '📌', test: (s) => s.fixed.length >= 1 },
  { id: 'identidad', name: 'Mucho Gusto', desc: 'Completaste tu perfil', emoji: '🪪', test: (s) => s.profile.name.trim().length > 0 },
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
  const q = currentQuincena(s.profile)
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
    'Hoy amaneciste con energía de "Rey de los Reales". Me gusta.',
    'Presupuesto sano, gato contento. Así de simple.',
    'Con esta disciplina, hasta yo te prestaría mis ahorros. Y soy gato.',
    'Tu billetera ronronea. La escucho desde aquí.',
    'Sigue así y la meta cae antes de lo que crees. 🎯',
  ],
  neutral: [
    'Todo bajo control. Yo vigilo, tú anota.',
    'Ni muy muy, ni tan tan. Vamos bien.',
    'Recuerda anotar hasta el café. TODO cuenta.',
    'Yo duermo 16 horas, pero tus finanzas nunca duermen.',
    'La quincena avanza. Tú también. 🐾',
    'Día tranquilo. Aprovecha para revisar tu plan.',
    'Un gasto anotado hoy es un susto menos a fin de quincena.',
    'Estoy afilando las uñas… por si aparece un gasto raro.',
    'Dato felino: los que anotan a diario gastan mejor. Miau.',
    '¿Ya pensaste en tu próxima meta? Yo voto por más atún.',
  ],
  preocupado: [
    'Ehhh… el presupuesto está que arde. Cuidado. 🙀',
    'Queda poca quincena y menos plata. Solo digo.',
    'Yo que tú, lo pienso dos veces antes del próximo gasto.',
    'El presupuesto está en las últimas vidas… y no tiene 9.',
    'Alerta amarilla: tu plata se está escapando como ratón.',
    'Respira. Revisa el plan. Y suelta ese carrito de compras.',
    'Mis bigotes tiemblan: el límite está cerquita.',
    'Todavía se puede salvar la quincena. Confío en ti. Más o menos.',
    'Si el presupuesto fuera un ovillo, ya casi no queda hilo.',
  ],
  juzgando: [
    'Te pasaste del presupuesto. Te estoy juzgando. Fuerte. 😾',
    '¿Otra vez delivery? Miau… (eso fue un suspiro).',
    'Mis bigotes detectan gastos fuera de control.',
    'No estoy enojado, estoy decepcionado. Bueno, un poquito enojado.',
    'El presupuesto murió. Presenta tus respetos y ajusta. 🪦',
    'Voy a fingir que no vi ese último gasto. No puedo. Lo vi.',
    'La buena noticia: la próxima quincena existe. La mala: esta ya fue.',
    'Hasta un gato callejero administra mejor. Con cariño lo digo. 😾',
    'Plan de rescate: cero antojos hasta el próximo cobro. Yo superviso.',
  ],
  fiesta: [
    '¡¡MIAU!! ¡Eso hay que celebrarlo! 🎉',
    '¡Logro desbloqueado! Hoy te dejo dormir en MI cama.',
    '¡Qué pritti! Sigue así y te nombro humano del año.',
    '¡Confeti! Odio que se me pegue al pelaje, pero lo vales.',
    '¡Ese es mi humano! Choca esa patita. 🐾',
  ],
}

export function fraseDelGato(mood: Mood, nombre?: string): string {
  const arr = FRASES[mood]
  const f = arr[Math.floor(Math.random() * arr.length)]
  if (nombre && Math.random() < 0.35) return `${nombre}: ${f.charAt(0).toLowerCase()}${f.slice(1)}`
  return f
}

// Reacciones a eventos puntuales
export function reaccion(tx: { type: string; amount: number }, budgetTotal: number): string | null {
  if (tx.type === 'ingreso') {
    const opts = [
      '¡Llegó la plata! 🤑 Ahora no la sueltes toda.',
      '¡Ingreso registrado! Mis bigotes vibran de emoción.',
      '¡Billete! ¿Apartamos algo pa’ la meta? 👀',
      '¡Cobraste! Primero el ahorro, después los antojos. Palabra de gato.',
    ]
    return opts[Math.floor(Math.random() * opts.length)]
  }
  if (budgetTotal > 0 && tx.amount > budgetTotal * 0.25) {
    const opts = [
      '¡¿B/. cuánto?! Casi me caigo del sofá. 🙀',
      'Ese gasto estuvo pesado. Anotado… y juzgado.',
      'Guau. Digo… miau. Qué gastote.',
      'Espero que haya valido la pena. Mis bigotes dicen que no.',
    ]
    return opts[Math.floor(Math.random() * opts.length)]
  }
  const opts = [
    'Anotado. 🐾',
    'Registrado, jefe.',
    'Ok, lo apunto con mi patita.',
    '+10 XP por ser responsable. 😽',
    'Listo. Yo nunca olvido. Soy gato, no pez.',
    'Apuntado en mi libreta imaginaria.',
  ]
  return opts[Math.floor(Math.random() * opts.length)]
}

// ---------- Avisos del gato (al abrir la app) ----------

export interface Aviso {
  id: string
  emoji: string
  texto: string
  prioridad: number // menor = más importante
}

export function avisos(s: AppState): Aviso[] {
  const out: Aviso[] = []
  const q = currentQuincena(s.profile)
  const totalBudget = Object.values(s.budgets).reduce((a, b) => a + b, 0)
  const gastado = s.txs
    .filter((t) => t.type === 'gasto' && inQuincena(t.date, q))
    .reduce((a, t) => a + t.amount, 0)

  for (const p of pendingFixed(s)) {
    out.push({
      id: `fijo-${p.fixed.id}`,
      emoji: '📌',
      texto: `¿Ya pagaste ${p.fixed.name}? Confírmalo en Plan.`,
      prioridad: 1,
    })
  }

  if (totalBudget > 0 && gastado > totalBudget) {
    out.push({ id: 'sobre', emoji: '😾', texto: 'Te pasaste del presupuesto de la quincena.', prioridad: 2 })
  } else if (totalBudget > 0 && gastado > totalBudget * 0.85) {
    out.push({ id: 'limite', emoji: '🙀', texto: 'Vas por más del 85% del presupuesto. Ojo.', prioridad: 3 })
  }

  const st = streak(s.txs)
  const hoy = todayStr()
  const anotoHoy = s.txs.some((t) => t.date === hoy)
  if (st >= 2 && !anotoHoy) {
    out.push({ id: 'racha', emoji: '🔥', texto: `Racha de ${st} días en juego: anota algo hoy.`, prioridad: 4 })
  }

  for (const g of s.goals) {
    if (!g.doneTs && g.target > 0 && g.saved / g.target >= 0.9 && g.saved < g.target) {
      out.push({ id: `meta-${g.id}`, emoji: '🎯', texto: `"${g.name}" está al ${Math.floor((g.saved / g.target) * 100)}%. ¡Un empujón más!`, prioridad: 5 })
    }
  }

  return out.sort((a, b) => a.prioridad - b.prioridad).slice(0, 3)
}
