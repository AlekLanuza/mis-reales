import { useRef, useState } from 'react'
import { AppState, Profile } from '../types'
import { fmtB0 } from '../lib/categories'
import { streak, levelOf, ACHIEVEMENTS } from '../lib/gamification'
import { exportBackup, importBackup } from '../lib/store'

const AVATARES = ['😎', '🦁', '🐯', '🦊', '🐸', '🐼', '🦄', '👑', '🌟', '⚡']

export function Perfil({
  state,
  onSave,
  onVolver,
  onReplaceState,
  showToast,
}: {
  state: AppState
  onSave: (p: Profile) => void
  onVolver: () => void
  onReplaceState: (s: AppState) => void
  showToast: (msg: string) => void
}) {
  const [nombre, setNombre] = useState(state.profile.name)
  const [avatar, setAvatar] = useState(state.profile.avatar)
  const [avatarLibre, setAvatarLibre] = useState('')
  const [p1, setP1] = useState(String(state.profile.payday1))
  const [p2, setP2] = useState(String(state.profile.payday2))
  const fileRef = useRef<HTMLInputElement>(null)

  const lv = levelOf(state.xp)
  const totalIng = state.txs.filter((t) => t.type === 'ingreso').reduce((a, t) => a + t.amount, 0)
  const totalGas = state.txs.filter((t) => t.type === 'gasto').reduce((a, t) => a + t.amount, 0)

  const guardar = () => {
    const d1 = Math.max(1, Math.min(31, parseInt(p1) || 15))
    const d2 = Math.max(1, Math.min(31, parseInt(p2) || 30))
    const av = [...avatarLibre.trim()].slice(0, 2).join('') || avatar
    onSave({ name: nombre.trim(), avatar: av, payday1: d1, payday2: d2 })
  }

  const descargar = () => {
    const blob = new Blob([exportBackup(state)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mis-reales-respaldo-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('📦 Respaldo descargado')
  }

  const importar = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const s = importBackup(String(reader.result))
      if (s) {
        onReplaceState(s)
        showToast('✅ Respaldo restaurado')
      } else {
        showToast('❌ Ese archivo no parece un respaldo válido')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="screen">
      <div className="header-row">
        <h1>Mi perfil</h1>
        <button className="btn ghost small" onClick={onVolver}>‹ Volver</button>
      </div>

      <div className="card">
        <div className="field">
          <label>Tu nombre</label>
          <input type="text" placeholder="¿Cómo te llama Nube?" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="field">
          <label>Avatar</label>
          <div className="chips" style={{ marginBottom: 8 }}>
            {AVATARES.map((a) => (
              <button key={a} className={`chip ${avatar === a && !avatarLibre ? 'on' : ''}`} onClick={() => { setAvatar(a); setAvatarLibre('') }}>
                {a}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="…o cualquier emoji de tu teclado"
            value={avatarLibre}
            onChange={(e) => setAvatarLibre(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <h2>Tus días de cobro</h2>
        <div className="sub" style={{ marginBottom: 10 }}>
          Definen tus quincenas: cada una va de un día de cobro al día antes del siguiente. Si el mes es más
          corto (como febrero), el día se ajusta solo.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Primer cobro</label>
            <input type="number" inputMode="numeric" min="1" max="31" value={p1} onChange={(e) => setP1(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Segundo cobro</label>
            <input type="number" inputMode="numeric" min="1" max="31" value={p2} onChange={(e) => setP2(e.target.value)} />
          </div>
        </div>
        <div className="mini">Con 15 y 30: quincenas del 15 al 29 y del 30 al 14. 😉</div>
      </div>

      <button className="btn" onClick={guardar}>Guardar perfil ✓</button>

      <div className="tiles" style={{ marginTop: 16 }}>
        <div className="tile">
          <div className="label">⭐ Nivel</div>
          <div className="value" style={{ fontSize: 16 }}>{lv.name}</div>
        </div>
        <div className="tile">
          <div className="label">🏅 Racha récord</div>
          <div className="value" style={{ fontSize: 20 }}>{state.bestStreak} días</div>
        </div>
        <div className="tile">
          <div className="label">📒 Movimientos</div>
          <div className="value" style={{ fontSize: 20 }}>{state.txs.length}</div>
        </div>
        <div className="tile">
          <div className="label">🏆 Logros</div>
          <div className="value" style={{ fontSize: 20 }}>
            {ACHIEVEMENTS.filter((a) => state.unlocked[a.id]).length} / {ACHIEVEMENTS.length}
          </div>
        </div>
        <div className="tile">
          <div className="label">🤑 Total ingresado</div>
          <div className="value" style={{ fontSize: 18, color: 'var(--verde)' }}>{fmtB0(totalIng)}</div>
        </div>
        <div className="tile">
          <div className="label">💸 Total gastado</div>
          <div className="value" style={{ fontSize: 18 }}>{fmtB0(totalGas)}</div>
        </div>
      </div>

      <div className="card">
        <h2>Tus datos</h2>
        <div className="sub" style={{ marginBottom: 12 }}>
          Todo vive solo en este teléfono. Descarga un respaldo de vez en cuando, por si acaso
          (los gatos rompen cosas, los teléfonos también).
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn secondary" onClick={descargar}>📦 Descargar respaldo</button>
          <button className="btn ghost" onClick={() => fileRef.current?.click()}>📥 Restaurar</button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files?.[0] && importar(e.target.files[0])}
        />
      </div>
    </div>
  )
}
