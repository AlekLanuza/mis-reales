import { useMemo, useState } from 'react'
import { AppState, CustomCat, FixedExpense } from '../types'
import { gastoCats, fmtB } from '../lib/categories'
import { currentQuincena, inQuincena, diasRestantes } from '../lib/quincena'
import { pendingFixed } from '../lib/gamification'

export function Presupuesto({
  state,
  onSetBudget,
  onCreateCat,
  onDeleteCat,
  onSaveFixed,
  onDeleteFixed,
  onResolveFixed,
}: {
  state: AppState
  onSetBudget: (catId: string, amount: number) => void
  onCreateCat: (c: Omit<CustomCat, 'id'>) => string
  onDeleteCat: (id: string) => void
  onSaveFixed: (f: Omit<FixedExpense, 'id' | 'resolved'> & { id?: string }) => void
  onDeleteFixed: (id: string) => void
  onResolveFixed: (id: string, monthKey: string, action: 'pagado' | 'omitido') => void
}) {
  const q = currentQuincena(state.profile)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [newCat, setNewCat] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('')
  const [confirmDelCat, setConfirmDelCat] = useState<string | null>(null)

  // gastos fijos
  const [showFixedForm, setShowFixedForm] = useState(false)
  const [fxId, setFxId] = useState<string | undefined>(undefined)
  const [fxName, setFxName] = useState('')
  const [fxAmount, setFxAmount] = useState('')
  const [fxDay, setFxDay] = useState('1')
  const [fxCat, setFxCat] = useState('casa')
  const [confirmDelFx, setConfirmDelFx] = useState<string | null>(null)

  const cats = gastoCats(state)
  const pendientes = pendingFixed(state)

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
  const totalFijos = state.fixed.reduce((a, f) => a + f.amount, 0)
  const dias = diasRestantes(q)

  const guardar = (catId: string) => {
    const v = parseFloat(draft)
    onSetBudget(catId, isNaN(v) || v < 0 ? 0 : Math.round(v * 100) / 100)
    setEditing(null)
  }

  const crearCat = () => {
    const name = newName.trim()
    const emoji = [...newEmoji.trim()].slice(0, 2).join('') || '🏷️'
    if (!name) return
    onCreateCat({ name, emoji })
    setNewCat(false)
    setNewName('')
    setNewEmoji('')
  }

  const abrirFixedForm = (f?: FixedExpense) => {
    setFxId(f?.id)
    setFxName(f?.name ?? '')
    setFxAmount(f ? String(f.amount) : '')
    setFxDay(f ? String(f.day) : '1')
    setFxCat(f?.cat ?? 'casa')
    setShowFixedForm(true)
  }

  const guardarFixed = () => {
    const amount = parseFloat(fxAmount)
    const day = Math.max(1, Math.min(31, parseInt(fxDay) || 1))
    if (!fxName.trim() || isNaN(amount) || amount <= 0) return
    onSaveFixed({ id: fxId, name: fxName.trim(), amount: Math.round(amount * 100) / 100, day, cat: fxCat })
    setShowFixedForm(false)
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
          <div className="value" style={{ fontSize: 20 }}>{fmtB(budgetTotal)}</div>
        </div>
        <div className="tile">
          <div className="label">Gastado</div>
          <div className="value" style={{ fontSize: 20, color: gastadoTotal > budgetTotal && budgetTotal > 0 ? 'var(--rojo)' : undefined }}>
            {fmtB(gastadoTotal)}
          </div>
        </div>
      </div>

      {/* ---------- Gastos fijos ---------- */}
      <div className="card">
        <div className="row-between" style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>📌 Gastos fijos del mes</h2>
          <span className="mini">{totalFijos > 0 ? `${fmtB(totalFijos)}/mes` : ''}</span>
        </div>

        {state.fixed.length === 0 && !showFixedForm && (
          <div className="sub" style={{ marginBottom: 10 }}>
            Alquiler, luz, internet… defínelos una vez y Nube te preguntará cada mes si ya los pagaste.
          </div>
        )}

        {state.fixed.map((f) => {
          const pend = pendientes.find((p) => p.fixed.id === f.id)
          const catInfo = cats.find((c) => c.id === f.cat)
          return (
            <div key={f.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
              <div className="row-between">
                <span style={{ fontWeight: 700 }}>
                  {catInfo?.emoji ?? '📌'} {f.name}
                  <span className="mini" style={{ marginLeft: 6 }}>día {f.day}</span>
                </span>
                <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <strong>{fmtB(f.amount)}</strong>
                  <button className="tx-del" aria-label="Editar" onClick={() => abrirFixedForm(f)}>✏️</button>
                  {confirmDelFx === f.id ? (
                    <button className="tx-del" style={{ color: 'var(--rojo)', fontWeight: 800, fontSize: 12 }}
                      onClick={() => { onDeleteFixed(f.id); setConfirmDelFx(null) }}>
                      ¿Borrar?
                    </button>
                  ) : (
                    <button className="tx-del" aria-label="Borrar" onClick={() => setConfirmDelFx(f.id)}>✕</button>
                  )}
                </span>
              </div>
              {pend && (
                <div className="row-between" style={{ marginTop: 6 }}>
                  <span className="mini" style={{ fontWeight: 800, color: 'var(--accent)' }}>¿Ya lo pagaste este mes?</span>
                  <span style={{ display: 'flex', gap: 6 }}>
                    <button className="btn small verde" onClick={() => onResolveFixed(f.id, pend.monthKey, 'pagado')}>Sí ✓</button>
                    <button className="btn ghost small" onClick={() => onResolveFixed(f.id, pend.monthKey, 'omitido')}>Este mes no</button>
                  </span>
                </div>
              )}
            </div>
          )
        })}

        {showFixedForm ? (
          <div style={{ marginTop: 12 }}>
            <div className="field">
              <label>Nombre</label>
              <input type="text" placeholder="Ej: Alquiler" value={fxName} autoFocus onChange={(e) => setFxName(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="field" style={{ flex: 1 }}>
                <label>Monto</label>
                <div className="amount-input">
                  <span>B/.</span>
                  <input type="number" inputMode="decimal" placeholder="0.00" min="0" value={fxAmount} onChange={(e) => setFxAmount(e.target.value)} />
                </div>
              </div>
              <div className="field" style={{ width: 110 }}>
                <label>Día del mes</label>
                <input type="number" inputMode="numeric" min="1" max="31" value={fxDay} onChange={(e) => setFxDay(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label>Categoría</label>
              <div className="chips">
                {cats.map((c) => (
                  <button key={c.id} className={`chip ${fxCat === c.id ? 'on' : ''}`} onClick={() => setFxCat(c.id)}>
                    {c.emoji} {c.name}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn ghost" onClick={() => setShowFixedForm(false)}>Cancelar</button>
              <button className="btn" onClick={guardarFixed}>{fxId ? 'Guardar' : 'Agregar'}</button>
            </div>
          </div>
        ) : (
          <button className="btn secondary" style={{ marginTop: 10 }} onClick={() => abrirFixedForm()}>
            + Agregar gasto fijo
          </button>
        )}
      </div>

      {/* ---------- Presupuestos por categoría ---------- */}
      <h2 style={{ margin: '18px 0 10px' }}>Presupuesto por categoría</h2>
      {budgetTotal === 0 && (
        <div className="card" style={{ background: 'var(--lila-soft)', boxShadow: 'none' }}>
          <strong>💡 ¿Cómo funciona?</strong>
          <div className="sub" style={{ marginTop: 4 }}>
            Toca una categoría y decide cuánto quieres gastar como máximo <strong>por quincena</strong>. Nube
            se encarga de recordarte cuando te acerques al límite.
          </div>
        </div>
      )}

      {cats.map((c) => {
        const budget = state.budgets[c.id] ?? 0
        const gastado = gastoPorCat.get(c.id) ?? 0
        const pct = budget > 0 ? (gastado / budget) * 100 : 0
        const isEditing = editing === c.id
        const esCustom = !c.builtin
        return (
          <div className="card" key={c.id} style={{ padding: '14px 16px' }}>
            <div className="row-between">
              <strong>
                {c.emoji} {c.name}
                {esCustom && (
                  confirmDelCat === c.id ? (
                    <button className="tx-del" style={{ color: 'var(--rojo)', fontWeight: 800, fontSize: 12 }}
                      onClick={() => { onDeleteCat(c.id); setConfirmDelCat(null) }}>
                      ¿Borrar?
                    </button>
                  ) : (
                    <button className="tx-del" aria-label={`Borrar categoría ${c.name}`} onClick={() => setConfirmDelCat(c.id)}>✕</button>
                  )
                )}
              </strong>
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

      {newCat ? (
        <div className="card">
          <h2>Nueva categoría</h2>
          <div className="newcat-row">
            <input
              type="text"
              placeholder="😺"
              aria-label="Emoji"
              value={newEmoji}
              style={{ width: 64, textAlign: 'center' }}
              onChange={(e) => setNewEmoji(e.target.value)}
            />
            <input
              type="text"
              placeholder="Nombre (ej: Mascotas)"
              autoFocus
              value={newName}
              style={{ flex: 1 }}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && crearCat()}
            />
          </div>
          <div className="mini" style={{ margin: '6px 0 10px' }}>Puedes usar cualquier emoji de tu teclado 🐹🎮🍺⚽</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn ghost" onClick={() => setNewCat(false)}>Cancelar</button>
            <button className="btn lila" onClick={crearCat}>Crear</button>
          </div>
        </div>
      ) : (
        <button className="btn" onClick={() => setNewCat(true)}>+ Nueva categoría</button>
      )}
    </div>
  )
}
