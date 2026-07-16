export type TxType = 'gasto' | 'ingreso'

export interface Tx {
  id: string
  type: TxType
  amount: number
  cat: string
  note?: string
  date: string // YYYY-MM-DD
  ts: number
  /** origen automático: pago de deuda o abono a meta */
  ref?: { kind: 'deuda' | 'meta' | 'fijo'; id: string }
}

export interface Goal {
  id: string
  name: string
  emoji: string
  target: number
  saved: number
  doneTs?: number
}

export interface Debt {
  id: string
  name: string
  total: number
  paid: number
  paidOffTs?: number
}

export interface CustomCat {
  id: string
  name: string
  emoji: string
}

export interface FixedExpense {
  id: string
  name: string
  amount: number
  cat: string
  day: number // día del mes (1-31, se ajusta al último día del mes)
  /** meses ya resueltos: "2026-07" -> 'pagado' | 'omitido' */
  resolved: Record<string, 'pagado' | 'omitido'>
}

export interface Profile {
  name: string
  avatar: string // emoji
  payday1: number // primer día de cobro (1-28)
  payday2: number // segundo día de cobro (p.ej. 30; se ajusta al último día del mes)
}

export interface AppState {
  version: 2
  profile: Profile
  txs: Tx[]
  budgets: Record<string, number> // por categoría, por quincena
  goals: Goal[]
  debts: Debt[]
  customCats: CustomCat[]
  fixed: FixedExpense[]
  unlocked: Record<string, number> // logro id -> timestamp
  xp: number
  bestStreak: number
}

export const DEFAULT_PROFILE: Profile = {
  name: '',
  avatar: '😎',
  payday1: 15,
  payday2: 30,
}

export const EMPTY_STATE: AppState = {
  version: 2,
  profile: DEFAULT_PROFILE,
  txs: [],
  budgets: {},
  goals: [],
  debts: [],
  customCats: [],
  fixed: [],
  unlocked: {},
  xp: 0,
  bestStreak: 0,
}
