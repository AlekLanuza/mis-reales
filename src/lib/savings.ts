import { AppState, Tx } from '../types'

// El fondo libre se deriva de los movimientos: depósitos (gasto cat 'ahorro'
// sin vínculo a meta) menos retiros (ingreso cat 'retiro'). Así, editar o
// borrar un movimiento ajusta el fondo sin sincronización aparte.

export function esDeposito(t: Tx): boolean {
  return t.type === 'gasto' && t.cat === 'ahorro' && t.ref?.kind !== 'meta'
}

export function esRetiro(t: Tx): boolean {
  return t.type === 'ingreso' && t.cat === 'retiro'
}

export function fondoLibre(s: AppState): number {
  let v = 0
  for (const t of s.txs) {
    if (esDeposito(t)) v += t.amount
    else if (esRetiro(t)) v -= t.amount
  }
  return Math.round(v * 100) / 100
}

export function ahorroEnMetas(s: AppState): number {
  return Math.round(s.goals.reduce((a, g) => a + g.saved, 0) * 100) / 100
}

export function ahorroTotal(s: AppState): number {
  return Math.round((fondoLibre(s) + ahorroEnMetas(s)) * 100) / 100
}
