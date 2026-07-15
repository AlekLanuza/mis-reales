import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppState, Tx, Goal, Debt } from './types'
import { loadState, saveState, uid } from './lib/store'
import { checkAchievements, reaccion, streak } from './lib/gamification'
import { Confetti } from './components/Confetti'
import { AddModal } from './components/AddModal'
import { Inicio } from './screens/Inicio'
import { Movimientos } from './screens/Movimientos'
import { Presupuesto } from './screens/Presupuesto'
import { Metas } from './screens/Metas'
import { Logros } from './screens/Logros'

type Tab = 'inicio' | 'movs' | 'presupuesto' | 'metas' | 'logros'

const TABS: { id: Tab; ico: string; label: string }[] = [
  { id: 'inicio', ico: '🏠', label: 'Inicio' },
  { id: 'movs', ico: '📒', label: 'Movs' },
  { id: 'presupuesto', ico: '🗺️', label: 'Plan' },
  { id: 'metas', ico: '🎯', label: 'Metas' },
]

export default function App() {
  const [state, setState] = useState<AppState>(loadState)
  const [tab, setTab] = useState<Tab>('inicio')
  const [showAdd, setShowAdd] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [confetti, setConfetti] = useState(false)

  useEffect(() => saveState(state), [state])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2800)
  }, [])

  /** Aplica un cambio, actualiza racha récord y revisa logros. */
  const apply = useCallback(
    (fn: (s: AppState) => AppState, opts?: { celebrar?: boolean; toast?: string }) => {
      setState((prev) => {
        let next = fn(prev)
        const st = streak(next.txs)
        if (st > next.bestStreak) next = { ...next, bestStreak: st }
        const { state: withAch, nuevos } = checkAchievements(next)
        if (nuevos.length > 0) {
          setConfetti(true)
          window.setTimeout(
            () => showToast(`${nuevos[0].emoji} ¡Logro desbloqueado: ${nuevos[0].name}!`),
            opts?.toast ? 1200 : 0
          )
        } else if (opts?.celebrar) {
          setConfetti(true)
        }
        return withAch
      })
      if (opts?.toast) showToast(opts.toast)
    },
    [showToast]
  )

  const budgetTotal = useMemo(
    () => Object.values(state.budgets).reduce((a, b) => a + b, 0),
    [state.budgets]
  )

  const addTx = useCallback(
    (tx: Omit<Tx, 'id' | 'ts'>) => {
      const full: Tx = { ...tx, id: uid(), ts: Date.now() }
      const frase = reaccion(full, budgetTotal)
      apply((s) => ({ ...s, txs: [full, ...s.txs], xp: s.xp + 10 }), { toast: frase ?? undefined })
      setShowAdd(false)
    },
    [apply, budgetTotal]
  )

  const deleteTx = useCallback(
    (id: string) => apply((s) => ({ ...s, txs: s.txs.filter((t) => t.id !== id) }), { toast: 'Movimiento borrado 🗑️' }),
    [apply]
  )

  const setBudget = useCallback(
    (catId: string, amount: number) =>
      apply((s) => ({ ...s, budgets: { ...s.budgets, [catId]: amount } })),
    [apply]
  )

  const addGoal = useCallback(
    (g: Omit<Goal, 'id' | 'saved'>) =>
      apply((s) => ({ ...s, goals: [...s.goals, { ...g, id: uid(), saved: 0 }], xp: s.xp + 15 }), {
        toast: '🌟 ¡Meta creada! A por ella.',
      }),
    [apply]
  )

  const abonarGoal = useCallback(
    (id: string, monto: number) =>
      apply(
        (s) => {
          const goals = s.goals.map((g) => {
            if (g.id !== id) return g
            const saved = g.saved + monto
            const done = saved >= g.target && !g.doneTs
            return { ...g, saved, doneTs: done ? Date.now() : g.doneTs }
          })
          return { ...s, goals, xp: s.xp + 25 }
        },
        {
          celebrar: state.goals.some((g) => g.id === id && g.saved + monto >= g.target && !g.doneTs),
          toast: '🐷 Abono registrado. ¡Eso!',
        }
      ),
    [apply, state.goals]
  )

  const deleteGoal = useCallback(
    (id: string) => apply((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) })),
    [apply]
  )

  const addDebt = useCallback(
    (d: Omit<Debt, 'id' | 'paid'>) =>
      apply((s) => ({ ...s, debts: [...s.debts, { ...d, id: uid(), paid: 0 }] }), {
        toast: 'Deuda anotada. La vamos a matar juntos. ⚔️',
      }),
    [apply]
  )

  const pagarDebt = useCallback(
    (id: string, monto: number) =>
      apply(
        (s) => {
          const debts = s.debts.map((d) => {
            if (d.id !== id) return d
            const paid = d.paid + monto
            const off = paid >= d.total && !d.paidOffTs
            return { ...d, paid, paidOffTs: off ? Date.now() : d.paidOffTs }
          })
          return { ...s, debts, xp: s.xp + 20 }
        },
        {
          celebrar: state.debts.some((d) => d.id === id && d.paid + monto >= d.total && !d.paidOffTs),
          toast: '⚔️ Pago registrado. La deuda tiembla.',
        }
      ),
    [apply, state.debts]
  )

  const deleteDebt = useCallback(
    (id: string) => apply((s) => ({ ...s, debts: s.debts.filter((d) => d.id !== id) })),
    [apply]
  )

  const replaceState = useCallback((s: AppState) => setState(s), [])

  return (
    <>
      {tab === 'inicio' && (
        <Inicio state={state} onVerLogros={() => setTab('logros')} onAgregar={() => setShowAdd(true)} />
      )}
      {tab === 'movs' && <Movimientos state={state} onDelete={deleteTx} onAgregar={() => setShowAdd(true)} />}
      {tab === 'presupuesto' && <Presupuesto state={state} onSetBudget={setBudget} />}
      {tab === 'metas' && (
        <Metas
          state={state}
          onAddGoal={addGoal}
          onAbonar={abonarGoal}
          onDeleteGoal={deleteGoal}
          onAddDebt={addDebt}
          onPagar={pagarDebt}
          onDeleteDebt={deleteDebt}
        />
      )}
      {tab === 'logros' && <Logros state={state} onReplaceState={replaceState} showToast={showToast} />}

      <nav className="tabbar">
        {TABS.slice(0, 2).map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            <span className="ico">{t.ico}</span>
            {t.label}
          </button>
        ))}
        <button className="fab" aria-label="Agregar movimiento" onClick={() => setShowAdd(true)}>
          +
        </button>
        {TABS.slice(2).map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            <span className="ico">{t.ico}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {showAdd && <AddModal onAdd={addTx} onClose={() => setShowAdd(false)} />}
      {toast && <div className="toast">{toast}</div>}
      {confetti && <Confetti onDone={() => setConfetti(false)} />}
    </>
  )
}
