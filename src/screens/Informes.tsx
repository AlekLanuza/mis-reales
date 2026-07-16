import { useMemo, useState } from 'react'
import { AppState } from '../types'
import { allGastoCats, fmtB } from '../lib/categories'
import { todayStr, addDays, quincenaOf, MESES, MESES_CORTO, fmtFecha, fmtFechaCorta } from '../lib/quincena'

type PeriodType = 'dia' | 'semana' | 'quincena' | 'mes'

interface Period {
  start: string
  end: string
  label: string
}

const DIAS_SEMANA = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']

function weekdayIndex(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  return (new Date(y, m - 1, d).getDay() + 6) % 7 // 0 = lunes
}

export function Informes({ state }: { state: AppState }) {
  const [tipo, setTipo] = useState<PeriodType>('quincena')
  const [ancla, setAncla] = useState(todayStr()) // fecha dentro del período visible

  const periodOf = (fecha: string, t: PeriodType): Period => {
    if (t === 'dia') return { start: fecha, end: fecha, label: fmtFecha(fecha) }
    if (t === 'semana') {
      const start = addDays(fecha, -weekdayIndex(fecha))
      const end = addDays(start, 6)
      return { start, end, label: `Semana del ${fmtFechaCorta(start)} al ${fmtFechaCorta(end)}` }
    }
    if (t === 'quincena') {
      const q = quincenaOf(fecha, state.profile)
      return { start: q.start, end: q.end, label: `Quincena del ${q.label}` }
    }
    const [y, m] = fecha.split('-').map(Number)
    const last = new Date(y, m, 0).getDate()
    return {
      start: `${y}-${String(m).padStart(2, '0')}-01`,
      end: `${y}-${String(m).padStart(2, '0')}-${String(last).padStart(2, '0')}`,
      label: `${MESES[m - 1].charAt(0).toUpperCase()}${MESES[m - 1].slice(1)} ${y}`,
    }
  }

  const periodo = useMemo(() => periodOf(ancla, tipo), [ancla, tipo, state.profile])
  const anterior = useMemo(() => periodOf(addDays(periodo.start, -1), tipo), [periodo, tipo, state.profile])
  const esActual = todayStr() >= periodo.start && todayStr() <= periodo.end

  const datos = useMemo(() => {
    const en = (p: Period) => state.txs.filter((t) => t.date >= p.start && t.date <= p.end)
    const cur = en(periodo)
    const prev = en(anterior)
    const gasto = cur.filter((t) => t.type === 'gasto').reduce((a, t) => a + t.amount, 0)
    const ingreso = cur.filter((t) => t.type === 'ingreso').reduce((a, t) => a + t.amount, 0)
    const gastoPrev = prev.filter((t) => t.type === 'gasto').reduce((a, t) => a + t.amount, 0)

    const porCat = new Map<string, number>()
    const porDia = new Map<string, number>()
    const porDiaSemana = Array(7).fill(0) as number[]
    for (const t of cur) {
      if (t.type !== 'gasto') continue
      porCat.set(t.cat, (porCat.get(t.cat) ?? 0) + t.amount)
      porDia.set(t.date, (porDia.get(t.date) ?? 0) + t.amount)
      porDiaSemana[weekdayIndex(t.date)] += t.amount
    }
    let topDia: { date: string; v: number } | null = null
    for (const [date, v] of porDia) if (!topDia || v > topDia.v) topDia = { date, v }

    // serie día a día completa del período
    const dias: { date: string; v: number }[] = []
    let d = periodo.start
    while (d <= periodo.end && dias.length < 62) {
      dias.push({ date: d, v: porDia.get(d) ?? 0 })
      d = addDays(d, 1)
    }
    return { gasto, ingreso, gastoPrev, porCat, topDia, dias, porDiaSemana, nMovs: cur.length }
  }, [state.txs, periodo, anterior])

  const cats = allGastoCats(state)
  const maxCat = Math.max(1, ...datos.porCat.values())
  const barras = cats.filter((c) => (datos.porCat.get(c.id) ?? 0) > 0).sort(
    (a, b) => (datos.porCat.get(b.id) ?? 0) - (datos.porCat.get(a.id) ?? 0)
  )

  const cambio = datos.gastoPrev > 0 ? ((datos.gasto - datos.gastoPrev) / datos.gastoPrev) * 100 : null
  const maxDia = Math.max(1, ...datos.dias.map((x) => x.v))
  const maxSemana = Math.max(1, ...datos.porDiaSemana)

  const navegar = (dir: -1 | 1) => {
    setAncla(dir === -1 ? addDays(periodo.start, -1) : addDays(periodo.end, 1))
  }

  return (
    <div className="screen">
      <h1>Informes</h1>
      <div className="sub" style={{ marginBottom: 12 }}>Tus números, sin letra chiquita 🔍</div>

      <div className="seg">
        {(['dia', 'semana', 'quincena', 'mes'] as const).map((t) => (
          <button key={t} className={tipo === t ? 'on' : ''} onClick={() => { setTipo(t); setAncla(todayStr()) }}>
            {t === 'dia' ? 'Día' : t === 'semana' ? 'Semana' : t === 'quincena' ? 'Quincena' : 'Mes'}
          </button>
        ))}
      </div>

      <div className="qnav">
        <button className="btn ghost small" aria-label="Período anterior" onClick={() => navegar(-1)}>‹</button>
        <strong style={{ textAlign: 'center', fontSize: 14.5 }}>{periodo.label}</strong>
        <button
          className="btn ghost small"
          aria-label="Período siguiente"
          disabled={esActual}
          style={{ opacity: esActual ? 0.3 : 1 }}
          onClick={() => navegar(1)}
        >
          ›
        </button>
      </div>

      <div className="tiles" style={{ marginTop: 12 }}>
        <div className="tile">
          <div className="label">💸 Gastado</div>
          <div className="value" style={{ fontSize: 20 }}>{fmtB(datos.gasto)}</div>
        </div>
        <div className="tile">
          <div className="label">🤑 Ingresado</div>
          <div className="value" style={{ fontSize: 20, color: 'var(--verde)' }}>{fmtB(datos.ingreso)}</div>
        </div>
      </div>

      {cambio !== null && (
        <div className="card" style={{ padding: '12px 16px' }}>
          <div className="row-between">
            <span style={{ fontWeight: 700, fontSize: 14 }}>
              vs. {tipo === 'dia' ? 'el día anterior' : tipo === 'semana' ? 'la semana pasada' : tipo === 'quincena' ? 'la quincena pasada' : 'el mes pasado'}
            </span>
            <strong style={{ color: cambio <= 0 ? 'var(--verde)' : 'var(--rojo)' }}>
              {cambio <= 0 ? '▼' : '▲'} {Math.abs(cambio).toFixed(0)}% {cambio <= 0 ? 'menos' : 'más'}
            </strong>
          </div>
          <div className="mini" style={{ marginTop: 2 }}>
            Antes: {fmtB(datos.gastoPrev)} · Ahora: {fmtB(datos.gasto)}
            {cambio <= 0 ? ' · Nube aprueba 😽' : ' · Nube alza una ceja 🤨'}
          </div>
        </div>
      )}

      {tipo !== 'dia' && datos.topDia && (
        <div className="card" style={{ padding: '12px 16px' }}>
          <div className="row-between">
            <span style={{ fontWeight: 700, fontSize: 14 }}>🏆 Día que más gastaste</span>
            <strong>{fmtFecha(datos.topDia.date)} · {fmtB(datos.topDia.v)}</strong>
          </div>
        </div>
      )}

      {tipo !== 'dia' && datos.dias.some((x) => x.v > 0) && (
        <div className="card">
          <h2>Gasto día a día</h2>
          <div className="minibars" style={{ height: 90 }}>
            {datos.dias.map((x) => (
              <div key={x.date} className="minibar-col" title={`${fmtFechaCorta(x.date)}: ${fmtB(x.v)}`}>
                <div
                  className="minibar"
                  style={{
                    height: `${Math.max(x.v > 0 ? 4 : 1, (x.v / maxDia) * 100)}%`,
                    background: x.date === datos.topDia?.date ? 'var(--accent)' : '#86b6ef',
                  }}
                />
              </div>
            ))}
          </div>
          <div className="row-between mini">
            <span>{fmtFechaCorta(periodo.start)}</span>
            <span>{fmtFechaCorta(periodo.end)}</span>
          </div>
        </div>
      )}

      {tipo !== 'dia' && datos.porDiaSemana.some((v) => v > 0) && (
        <div className="card">
          <h2>¿Qué días de la semana gastas más?</h2>
          {DIAS_SEMANA.map((nombre, i) => (
            <div className="catbar-row" key={nombre}>
              <div className="catbar-emoji" style={{ fontSize: 12, fontWeight: 800, color: 'var(--muted)' }}>{nombre}</div>
              <div className="catbar-main">
                <div className="catbar-track">
                  <div style={{ width: `${(datos.porDiaSemana[i] / maxSemana) * 100}%`, background: datos.porDiaSemana[i] === maxSemana ? 'var(--accent)' : '#86b6ef' }} />
                </div>
              </div>
              <div className="mini" style={{ width: 76, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {datos.porDiaSemana[i] > 0 ? fmtB(datos.porDiaSemana[i]) : '—'}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2>Desglose por categoría</h2>
        {barras.length === 0 ? (
          <div className="empty">
            <span className="big">🐱</span>
            Sin gastos en este período.
          </div>
        ) : (
          barras.map((c) => {
            const v = datos.porCat.get(c.id) ?? 0
            return (
              <div className="catbar-row" key={c.id}>
                <div className="catbar-emoji">{c.emoji}</div>
                <div className="catbar-main">
                  <div className="catbar-top">
                    <span>{c.name}</span>
                    <span className="amt">{fmtB(v)} · {((v / Math.max(datos.gasto, 0.01)) * 100).toFixed(0)}%</span>
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

      <div className="mini" style={{ textAlign: 'center' }}>
        {datos.nMovs} movimiento{datos.nMovs === 1 ? '' : 's'} en este período
      </div>
    </div>
  )
}
