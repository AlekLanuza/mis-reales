import { useState } from 'react'
import { AppState, Tx, CustomCat } from '../types'
import { gastoCats, INGRESO_CATS, fmtB } from '../lib/categories'
import { todayStr } from '../lib/quincena'

type ModalType = 'gasto' | 'ingreso' | 'ahorro'

export function AddModal({
  state,
  editTx,
  fondoLibre,
  onAdd,
  onUpdate,
  onAhorro,
  onCreateCat,
  onClose,
}: {
  state: AppState
  editTx?: Tx
  fondoLibre: number
  onAdd: (tx: Omit<Tx, 'id' | 'ts'>) => void
  onUpdate: (tx: Tx) => void
  onAhorro: (monto: number, dir: 'deposito' | 'retiro', note: string | undefined, date: string) => void
  onCreateCat: (c: Omit<CustomCat, 'id'>) => string
  onClose: () => void
}) {
  const editEsAhorro = !!editTx && editTx.ref?.kind === 'ahorro'
  const [type, setType] = useState<ModalType>(editEsAhorro ? 'ahorro' : editTx?.type ?? 'gasto')
  const [dir, setDir] = useState<'deposito' | 'retiro'>(editTx?.cat === 'retiro' ? 'retiro' : 'deposito')
  const [amount, setAmount] = useState(editTx ? String(editTx.amount) : '')
  const [cat, setCat] = useState(editTx?.cat ?? '')
  const [note, setNote] = useState(editTx?.note ?? '')
  const [date, setDate] = useState(editTx?.date ?? todayStr())
  const [newCat, setNewCat] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('')

  const cats = type === 'gasto' ? gastoCats(state) : INGRESO_CATS
  const monto = parseFloat(amount)
  const editing = !!editTx
  const esAuto = !!editTx?.ref && editTx.ref.kind !== 'fijo'

  // Al retirar, no puedes sacar más de lo que hay en el fondo libre.
  // Si editas un retiro, el fondo disponible incluye el monto original.
  const maxRetiro = fondoLibre + (editEsAhorro && editTx?.cat === 'retiro' ? editTx.amount : 0)
  const retiroExcede = type === 'ahorro' && dir === 'retiro' && !isNaN(monto) && monto > maxRetiro

  const valid =
    !isNaN(monto) && monto > 0 && date !== '' && !retiroExcede && (type === 'ahorro' || cat !== '')

  const submit = () => {
    if (!valid) return
    const monto2 = Math.round(monto * 100) / 100
    const nota = note.trim() || undefined
    if (type === 'ahorro' && !editing) {
      onAhorro(monto2, dir, nota, date)
      return
    }
    const base = { amount: monto2, note: nota, date }
    if (editTx) onUpdate({ ...editTx, ...base, ...(esAuto ? {} : { type: type as 'gasto' | 'ingreso', cat }) })
    else onAdd({ type: type as 'gasto' | 'ingreso', cat, ...base })
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

  const titulo = editing
    ? 'Editar movimiento'
    : type === 'gasto'
      ? '¿En qué gastaste?'
      : type === 'ingreso'
        ? '¿Cuánto entró?'
        : dir === 'deposito'
          ? '¿Cuánto guardamos?'
          : '¿Cuánto sacamos?'

  return (
    <div className="sheet-back" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="row-between" style={{ marginBottom: 14 }}>
          <h2>{titulo}</h2>
          <button className="btn ghost small" onClick={onClose}>✕</button>
        </div>

        {!esAuto && !editing && (
          <div className="seg">
            <button className={type === 'gasto' ? 'on gasto' : ''} onClick={() => { setType('gasto'); setCat('') }}>
              💸 Gasto
            </button>
            <button className={type === 'ingreso' ? 'on ingreso' : ''} onClick={() => { setType('ingreso'); setCat('') }}>
              🤑 Ingreso
            </button>
            <button className={type === 'ahorro' ? 'on ingreso' : ''} onClick={() => { setType('ahorro'); setCat('') }}>
              🐷 Ahorro
            </button>
          </div>
        )}
        {esAuto && (
          <div className="mini" style={{ marginBottom: 12 }}>
            Este movimiento viene de{' '}
            {editTx!.ref!.kind === 'deuda'
              ? 'un pago de deuda'
              : editTx!.ref!.kind === 'meta'
                ? 'un abono a una meta'
                : editTx!.cat === 'retiro'
                  ? 'un retiro de tu fondo de ahorro'
                  : 'un depósito a tu fondo de ahorro'}
            ; puedes corregir el monto, la nota o la fecha.
          </div>
        )}

        {type === 'ahorro' && !editing && (
          <div className="seg">
            <button className={dir === 'deposito' ? 'on ingreso' : ''} onClick={() => setDir('deposito')}>
              ⬇️ Depositar
            </button>
            <button className={dir === 'retiro' ? 'on gasto' : ''} onClick={() => setDir('retiro')}>
              ⬆️ Retirar
            </button>
          </div>
        )}

        {type === 'ahorro' && !editing && (
          <div className="mini" style={{ marginBottom: 12 }}>
            🐷 Tu fondo libre tiene {fmtB(fondoLibre)}.
            {dir === 'deposito'
              ? ' El depósito descuenta de tu disponible de la quincena.'
              : ' El retiro vuelve a estar disponible para gastar.'}
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
          {retiroExcede && (
            <div className="mini" style={{ color: 'var(--rojo)', fontWeight: 800, marginTop: 6 }}>
              No puedes retirar más de {fmtB(maxRetiro)}. Nube protege la alcancía. 😾
            </div>
          )}
        </div>

        {!esAuto && type !== 'ahorro' && (
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
            placeholder={
              type === 'gasto' ? 'Ej: pizza con los panas' : type === 'ingreso' ? 'Ej: quincena' : 'Ej: para el fondo de emergencia'
            }
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Fecha</label>
          <input type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} />
        </div>

        <button className="btn" disabled={!valid} style={{ opacity: valid ? 1 : 0.4 }} onClick={submit}>
          {editing
            ? 'Guardar cambios ✓'
            : type === 'gasto'
              ? 'Anotar gasto 🐾'
              : type === 'ingreso'
                ? 'Anotar ingreso 🎉'
                : dir === 'deposito'
                  ? 'Depositar al ahorro 🐷'
                  : 'Retirar del ahorro 🫣'}
        </button>
      </div>
    </div>
  )
}
