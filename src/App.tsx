import { useCallback, useMemo, useEffect, useState } from 'react'
import { AppState, Tx, Goal, Debt, CustomCat, FixedExpense, Profile } from './types'
import { loadState, saveState, uid } from './lib/store'
import { checkAchievements, reaccion, streak } from './lib/gamification'
import { todayStr } from './lib/quincena'
import { Confetti } from './components/Confetti'
import { AddModal } from './components/AddModal'
import { Inicio } from './screens/Inicio'
import { Movimientos } from './screens/Movimientos'
import { Informes } from './screens/Informes'
import { Presupuesto } from './screens/Presupuesto'
import { Metas } from './screens/Metas'
import { Logros } from './screens/Logros'
import { Perfil } from './screens/Perfil'

type Tab = 'inicio' | 'movs' | 'informes' | 'plan' | 'metas' | 'logros' | 'perfil'

const TABS: { id: Tab; ico: string; label: string }[] = [
  { id: 'inicio', ico: '🏠', label: 'Inicio' },
  { id: 'movs', ico: '📒', label: 'Movs' },
  { id: 'informes', ico: '📊', label: 'Informes' },
  { id: 'plan', ico: '🗺️', label: 'Plan' },
  { id: 'metas', ico: '🎯', label: 'Metas' },
]

export default function App() {
  const [state, setState] = useState<AppState>(loadState)
  const [tab, setTab] = useState<Tab>('inicio')
  const [showAdd, setShowAdd] = useState(false)
  const [editTx, setEditTx] = useState<Tx | undefined>(undefined)
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

  // ---------- Movimientos ----------

  const addTx = useCallback(
    (tx: Omit<Tx, 'id' | 'ts'>) => {
      const full: Tx = { ...tx, id: uid(), ts: Date.now() }
      const frase = reaccion(full, budgetTotal)
      apply((s) => ({ ...s, txs: [full, ...s.txs], xp: s.xp + 10 }), { toast: frase ?? undefined })
      setShowAdd(false)
    },
    [apply, budgetTotal]
  )

  /** Ajusta deuda/meta vinculada cuando se edita o borra su movimiento. */
  const syncRef = (s: AppState, tx: Tx, delta: number): AppState => {
    if (!tx.ref) return s
    if (tx.ref.kind === 'deuda') {
      return {
        ...s,
        debts: s.debts.map((d) =>
          d.id === tx.ref!.id ? { ...d, paid: Math.max(0, d.paid + delta), paidOffTs: d.paid + delta >= d.total ? d.paidOffTs ?? Date.now() : undefined } : d
        ),
      }
    }
    if (tx.ref.kind === 'meta') {
      return {
        ...s,
        goals: s.goals.map((g) =>
          g.id === tx.ref!.id ? { ...g, saved: Math.max(0, g.saved + delta), doneTs: g.saved + delta >= g.target ? g.doneTs ?? Date.now() : undefined } : g
        ),
      }
    }
    return s
  }

  const updateTx = useCallback(
    (tx: Tx) => {
      apply(
        (s) => {
          const old = s.txs.find((t) => t.id === tx.id)
          let next = { ...s, txs: s.txs.map((t) => (t.id === tx.id ? tx : t)) }
          if (old && old.amount !== tx.amount) next = syncRef(next, tx, tx.amount - old.amount)
          return next
        },
        { toast: 'Movimiento corregido ✏️' }
      )
      setShowAdd(false)
      setEditTx(undefined)
    },
    [apply]
  )

  const deleteTx = useCallback(
    (id: string) =>
      apply(
        (s) => {
          const tx = s.txs.find((t) => t.id === id)
          let next = { ...s, txs: s.txs.filter((t) => t.id !== id) }
          if (tx) next = syncRef(next, tx, -tx.amount)
          return next
        },
        { toast: 'Movimiento borrado 🗑️' }
      ),
    [apply]
  )

  const openEdit = useCallback((tx: Tx) => {
    setEditTx(tx)
    setShowAdd(true)
  }, [])

  // ---------- Categorías ----------

  const createCat = useCallback(
    (c: Omit<CustomCat, 'id'>): string => {
      const id = `c-${uid()}`
      apply((s) => ({ ...s, customCats: [...s.customCats, { ...c, id }] }), {
        toast: `${c.emoji} Categoría "${c.name}" creada`,
      })
      return id
    },
    [apply]
  )

  const deleteCat = useCallback(
    (id: string) =>
      apply((s) => {
        const budgets = { ...s.budgets }
        delete budgets[id]
        return {
          ...s,
          customCats: s.customCats.filter((c) => c.id !== id),
          budgets,
          txs: s.txs.map((t) => (t.cat === id ? { ...t, cat: 'otros' } : t)),
        }
      }, { toast: 'Categoría borrada; sus movimientos pasaron a ✨ Otros' }),
    [apply]
  )

  const setBudget = useCallback(
    (catId: string, amount: number) =>
      apply((s) => ({ ...s, budgets: { ...s.budgets, [catId]: amount } })),
    [apply]
  )

  // ---------- Gastos fijos ----------

  const saveFixed = useCallback(
    (f: Omit<FixedExpense, 'id' | 'resolved'> & { id?: string }) =>
      apply((s) => {
        if (f.id) {
          return { ...s, fixed: s.fixed.map((x) => (x.id === f.id ? { ...x, ...f, id: x.id } : x)) }
        }
        return { ...s, fixed: [...s.fixed, { ...f, id: uid(), resolved: {} }] }
      }, { toast: f.id ? 'Gasto fijo actualizado 📌' : 'Gasto fijo agregado 📌' }),
    [apply]
  )

  const deleteFixed = useCallback(
    (id: string) => apply((s) => ({ ...s, fixed: s.fixed.filter((f) => f.id !== id) })),
    [apply]
  )

  const resolveFixed = useCallback(
    (id: string, monthKey: string, action: 'pagado' | 'omitido') =>
      apply(
        (s) => {
          const f = s.fixed.find((x) => x.id === id)
          if (!f) return s
          const fixed = s.fixed.map((x) =>
            x.id === id ? { ...x, resolved: { ...x.resolved, [monthKey]: action } } : x
          )
          if (action === 'omitido') return { ...s, fixed }
          const tx: Tx = {
            id: uid(),
            type: 'gasto',
            amount: f.amount,
            cat: f.cat,
            note: `${f.name} (gasto fijo)`,
            date: todayStr(),
            ts: Date.now(),
            ref: { kind: 'fijo', id: f.id },
          }
          return { ...s, fixed, txs: [tx, ...s.txs], xp: s.xp + 10 }
        },
        { toast: action === 'pagado' ? '📌 Pagado y anotado en movimientos' : 'Ok, este mes lo salto 👌' }
      ),
    [apply]
  )

  // ---------- Metas ----------

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
          const goal = s.goals.find((g) => g.id === id)
          if (!goal) return s
          const goals = s.goals.map((g) => {
            if (g.id !== id) return g
            const saved = g.saved + monto
            const done = saved >= g.target && !g.doneTs
            return { ...g, saved, doneTs: done ? Date.now() : g.doneTs }
          })
          const tx: Tx = {
            id: uid(),
            type: 'gasto',
            amount: monto,
            cat: 'ahorro',
            note: `Abono a "${goal.name}"`,
            date: todayStr(),
            ts: Date.now(),
            ref: { kind: 'meta', id },
          }
          return { ...s, goals, txs: [tx, ...s.txs], xp: s.xp + 25 }
        },
        {
          celebrar: state.goals.some((g) => g.id === id && g.saved + monto >= g.target && !g.doneTs),
          toast: '🐷 Abono registrado (quedó en tus movimientos).',
        }
      ),
    [apply, state.goals]
  )

  const deleteGoal = useCallback(
    (id: string) => apply((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) })),
    [apply]
  )

  // ---------- Deudas ----------

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
          const debt = s.debts.find((d) => d.id === id)
          if (!debt) return s
          const debts = s.debts.map((d) => {
            if (d.id !== id) return d
            const paid = d.paid + monto
            const off = paid >= d.total && !d.paidOffTs
            return { ...d, paid, paidOffTs: off ? Date.now() : d.paidOffTs }
          })
          const tx: Tx = {
            id: uid(),
            type: 'gasto',
            amount: monto,
            cat: 'deuda',
            note: `Pago de "${debt.name}"`,
            date: todayStr(),
            ts: Date.now(),
            ref: { kind: 'deuda', id },
          }
          return { ...s, debts, txs: [tx, ...s.txs], xp: s.xp + 20 }
        },
        {
          celebrar: state.debts.some((d) => d.id === id && d.paid + monto >= d.total && !d.paidOffTs),
          toast: '⚔️ Pago registrado (quedó en tus movimientos).',
        }
      ),
    [apply, state.debts]
  )

  const deleteDebt = useCallback(
    (id: string) => apply((s) => ({ ...s, debts: s.debts.filter((d) => d.id !== id) })),
    [apply]
  )

  // ---------- Perfil ----------

  const saveProfile = useCallback(
    (p: Profile) => apply((s) => ({ ...s, profile: p }), { toast: 'Perfil guardado 🪪' }),
    [apply]
  )

  const replaceState = useCallback((s: AppState) => setState(s), [])

  const closeModal = useCallback(() => {
    setShowAdd(false)
    setEditTx(undefined)
  }, [])

  return (
    <>
      {tab === 'inicio' && (
        <Inicio
          state={state}
          onVerLogros={() => setTab('logros')}
          onVerPerfil={() => setTab('perfil')}
          onAgregar={() => setShowAdd(true)}
          onResolveFixed={resolveFixed}
        />
      )}
      {tab === 'movs' && <Movimientos state={state} onDelete={deleteTx} onEdit={openEdit} onAgregar={() => setShowAdd(true)} />}
      {tab === 'informes' && <Informes state={state} />}
      {tab === 'plan' && (
        <Presupuesto
          state={state}
          onSetBudget={setBudget}
          onCreateCat={createCat}
          onDeleteCat={deleteCat}
          onSaveFixed={saveFixed}
          onDeleteFixed={deleteFixed}
          onResolveFixed={resolveFixed}
        />
      )}
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
      {tab === 'logros' && <Logros state={state} onVolver={() => setTab('inicio')} />}
      {tab === 'perfil' && (
        <Perfil
          state={state}
          onSave={saveProfile}
          onVolver={() => setTab('inicio')}
          onReplaceState={replaceState}
          showToast={showToast}
        />
      )}

      <nav className="tabbar">
        {TABS.slice(0, 2).map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            <span className="ico">{t.ico}</span>
            {t.label}
          </button>
        ))}
        <button className="fab" aria-label="Agregar movimiento" onClick={() => { setEditTx(undefined); setShowAdd(true) }}>
          +
        </button>
        {TABS.slice(2).map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            <span className="ico">{t.ico}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {showAdd && (
        <AddModal
          state={state}
          editTx={editTx}
          onAdd={addTx}
          onUpdate={updateTx}
          onCreateCat={createCat}
          onClose={closeModal}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
      {confetti && <Confetti onDone={() => setConfetti(false)} />}
    </>
  )
}
