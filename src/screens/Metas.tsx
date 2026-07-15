import { useState } from 'react'
import { AppState, Goal, Debt } from '../types'
import { fmtB } from '../lib/categories'

const GOAL_EMOJIS = ['✈️', '🏖️', '🚗', '📱', '🏠', '🎓', '💍', '🛟', '🎁', '🐱']

export function Metas({
  state,
  onAddGoal,
  onAbonar,
  onDeleteGoal,
  onAddDebt,
  onPagar,
  onDeleteDebt,
}: {
  state: AppState
  onAddGoal: (g: Omit<Goal, 'id' | 'saved'>) => void
  onAbonar: (id: string, monto: number) => void
  onDeleteGoal: (id: string) => void
  onAddDebt: (d: Omit<Debt, 'id' | 'paid'>) => void
  onPagar: (id: string, monto: number) => void
  onDeleteDebt: (id: string) => void
}) {
  const [vista, setVista] = useState<'metas' | 'deudas'>('metas')
  const [showNew, setShowNew] = useState(false)
  const [abonoId, setAbonoId] = useState<string | null>(null)
  const [monto, setMonto] = useState('')
  const [confirmDel, setConfirmDel] = useState<string | null>(null)

  // formulario nueva meta/deuda
  const [nombre, setNombre] = useState('')
  const [objetivo, setObjetivo] = useState('')
  const [emoji, setEmoji] = useState('✈️')

  const resetForm = () => { setNombre(''); setObjetivo(''); setEmoji('✈️'); setShowNew(false) }

  const crear = () => {
    const target = parseFloat(objetivo)
    if (!nombre.trim() || isNaN(target) || target <= 0) return
    if (vista === 'metas') onAddGoal({ name: nombre.trim(), emoji, target })
    else onAddDebt({ name: nombre.trim(), total: target })
    resetForm()
  }

  const abonar = () => {
    const v = parseFloat(monto)
    if (!abonoId || isNaN(v) || v <= 0) return
    if (vista === 'metas') onAbonar(abonoId, v)
    else onPagar(abonoId, v)
    setAbonoId(null)
    setMonto('')
  }

  const items: { id: string; name: string; emoji: string; done: boolean; cur: number; target: number }[] =
    vista === 'metas'
      ? state.goals.map((g) => ({ id: g.id, name: g.name, emoji: g.emoji, done: g.saved >= g.target, cur: g.saved, target: g.target }))
      : state.debts.map((d) => ({ id: d.id, name: d.name, emoji: '⚔️', done: d.paid >= d.total, cur: d.paid, target: d.total }))

  return (
    <div className="screen">
      <h1>{vista === 'metas' ? 'Metas de ahorro' : 'Deudas'}</h1>
      <div className="sub" style={{ marginBottom: 12 }}>
        {vista === 'metas' ? 'Sueños con fecha de entrega 🌟' : 'Aquí se vienen a morir las deudas ⚔️'}
      </div>

      <div className="seg">
        <button className={vista === 'metas' ? 'on' : ''} onClick={() => { setVista('metas'); setShowNew(false); setAbonoId(null) }}>
          🎯 Metas
        </button>
        <button className={vista === 'deudas' ? 'on' : ''} onClick={() => { setVista('deudas'); setShowNew(false); setAbonoId(null) }}>
          ⚔️ Deudas
        </button>
      </div>

      {items.length === 0 && !showNew && (
        <div className="empty">
          <span className="big">{vista === 'metas' ? '🎯' : '🕊️'}</span>
          {vista === 'metas' ? 'Sin metas todavía. ¿Qué sueño perseguimos?' : '¡Cero deudas anotadas! Que siga así.'}
        </div>
      )}

      {items.map((it) => {
        const pct = it.target > 0 ? Math.min(100, (it.cur / it.target) * 100) : 0
        return (
          <div className="card" key={it.id}>
            <div className="row-between">
              <strong style={{ fontSize: 16 }}>
                {it.emoji} {it.name} {it.done && '✅'}
              </strong>
              {confirmDel === it.id ? (
                <button
                  className="btn small"
                  style={{ background: 'var(--rojo)' }}
                  onClick={() => { vista === 'metas' ? onDeleteGoal(it.id) : onDeleteDebt(it.id); setConfirmDel(null) }}
                >
                  ¿Borrar?
                </button>
              ) : (
                <button className="tx-del" aria-label="Borrar" onClick={() => setConfirmDel(it.id)}>✕</button>
              )}
            </div>
            <div className="meter">
              <div
                style={{
                  width: `${pct}%`,
                  background: it.done ? 'var(--verde)' : vista === 'metas' ? 'var(--lila)' : 'var(--accent)',
                }}
              />
            </div>
            <div className="row-between" style={{ marginTop: 8 }}>
              <span className="mini">
                {fmtB(it.cur)} de {fmtB(it.target)} · {Math.floor(pct)}%
              </span>
              {!it.done &&
                (abonoId === it.id ? (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div className="amount-input" style={{ width: 130 }}>
                      <span>B/.</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        autoFocus
                        value={monto}
                        min="0"
                        style={{ padding: '8px 8px 8px 44px', fontSize: 16 }}
                        onChange={(e) => setMonto(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && abonar()}
                      />
                    </div>
                    <button className="btn small verde" onClick={abonar}>✓</button>
                  </div>
                ) : (
                  <button className="btn secondary small" onClick={() => { setAbonoId(it.id); setMonto('') }}>
                    {vista === 'metas' ? '+ Abonar' : '+ Pagar'}
                  </button>
                ))}
            </div>
            {it.done && (
              <div className="mini" style={{ color: 'var(--verde)', marginTop: 6, fontWeight: 800 }}>
                {vista === 'metas' ? '¡Meta cumplida! El gato está orgulloso. 😻' : '¡Deuda saldada! Libre como gato. 🕊️'}
              </div>
            )}
          </div>
        )
      })}

      {showNew ? (
        <div className="card">
          <h2>{vista === 'metas' ? 'Nueva meta' : 'Nueva deuda'}</h2>
          <div className="field">
            <label>Nombre</label>
            <input
              type="text"
              autoFocus
              placeholder={vista === 'metas' ? 'Ej: Viaje a Bocas del Toro' : 'Ej: Préstamo del carro'}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
          {vista === 'metas' && (
            <div className="field">
              <label>Ícono</label>
              <div className="chips">
                {GOAL_EMOJIS.map((e) => (
                  <button key={e} className={`chip ${emoji === e ? 'on' : ''}`} onClick={() => setEmoji(e)}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="field">
            <label>{vista === 'metas' ? '¿Cuánto necesitas?' : '¿Cuánto debes?'}</label>
            <div className="amount-input">
              <span>B/.</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                min="0"
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn ghost" onClick={resetForm}>Cancelar</button>
            <button className="btn lila" onClick={crear}>Crear</button>
          </div>
        </div>
      ) : (
        <button className="btn" onClick={() => setShowNew(true)}>
          {vista === 'metas' ? '+ Nueva meta' : '+ Anotar deuda'}
        </button>
      )}
    </div>
  )
}
