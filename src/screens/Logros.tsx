import { AppState } from '../types'
import { ACHIEVEMENTS, LEVELS, levelOf, streak } from '../lib/gamification'

export function Logros({ state, onVolver }: { state: AppState; onVolver: () => void }) {
  const lv = levelOf(state.xp)
  const racha = streak(state.txs)
  const desbloqueados = ACHIEVEMENTS.filter((a) => state.unlocked[a.id])
  const bloqueados = ACHIEVEMENTS.filter((a) => !state.unlocked[a.id])

  return (
    <div className="screen">
      <div className="header-row">
        <h1>Logros</h1>
        <button className="btn ghost small" onClick={onVolver}>‹ Volver</button>
      </div>
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
      <div className="logros-grid">
        {bloqueados.map((a) => (
          <div className="logro locked" key={a.id}>
            <div className="em">{a.emoji}</div>
            <div className="nm">{a.name}</div>
            <div className="ds">{a.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
