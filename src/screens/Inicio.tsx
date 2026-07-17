import { useMemo, useState } from 'react'
import { AppState } from '../types'
import { currentQuincena, prevQuincena, inQuincena, diasRestantes, quincenaOf, fmtFechaCorta } from '../lib/quincena'
import { allGastoCats, fmtB, fmtB0 } from '../lib/categories'
import { catMood, fraseDelGato, streak, levelOf, nextLevel, avisos, pendingFixed } from '../lib/gamification'
import { fondoLibre, ahorroEnMetas } from '../lib/savings'
import { Gato } from '../components/Gato'

export function Inicio({
  state,
  onVerLogros,
  onVerPerfil,
  onVerAhorro,
  onAgregar,
  onResolveFixed,
}: {
  state: AppState
  onVerLogros: () => void
  onVerPerfil: () => void
  onVerAhorro: () => void
  onAgregar: () => void
  onResolveFixed: (id: string, monthKey: string, action: 'pagado' | 'omitido') => void
}) {
  const q = currentQuincena(state.profile)
  const mood = catMood(state)
  const [frase, setFrase] = useState(() => fraseDelGato(mood, state.profile.name || undefined))

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

  // Patrimonio acumulado y su evolución por quincena (el ahorro sigue siendo tuyo;
  // depósitos y retiros del fondo son transferencias, no cambian el total)
  const { patrimonio, serie } = useMemo(() => {
    const val = (hasta: string) => {
      let v = 0
      for (const t of state.txs) {
        if (t.date > hasta) continue
        if (t.type === 'ingreso') v += t.amount
        else v -= t.amount
        if (t.type === 'gasto' && t.cat === 'ahorro') v += t.amount
        if (t.type === 'ingreso' && t.cat === 'retiro') v -= t.amount
      }
      return v
    }
    const puntos: { label: string; v: number }[] = []
    let cur = q
    for (let i = 0; i < 8; i++) {
      puntos.unshift({ label: fmtFechaCorta(cur.end), v: val(cur.end) })
      cur = prevQuincena(cur, state.profile)
    }
    return { patrimonio: val('9999-12-31'), serie: puntos }
  }, [state.txs, q.key, state.profile])

  const budgetTotal = Object.values(state.budgets).reduce((a, b) => a + b, 0)
  const disponible = budgetTotal - gastado
  const dias = diasRestantes(q)
  const racha = streak(state.txs)
  const lv = levelOf(state.xp)
  const next = nextLevel(state.xp)
  const xpPct = next ? ((state.xp - lv.minXp) / (next.minXp - lv.minXp)) * 100 : 100

  const cats = allGastoCats(state)
  const maxCat = Math.max(1, ...porCat.values())
  const barras = cats.filter((c) => (porCat.get(c.id) ?? 0) > 0).sort(
    (a, b) => (porCat.get(b.id) ?? 0) - (porCat.get(a.id) ?? 0)
  )

  const misAvisos = avisos(state)
  const pendientes = pendingFixed(state)
  const maxFlujo = Math.max(1, ingresado, gastado)

  // sparkline del patrimonio
  const spark = useMemo(() => {
    const w = 280
    const h = 56
    const vals = serie.map((p) => p.v)
    const min = Math.min(0, ...vals)
    const max = Math.max(1, ...vals)
    const x = (i: number) => (i / (serie.length - 1)) * w
    const y = (v: number) => h - ((v - min) / (max - min || 1)) * (h - 6) - 3
    const d = serie.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')
    return { w, h, d, lastX: x(serie.length - 1), lastY: y(vals[vals.length - 1]), zeroY: y(0), showZero: min < 0 }
  }, [serie])

  return (
    <div className="screen">
      <div className="header-row">
        <div>
          <h1>Mis Reales</h1>
          <div className="sub">Quincena del {q.label}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="streak-chip" onClick={onVerLogros}>🔥 {racha}</button>
          <button className="avatar-btn" aria-label="Mi perfil" onClick={onVerPerfil}>
            {state.profile.avatar}
          </button>
        </div>
      </div>

      <div className="gato-wrap">
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          aria-label="Hablar con Nube"
          onClick={() => setFrase(fraseDelGato(mood, state.profile.name || undefined))}
        >
          <Gato mood={mood} />
        </button>
        <div className="bubble">{frase}</div>
      </div>

      {(misAvisos.length > 0 || pendientes.length > 0) && (
        <div className="card" style={{ background: 'var(--lila-soft)', boxShadow: 'none' }}>
          <h2 style={{ fontSize: 15 }}>🔔 Avisos de Nube</h2>
          {pendientes.map((p) => (
            <div className="row-between" key={p.fixed.id} style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>
                📌 ¿Pagaste {p.fixed.name}? ({fmtB(p.fixed.amount)})
              </span>
              <span style={{ display: 'flex', gap: 6 }}>
                <button className="btn small verde" onClick={() => onResolveFixed(p.fixed.id, p.monthKey, 'pagado')}>Sí ✓</button>
                <button className="btn ghost small" onClick={() => onResolveFixed(p.fixed.id, p.monthKey, 'omitido')}>Saltar</button>
              </span>
            </div>
          ))}
          {misAvisos
            .filter((a) => !a.id.startsWith('fijo-'))
            .map((a) => (
              <div key={a.id} style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                {a.emoji} {a.texto}
              </div>
            ))}
        </div>
      )}

      <div className="tiles">
        <div className="tile hero">
          <div className="label">{budgetTotal > 0 ? 'Disponible esta quincena' : 'Gastado esta quincena'}</div>
          <div className="value">{fmtB(budgetTotal > 0 ? disponible : gastado)}</div>
          <div className="sub-line">
            {budgetTotal > 0
              ? disponible >= 0
                ? `Te alcanza ${fmtB(disponible / dias)} por día · quedan ${dias} día${dias === 1 ? '' : 's'}`
                : 'Presupuesto superado… Nube lo vio todo. 😾'
              : 'Define tu presupuesto en la pestaña Plan 🗺️'}
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Balance de la quincena</h2>
        <div className="catbar-row">
          <div className="catbar-emoji">🤑</div>
          <div className="catbar-main">
            <div className="catbar-top"><span>Entradas</span><span className="amt">{fmtB(ingresado)}</span></div>
            <div className="catbar-track"><div style={{ width: `${(ingresado / maxFlujo) * 100}%`, background: 'var(--verde)' }} /></div>
          </div>
        </div>
        <div className="catbar-row">
          <div className="catbar-emoji">💸</div>
          <div className="catbar-main">
            <div className="catbar-top"><span>Salidas</span><span className="amt">{fmtB(gastado)}</span></div>
            <div className="catbar-track"><div style={{ width: `${(gastado / maxFlujo) * 100}%`, background: 'var(--accent)' }} /></div>
          </div>
        </div>
        <div className="row-between" style={{ marginTop: 10, paddingTop: 10, borderTop: '2px solid var(--line)' }}>
          <strong>Balance</strong>
          <strong style={{ color: ingresado - gastado >= 0 ? 'var(--verde)' : 'var(--rojo)' }}>
            {ingresado - gastado >= 0 ? '+' : ''}{fmtB(ingresado - gastado)}
          </strong>
        </div>
      </div>

      <button
        className="card"
        style={{ width: '100%', textAlign: 'left', border: 'none', font: 'inherit', cursor: 'pointer', display: 'block' }}
        aria-label="Ver mi ahorro"
        onClick={onVerAhorro}
      >
        <div className="row-between">
          <h2 style={{ margin: 0 }}>🐷 Tu ahorro</h2>
          <strong style={{ color: 'var(--verde)', fontSize: 17 }}>{fmtB(fondoLibre(state) + ahorroEnMetas(state))}</strong>
        </div>
        <div className="mini" style={{ marginTop: 6 }}>
          Fondo libre: {fmtB(fondoLibre(state))} · En metas: {fmtB(ahorroEnMetas(state))} · toca para ver más ›
        </div>
      </button>

      <div className="card">
        <div className="row-between">
          <h2>Tu dinero acumulado</h2>
          <strong style={{ color: patrimonio >= 0 ? 'var(--verde)' : 'var(--rojo)', fontSize: 17 }}>{fmtB0(patrimonio)}</strong>
        </div>
        <svg width="100%" viewBox={`0 0 ${spark.w} ${spark.h}`} role="img" aria-label="Evolución de tu dinero en las últimas 8 quincenas">
          {spark.showZero && <line x1="0" y1={spark.zeroY} x2={spark.w} y2={spark.zeroY} stroke="var(--line)" strokeWidth="1" strokeDasharray="4 4" />}
          <path d={spark.d} fill="none" stroke="#2a78d6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={spark.lastX} cy={spark.lastY} r="4" fill="#2a78d6" />
        </svg>
        <div className="row-between mini">
          <span>{serie[0]?.label}</span>
          <span>hoy</span>
        </div>
        <div className="mini" style={{ marginTop: 4 }}>
          Ingresos menos gastos desde que empezaste (lo ahorrado en metas sigue siendo tuyo).
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
