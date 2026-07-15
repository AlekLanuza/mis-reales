import { useRef } from 'react'
import { AppState } from '../types'
import { ACHIEVEMENTS, LEVELS, levelOf, streak } from '../lib/gamification'
import { exportBackup, importBackup } from '../lib/store'

export function Logros({
  state,
  onReplaceState,
  showToast,
}: {
  state: AppState
  onReplaceState: (s: AppState) => void
  showToast: (msg: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const lv = levelOf(state.xp)
  const racha = streak(state.txs)
  const desbloqueados = ACHIEVEMENTS.filter((a) => state.unlocked[a.id])
  const bloqueados = ACHIEVEMENTS.filter((a) => !state.unlocked[a.id])

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
      <h1>Logros</h1>
      <div className="sub" style={{ marginBottom: 12 }}>Tu vitrina de trofeos 🏆</div>

      <div className="tiles">
        <div className="tile">
          <div className="label">🔥 Racha actual</div>
          <div className="value">{racha} día{racha === 1 ? '' : 's'}</div>
        </div>
        <div className="tile">
          <div className="label">🏅 Racha récord</div>
          <div className="value">{state.bestStreak} día{state.bestStreak === 1 ? '' : 's'}</div>
        </div>
        <div className="tile">
          <div className="label">⭐ Nivel {lv.n} de {LEVELS.length}</div>
          <div className="value" style={{ fontSize: 18 }}>{lv.name}</div>
        </div>
        <div className="tile">
          <div className="label">🏆 Logros</div>
          <div className="value">{desbloqueados.length} / {ACHIEVEMENTS.length}</div>
        </div>
      </div>

      {desbloqueados.length > 0 && (
        <>
          <h2 style={{ marginTop: 8 }}>Desbloqueados</h2>
          <div className="logros-grid" style={{ marginBottom: 16 }}>
            {desbloqueados.map((a) => (
              <div className="logro" key={a.id}>
                <div className="em">{a.emoji}</div>
                <div className="nm">{a.name}</div>
                <div className="ds">{a.desc}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <h2>Por desbloquear</h2>
      <div className="logros-grid" style={{ marginBottom: 20 }}>
        {bloqueados.map((a) => (
          <div className="logro locked" key={a.id}>
            <div className="em">{a.emoji}</div>
            <div className="nm">{a.name}</div>
            <div className="ds">{a.desc}</div>
          </div>
        ))}
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
