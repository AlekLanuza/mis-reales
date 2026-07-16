import { useState } from 'react'
import { AppState, Tx, TxType, CustomCat } from '../types'
import { gastoCats, INGRESO_CATS } from '../lib/categories'
import { todayStr } from '../lib/quincena'

export function AddModal({
  state,
  editTx,
  onAdd,
  onUpdate,
  onCreateCat,
  onClose,
}: {
  state: AppState
  editTx?: Tx
  onAdd: (tx: Omit<Tx, 'id' | 'ts'>) => void
  onUpdate: (tx: Tx) => void
  onCreateCat: (c: Omit<CustomCat, 'id'>) => string
  onClose: () => void
}) {
  const [type, setType] = useState<TxType>(editTx?.type ?? 'gasto')
  const [amount, setAmount] = useState(editTx ? String(editTx.amount) : '')
  const [cat, setCat] = useState(editTx?.cat ?? '')
  const [note, setNote] = useState(editTx?.note ?? '')
  const [date, setDate] = useState(editTx?.date ?? todayStr())
  const [newCat, setNewCat] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('')

  const cats = type === 'gasto' ? gastoCats(state) : INGRESO_CATS
  const monto = parseFloat(amount)
  const valid = !isNaN(monto) && monto > 0 && cat !== '' && date !== ''
  const editing = !!editTx
  const esAuto = !!editTx?.ref && editTx.ref.kind !== 'fijo'

  const submit = () => {
    if (!valid) return
    const base = {
      type,
      amount: Math.round(monto * 100) / 100,
      cat,
      note: note.trim() || undefined,
      date,
    }
    if (editTx) onUpdate({ ...editTx, ...base })
    else onAdd(base)
  }

  const crearCat = () => {
    const name = newName.trim()
    const emoji = [...newEmoji.trim()].slice(0, 2).join('') || '🏷️'
    if (!name) return
    const id = onCreateCat({ name, emoji })
    setCat(id)
    setNewCat(false)
    setNewName('')
    setNewEmoji('')
  }

  return (
    <div className="sheet-back" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="row-between" style={{ marginBottom: 14 }}>
          <h2>{editing ? 'Editar movimiento' : type === 'gasto' ? '¿En qué gastaste?' : '¿Cuánto entró?'}</h2>
          <button className="btn ghost small" onClick={onClose}>✕</button>
        </div>

        {!esAuto && (
          <div className="seg">
            <button className={type === 'gasto' ? 'on gasto' : ''} onClick={() => { setType('gasto'); if (!editing) setCat('') }}>
              💸 Gasto
            </button>
            <button className={type === 'ingreso' ? 'on ingreso' : ''} onClick={() => { setType('ingreso'); if (!editing) setCat('') }}>
              🤑 Ingreso
            </button>
          </div>
        )}
        {esAuto && (
          <div className="mini" style={{ marginBottom: 12 }}>
            Este movimiento viene de {editTx!.ref!.kind === 'deuda' ? 'un pago de deuda' : 'un abono a una meta'}; puedes
            corregir el monto, la nota o la fecha.
          </div>
        )}

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
              autoFocus={!editing}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        {!esAuto && (
          <div className="field">
            <label>Categoría</label>
            <div className="chips">
              {cats.map((c) => (
                <button key={c.id} className={`chip ${cat === c.id ? 'on' : ''}`} onClick={() => setCat(c.id)}>
                  {c.emoji} {c.name}
                </button>
              ))}
              {type === 'gasto' && (
                <button className={`chip ${newCat ? 'on' : ''}`} onClick={() => setNewCat(!newCat)}>
                  ＋ Nueva
                </button>
              )}
            </div>
            {newCat && (
              <div className="newcat-row">
                <input
                  type="text"
                  placeholder="😺"
                  aria-label="Emoji de la categoría"
                  value={newEmoji}
                  style={{ width: 64, textAlign: 'center' }}
                  onChange={(e) => setNewEmoji(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Nombre (ej: Mascotas)"
                  value={newName}
                  style={{ flex: 1 }}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && crearCat()}
                />
                <button className="btn small verde" onClick={crearCat}>✓</button>
              </div>
            )}
          </div>
        )}

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
          {editing ? 'Guardar cambios ✓' : type === 'gasto' ? 'Anotar gasto 🐾' : 'Anotar ingreso 🎉'}
        </button>
      </div>
    </div>
  )
}
