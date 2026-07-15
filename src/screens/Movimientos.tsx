import { useMemo, useState } from 'react'
import { AppState, Tx } from '../types'
import { catById, fmtB } from '../lib/categories'
import { fmtFecha } from '../lib/quincena'

export function Movimientos({
  state,
  onDelete,
  onAgregar,
}: {
  state: AppState
  onDelete: (id: string) => void
  onAgregar: () => void
}) {
  const [filtro, setFiltro] = useState<'todos' | 'gasto' | 'ingreso'>('todos')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const grupos = useMemo(() => {
    const txs = state.txs
      .filter((t) => filtro === 'todos' || t.type === filtro)
      .slice()
      .sort((a, b) => (a.date === b.date ? b.ts - a.ts : a.date < b.date ? 1 : -1))
    const g = new Map<string, Tx[]>()
    for (const t of txs) {
      if (!g.has(t.date)) g.set(t.date, [])
      g.get(t.date)!.push(t)
    }
    return [...g.entries()]
  }, [state.txs, filtro])

  return (
    <div className="screen">
      <h1>Movimientos</h1>
      <div className="sub" style={{ marginBottom: 12 }}>
        {state.txs.length} anotado{state.txs.length === 1 ? '' : 's'} en total
      </div>

      <div className="seg">
        {(['todos', 'gasto', 'ingreso'] as const).map((f) => (
          <button key={f} className={filtro === f ? 'on' : ''} onClick={() => setFiltro(f)}>
            {f === 'todos' ? 'Todos' : f === 'gasto' ? '💸 Gastos' : '🤑 Ingresos'}
          </button>
        ))}
      </div>

      {grupos.length === 0 && (
        <div className="empty">
          <span className="big">📭</span>
          Nada por aquí todavía.
          <br />
          <button className="btn small" style={{ marginTop: 12 }} onClick={onAgregar}>
            Anotar algo
          </button>
        </div>
      )}

      {grupos.map(([date, txs]) => (
        <div key={date}>
          <div className="tx-day">{fmtFecha(date)}</div>
          {txs.map((t) => {
            const c = catById(t.cat)
            return (
              <div className="tx" key={t.id}>
                <div className="cat-dot" style={{ background: `${c.color}22` }}>{c.emoji}</div>
                <div className="tx-info">
                  <div className="tx-name">{c.name}</div>
                  {t.note && <div className="tx-note">{t.note}</div>}
                </div>
                <div className={`tx-amt ${t.type === 'ingreso' ? 'in' : ''}`}>
                  {t.type === 'ingreso' ? '+' : '−'}{fmtB(t.amount)}
                </div>
                {confirmId === t.id ? (
                  <button
                    className="tx-del"
                    style={{ color: 'var(--rojo)', fontWeight: 800, fontSize: 13 }}
                    onClick={() => { onDelete(t.id); setConfirmId(null) }}
                  >
                    ¿Borrar?
                  </button>
                ) : (
                  <button className="tx-del" aria-label="Borrar" onClick={() => setConfirmId(t.id)}>
                    ✕
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
