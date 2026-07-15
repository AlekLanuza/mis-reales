import { useMemo, useState } from 'react'
import { AppState } from '../types'
import { GASTO_CATS, fmtB } from '../lib/categories'
import { currentQuincena, inQuincena, diasRestantes } from '../lib/quincena'

export function Presupuesto({
  state,
  onSetBudget,
}: {
  state: AppState
  onSetBudget: (catId: string, amount: number) => void
}) {
  const q = currentQuincena()
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const gastoPorCat = useMemo(() => {
    const m = new Map<string, number>()
    for (const t of state.txs) {
      if (t.type !== 'gasto' || !inQuincena(t.date, q)) continue
      m.set(t.cat, (m.get(t.cat) ?? 0) + t.amount)
    }
    return m
  }, [state.txs, q.key])

  const budgetTotal = Object.values(state.budgets).reduce((a, b) => a + b, 0)
  const gastadoTotal = [...gastoPorCat.values()].reduce((a, b) => a + b, 0)
  const dias = diasRestantes(q)

  const guardar = (catId: string) => {
    const v = parseFloat(draft)
    onSetBudget(catId, isNaN(v) || v < 0 ? 0 : Math.round(v * 100) / 100)
    setEditing(null)
  }

  const colorMeter = (pct: number) =>
    pct > 100 ? 'var(--rojo)' : pct > 85 ? 'var(--amarillo)' : 'var(--verde)'

  return (
    <div className="screen">
      <h1>Plan de quincena</h1>
      <div className="sub" style={{ marginBottom: 12 }}>
        {q.label} · quedan {dias} día{dias === 1 ? '' : 's'}
      </div>

      <div className="tiles">
        <div className="tile">
          <div className="label">Presupuesto</div>
          <div className="value">{fmtB(budgetTotal)}</div>
        </div>
        <div className="tile">
          <div className="label">Gastado</div>
          <div className="value" style={{ color: gastadoTotal > budgetTotal && budgetTotal > 0 ? 'var(--rojo)' : undefined }}>
            {fmtB(gastadoTotal)}
          </div>
        </div>
      </div>

      {budgetTotal === 0 && (
        <div className="card" style={{ background: 'var(--lila-soft)', boxShadow: 'none' }}>
          <strong>💡 ¿Cómo funciona?</strong>
          <div className="sub" style={{ marginTop: 4 }}>
            Toca una categoría y decide cuánto quieres gastar como máximo <strong>por quincena</strong>. El
            gato se encarga de recordarte cuando te acerques al límite.
          </div>
        </div>
      )}

      {GASTO_CATS.map((c) => {
        const budget = state.budgets[c.id] ?? 0
        const gastado = gastoPorCat.get(c.id) ?? 0
        const pct = budget > 0 ? (gastado / budget) * 100 : 0
        const isEditing = editing === c.id
        return (
          <div className="card" key={c.id} style={{ padding: '14px 16px' }}>
            <div className="row-between">
              <strong>{c.emoji} {c.name}</strong>
              {isEditing ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <div className="amount-input" style={{ width: 140 }}>
                    <span>B/.</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      autoFocus
                      value={draft}
                      min="0"
                      style={{ padding: '8px 8px 8px 44px', fontSize: 16 }}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && guardar(c.id)}
                    />
                  </div>
                  <button className="btn small verde" onClick={() => guardar(c.id)}>✓</button>
                </div>
              ) : (
                <button
                  className="btn secondary small"
                  onClick={() => { setEditing(c.id); setDraft(budget > 0 ? String(budget) : '') }}
                >
                  {budget > 0 ? fmtB(budget) : 'Definir'}
                </button>
              )}
            </div>
            {budget > 0 && (
              <>
                <div className="meter">
                  <div style={{ width: `${Math.min(100, pct)}%`, background: colorMeter(pct) }} />
                </div>
                <div className="mini" style={{ marginTop: 5 }}>
                  {pct > 100
                    ? `Te pasaste por ${fmtB(gastado - budget)} 🙀`
                    : `${fmtB(gastado)} gastado · queda ${fmtB(budget - gastado)}`}
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
