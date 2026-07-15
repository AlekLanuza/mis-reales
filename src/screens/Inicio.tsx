import { useMemo, useState } from 'react'
import { AppState } from '../types'
import { currentQuincena, inQuincena, diasRestantes } from '../lib/quincena'
import { GASTO_CATS, fmtB } from '../lib/categories'
import { catMood, fraseDelGato, streak, levelOf, nextLevel } from '../lib/gamification'
import { Gato } from '../components/Gato'

export function Inicio({
  state,
  onVerLogros,
  onAgregar,
}: {
  state: AppState
  onVerLogros: () => void
  onAgregar: () => void
}) {
  const q = currentQuincena()
  const mood = catMood(state)
  const [frase, setFrase] = useState(() => fraseDelGato(mood))

  const { gastado, ingresado, porCat } = useMemo(() => {
    const enQ = state.txs.filter((t) => inQuincena(t.date, q))
    const gastado = enQ.filter((t) => t.type === 'gasto').reduce((a, t) => a + t.amount, 0)
    const ingresado = enQ.filter((t) => t.type === 'ingreso').reduce((a, t) => a + t.amount, 0)
    const porCat = new Map<string, number>()
    for (const t of enQ) {
      if (t.type !== 'gasto') continue
      porCat.set(t.cat, (porCat.get(t.cat) ?? 0) + t.amount)
    }
    return { gastado, ingresado, porCat }
  }, [state.txs, q.key])

  const budgetTotal = Object.values(state.budgets).reduce((a, b) => a + b, 0)
  const disponible = budgetTotal - gastado
  const dias = diasRestantes(q)
  const racha = streak(state.txs)
  const lv = levelOf(state.xp)
  const next = nextLevel(state.xp)
  const xpPct = next ? ((state.xp - lv.minXp) / (next.minXp - lv.minXp)) * 100 : 100

  const maxCat = Math.max(1, ...porCat.values())
  const barras = GASTO_CATS.filter((c) => (porCat.get(c.id) ?? 0) > 0).sort(
    (a, b) => (porCat.get(b.id) ?? 0) - (porCat.get(a.id) ?? 0)
  )

  return (
    <div className="screen">
      <div className="header-row">
        <div>
          <h1>Mis Reales</h1>
          <div className="sub">Quincena del {q.label}</div>
        </div>
        <button className="streak-chip" onClick={onVerLogros}>
          🔥 {racha}
        </button>
      </div>

      <div className="gato-wrap">
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          aria-label="Hablar con el gato"
          onClick={() => setFrase(fraseDelGato(mood))}
        >
          <Gato mood={mood} />
        </button>
        <div className="bubble">{frase}</div>
      </div>

      <div className="tiles">
        <div className="tile hero">
          <div className="label">{budgetTotal > 0 ? 'Disponible esta quincena' : 'Gastado esta quincena'}</div>
          <div className="value">{fmtB(budgetTotal > 0 ? disponible : gastado)}</div>
          <div className="sub-line">
            {budgetTotal > 0
              ? disponible >= 0
                ? `Te alcanza ${fmtB(disponible / dias)} por día · quedan ${dias} día${dias === 1 ? '' : 's'}`
                : 'Presupuesto superado… el gato lo vio todo. 😾'
              : 'Define tu presupuesto en la pestaña Plan 🗺️'}
          </div>
        </div>
        <div className="tile">
          <div className="label">💸 Gastos</div>
          <div className="value">{fmtB(gastado)}</div>
        </div>
        <div className="tile">
          <div className="label">🤑 Ingresos</div>
          <div className="value" style={{ color: 'var(--verde)' }}>{fmtB(ingresado)}</div>
        </div>
      </div>

      <div className="card">
        <div className="row-between">
          <div>
            <div className="mini">Nivel {lv.n}</div>
            <strong>{lv.name} 😼</strong>
          </div>
          <div className="mini">{next ? `${state.xp} / ${next.minXp} XP` : `${state.xp} XP · nivel máximo`}</div>
        </div>
        <div className="xpbar"><div style={{ width: `${Math.min(100, xpPct)}%` }} /></div>
      </div>

      <div className="card">
        <h2>¿En qué se te fue la plata?</h2>
        {barras.length === 0 ? (
          <div className="empty">
            <span className="big">🐱</span>
            Nada anotado esta quincena.
            <br />
            <button className="btn small" style={{ marginTop: 12 }} onClick={onAgregar}>
              Anotar mi primer gasto
            </button>
          </div>
        ) : (
          barras.map((c) => {
            const v = porCat.get(c.id) ?? 0
            return (
              <div className="catbar-row" key={c.id}>
                <div className="catbar-emoji">{c.emoji}</div>
                <div className="catbar-main">
                  <div className="catbar-top">
                    <span>{c.name}</span>
                    <span className="amt">{fmtB(v)}</span>
                  </div>
                  <div className="catbar-track">
                    <div style={{ width: `${(v / maxCat) * 100}%`, background: c.color }} />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
