export type TxType = 'gasto' | 'ingreso'

export interface Tx {
  id: string
  type: TxType
  amount: number
  cat: string
  note?: string
  date: string // YYYY-MM-DD
  ts: number
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

export interface AppState {
  txs: Tx[]
  budgets: Record<string, number> // por categoría, por quincena
  goals: Goal[]
  debts: Debt[]
  unlocked: Record<string, number> // logro id -> timestamp
  xp: number
  bestStreak: number
}

export const EMPTY_STATE: AppState = {
  txs: [],
  budgets: {},
  goals: [],
  debts: [],
  unlocked: {},
  xp: 0,
  bestStreak: 0,
}
