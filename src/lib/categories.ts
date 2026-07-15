// Colores de series: paleta categórica validada (CVD-safe, orden fijo).
// El orden de asignación nunca cambia aunque falten categorías.

export interface Category {
  id: string
  name: string
  emoji: string
  color: string
}

export const GASTO_CATS: Category[] = [
  { id: 'comida', name: 'Comida', emoji: '🍔', color: '#2a78d6' },
  { id: 'super', name: 'Súper', emoji: '🛒', color: '#1baf7a' },
  { id: 'transporte', name: 'Transporte', emoji: '🚗', color: '#eda100' },
  { id: 'casa', name: 'Casa', emoji: '🏠', color: '#008300' },
  { id: 'salud', name: 'Salud', emoji: '💊', color: '#4a3aa7' },
  { id: 'diversion', name: 'Diversión', emoji: '🎉', color: '#e34948' },
  { id: 'ropa', name: 'Ropa', emoji: '👕', color: '#e87ba4' },
  { id: 'otros', name: 'Otros', emoji: '✨', color: '#eb6834' },
]

export const INGRESO_CATS: Category[] = [
  { id: 'salario', name: 'Salario', emoji: '💼', color: '#1baf7a' },
  { id: 'extra', name: 'Extra', emoji: '💸', color: '#2a78d6' },
  { id: 'otros-ing', name: 'Otros', emoji: '✨', color: '#eb6834' },
]

export function catById(id: string): Category {
  return (
    GASTO_CATS.find((c) => c.id === id) ??
    INGRESO_CATS.find((c) => c.id === id) ??
    { id, name: id, emoji: '❓', color: '#898781' }
  )
}

export function fmtB(n: number): string {
  const abs = Math.abs(n)
  const s = abs.toLocaleString('es-PA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${n < 0 ? '−' : ''}B/. ${s}`
}
