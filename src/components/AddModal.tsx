import { useState } from 'react'
import { Tx, TxType } from '../types'
import { GASTO_CATS, INGRESO_CATS } from '../lib/categories'
import { todayStr } from '../lib/quincena'

export function AddModal({
  onAdd,
  onClose,
}: {
  onAdd: (tx: Omit<Tx, 'id' | 'ts'>) => void
  onClose: () => void
}) {
  const [type, setType] = useState<TxType>('gasto')
  const [amount, setAmount] = useState('')
  const [cat, setCat] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayStr())

  const cats = type === 'gasto' ? GASTO_CATS : INGRESO_CATS
  const monto = parseFloat(amount)
  const valid = !isNaN(monto) && monto > 0 && cat !== '' && date !== ''

  const submit = () => {
    if (!valid) return
    onAdd({ type, amount: Math.round(monto * 100) / 100, cat, note: note.trim() || undefined, date })
  }

  return (
    <div className="sheet-back" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="row-between" style={{ marginBottom: 14 }}>
          <h2>{type === 'gasto' ? '¿En qué gastaste?' : '¿Cuánto entró?'}</h2>
          <button className="btn ghost small" onClick={onClose}>✕</button>
        </div>

        <div className="seg">
          <button className={type === 'gasto' ? 'on gasto' : ''} onClick={() => { setType('gasto'); setCat('') }}>
            💸 Gasto
          </button>
          <button className={type === 'ingreso' ? 'on ingreso' : ''} onClick={() => { setType('ingreso'); setCat('') }}>
            🤑 Ingreso
          </button>
        </div>

        <div className="field">
          <label>Monto</label>
          <div className="amount-input">
            <span>B/.</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              min="0"
              step="0.01"
              autoFocus
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label>Categoría</label>
          <div className="chips">
            {cats.map((c) => (
              <button
                key={c.id}
                className={`chip ${cat === c.id ? 'on' : ''}`}
                onClick={() => setCat(c.id)}
              >
                {c.emoji} {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Nota (opcional)</label>
          <input
            type="text"
            placeholder={type === 'gasto' ? 'Ej: pizza con los panas' : 'Ej: quincena'}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Fecha</label>
          <input type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} />
        </div>

        <button className="btn" disabled={!valid} style={{ opacity: valid ? 1 : 0.4 }} onClick={submit}>
          {type === 'gasto' ? 'Anotar gasto 🐾' : 'Anotar ingreso 🎉'}
        </button>
      </div>
    </div>
  )
}
