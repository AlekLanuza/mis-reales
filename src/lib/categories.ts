import { AppState, CustomCat } from '../types'

// Colores de series: paleta categórica validada (CVD-safe, orden fijo).
// Las categorías personalizadas toman el siguiente color de la misma paleta;
// cada barra siempre lleva su etiqueta visible, así que la identidad
// nunca depende solo del color.

export interface Category {
  id: string
  name: string
  emoji: string
  color: string
  builtin?: boolean
}

export const PALETTE = ['#2a78d6', '#1baf7a', '#eda100', '#008300', '#4a3aa7', '#e34948', '#e87ba4', '#eb6834']

export const GASTO_CATS: Category[] = [
  { id: 'comida', name: 'Comida', emoji: '🍔', color: PALETTE[0], builtin: true },
  { id: 'super', name: 'Súper', emoji: '🛒', color: PALETTE[1], builtin: true },
  { id: 'transporte', name: 'Transporte', emoji: '🚗', color: PALETTE[2], builtin: true },
  { id: 'casa', name: 'Casa', emoji: '🏠', color: PALETTE[3], builtin: true },
  { id: 'salud', name: 'Salud', emoji: '💊', color: PALETTE[4], builtin: true },
  { id: 'diversion', name: 'Diversión', emoji: '🎉', color: PALETTE[5], builtin: true },
  { id: 'ropa', name: 'Ropa', emoji: '👕', color: PALETTE[6], builtin: true },
  { id: 'otros', name: 'Otros', emoji: '✨', color: PALETTE[7], builtin: true },
]

// Categorías especiales para pagos automáticos (deudas y ahorro a metas)
export const CAT_DEUDA: Category = { id: 'deuda', name: 'Deudas', emoji: '⚔️', color: '#898781', builtin: true }
export const CAT_AHORRO: Category = { id: 'ahorro', name: 'Ahorro', emoji: '🐷', color: '#57c48f', builtin: true }

export const INGRESO_CATS: Category[] = [
  { id: 'salario', name: 'Salario', emoji: '💼', color: PALETTE[1], builtin: true },
  { id: 'extra', name: 'Extra', emoji: '💸', color: PALETTE[0], builtin: true },
  { id: 'otros-ing', name: 'Otros', emoji: '✨', color: PALETTE[7], builtin: true },
]

export function customToCategory(c: CustomCat, index: number): Category {
  return { id: c.id, name: c.name, emoji: c.emoji, color: PALETTE[index % PALETTE.length] }
}

/** Todas las categorías de gasto elegibles al registrar (sin deuda/ahorro). */
export function gastoCats(state: AppState): Category[] {
  return [...GASTO_CATS, ...state.customCats.map(customToCategory)]
}

/** Todas las categorías de gasto que pueden aparecer en movimientos/informes. */
export function allGastoCats(state: AppState): Category[] {
  return [...gastoCats(state), CAT_DEUDA, CAT_AHORRO]
}

export function catById(state: AppState, id: string): Category {
  return (
    allGastoCats(state).find((c) => c.id === id) ??
    INGRESO_CATS.find((c) => c.id === id) ??
    { id, name: id, emoji: '❓', color: '#898781' }
  )
}

export function fmtB(n: number): string {
  const abs = Math.abs(n)
  const s = abs.toLocaleString('es-PA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${n < 0 ? '−' : ''}B/. ${s}`
}

export function fmtB0(n: number): string {
  const abs = Math.abs(n)
  const s = abs.toLocaleString('es-PA', { maximumFractionDigits: 0 })
  return `${n < 0 ? '−' : ''}B/. ${s}`
}
