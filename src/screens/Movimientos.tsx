import { useMemo, useState } from 'react'
import { AppState, Tx } from '../types'
import { catById, fmtB } from '../lib/categories'
import { fmtFecha, currentQuincena, prevQuincena, nextQuincena, inQuincena, Quincena } from '../lib/quincena'

export function Movimientos({
  state,
  onDelete,
  onEdit,
  onAgregar,
}: {
  state: AppState
  onDelete: (id: string) => void
  onEdit: (tx: Tx) => void
  onAgregar: () => void
}) {
  const [filtro, setFiltro] = useState<'todos' | 'gasto' | 'ingreso'>('todos')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const hoy = useMemo(() => currentQuincena(state.profile), [state.profile])
  const [q, setQ] = useState<Quincena>(hoy)

  const esActual = q.key === hoy.key

  const { grupos, totGasto, totIngreso } = useMemo(() => {
    const enQ = state.txs.filter((t) => inQuincena(t.date, q))
    const totGasto = enQ.filter((t) => t.type === 'gasto').reduce((a, t) => a + t.amount, 0)
    const totIngreso = enQ.filter((t) => t.type === 'ingreso').reduce((a, t) => a + t.amount, 0)
    const txs = enQ
      .filter((t) => filtro === 'todos' || t.type === filtro)
      .slice()
      .sort((a, b) => (a.date === b.date ? b.ts - a.ts : a.date < b.date ? 1 : -1))
    const g = new Map<string, Tx[]>()
    for (const t of txs) {
      if (!g.has(t.date)) g.set(t.date, [])
      g.get(t.date)!.push(t)
    }
    return { grupos: [...g.entries()], totGasto, totIngreso }
  }, [state.txs, filtro, q])

  return (
    <div className="screen">
      <h1>Movimientos</h1>

      <div className="qnav">
        <button className="btn ghost small" aria-label="Quincena anterior" onClick={() => setQ(prevQuincena(q, state.profile))}>
          ‹
        </button>
        <div style={{ textAlign: 'center' }}>
          <strong>{esActual ? 'Esta quincena' : `Quincena`}</strong>
          <div className="mini">{q.label}</div>
        </div>
        <button
          className="btn ghost small"
          aria-label="Quincena siguiente"
          disabled={esActual}
          style={{ opacity: esActual ? 0.3 : 1 }}
          onClick={() => setQ(nextQuincena(q, state.profile))}
        >
          ›
        </button>
      </div>

      <div className="tiles" style={{ marginTop: 12 }}>
        <div className="tile">
          <div className="label">🤑 Entró</div>
          <div className="value" style={{ fontSize: 19, color: 'var(--verde)' }}>{fmtB(totIngreso)}</div>
        </div>
        <div className="tile">
          <div className="label">💸 Salió</div>
          <div className="value" style={{ fontSize: 19 }}>{fmtB(totGasto)}</div>
        </div>
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
          Nada anotado en esta quincena.
          {esActual && (
            <>
              <br />
              <button className="btn small" style={{ marginTop: 12 }} onClick={onAgregar}>
                Anotar algo
              </button>
            </>
          )}
        </div>
      )}

      {grupos.map(([date, txs]) => (
        <div key={date}>
          <div className="tx-day">{fmtFecha(date)}</div>
          {txs.map((t) => {
            const c = catById(state, t.cat)
            return (
              <div className="tx" key={t.id} role="button" tabIndex={0} onClick={() => onEdit(t)}>
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
                    onClick={(e) => { e.stopPropagation(); onDelete(t.id); setConfirmId(null) }}
                  >
                    ¿Borrar?
                  </button>
                ) : (
                  <button className="tx-del" aria-label="Borrar" onClick={(e) => { e.stopPropagation(); setConfirmId(t.id) }}>
                    ✕
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ))}

      <div className="mini" style={{ textAlign: 'center', marginTop: 12 }}>
        Toca un movimiento para editarlo ✏️
      </div>
    </div>
  )
}
