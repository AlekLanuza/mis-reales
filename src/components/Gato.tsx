import { Mood } from '../lib/gamification'

// Gato SVG con expresiones según el estado de las finanzas.
export function Gato({ mood, size = 110 }: { mood: Mood; size?: number }) {
  const cara = CARAS[mood] ?? CARAS.neutral
  return (
    <svg
      className="gato-svg"
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={`Gato ${mood}`}
    >
      {/* cola */}
      <path d="M97 92 Q116 86 110 66" fill="none" stroke="#3A3530" strokeWidth="9" strokeLinecap="round">
        <animate attributeName="d" dur="2.4s" repeatCount="indefinite"
          values="M97 92 Q116 86 110 66; M97 92 Q118 92 112 72; M97 92 Q116 86 110 66" />
      </path>
      {/* cuerpo */}
      <ellipse cx="60" cy="88" rx="38" ry="26" fill="#3A3530" />
      {/* patitas */}
      <ellipse cx="42" cy="110" rx="9" ry="6" fill="#4A443D" />
      <ellipse cx="78" cy="110" rx="9" ry="6" fill="#4A443D" />
      {/* orejas */}
      <path d="M28 34 L34 8 L52 24 Z" fill="#3A3530" />
      <path d="M92 34 L86 8 L68 24 Z" fill="#3A3530" />
      <path d="M33 28 L36 15 L46 24 Z" fill="#FF9F6E" />
      <path d="M87 28 L84 15 L74 24 Z" fill="#FF9F6E" />
      {/* cabeza */}
      <circle cx="60" cy="46" r="34" fill="#3A3530" />
      {/* panza clara */}
      <ellipse cx="60" cy="94" rx="20" ry="15" fill="#F5EDE2" />
      {/* cara según mood */}
      {cara}
      {/* bigotes */}
      <g stroke="#F5EDE2" strokeWidth="2" strokeLinecap="round" opacity="0.9">
        <line x1="22" y1="48" x2="38" y2="50" />
        <line x1="22" y1="56" x2="38" y2="55" />
        <line x1="98" y1="48" x2="82" y2="50" />
        <line x1="98" y1="56" x2="82" y2="55" />
      </g>
    </svg>
  )
}

const ojosFelices = (
  <g stroke="#FFF6EC" strokeWidth="3.5" fill="none" strokeLinecap="round">
    <path d="M42 44 Q47 38 52 44" />
    <path d="M68 44 Q73 38 78 44" />
  </g>
)

const ojosNormales = (
  <g fill="#FFF6EC">
    <circle cx="47" cy="44" r="5" />
    <circle cx="73" cy="44" r="5" />
    <circle cx="48.5" cy="42.5" r="1.8" fill="#3A3530" />
    <circle cx="74.5" cy="42.5" r="1.8" fill="#3A3530" />
  </g>
)

const ojosEntornados = (
  <g fill="#FFF6EC">
    <path d="M41 44 h12 a1 1 0 0 1 0 5 h-12 a1 1 0 0 1 0-5" />
    <path d="M67 44 h12 a1 1 0 0 1 0 5 h-12 a1 1 0 0 1 0-5" />
  </g>
)

const naricita = <path d="M57 53 L63 53 L60 57 Z" fill="#FF9F6E" />

const CARAS: Record<Mood, React.ReactNode> = {
  feliz: (
    <g>
      {ojosFelices}
      {naricita}
      <path d="M52 60 Q56 65 60 61 Q64 65 68 60" stroke="#FFF6EC" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <circle cx="36" cy="54" r="5" fill="#FF9F6E" opacity="0.5" />
      <circle cx="84" cy="54" r="5" fill="#FF9F6E" opacity="0.5" />
    </g>
  ),
  neutral: (
    <g>
      {ojosNormales}
      {naricita}
      <path d="M54 61 Q60 64 66 61" stroke="#FFF6EC" strokeWidth="2.8" fill="none" strokeLinecap="round" />
    </g>
  ),
  preocupado: (
    <g>
      <g fill="#FFF6EC">
        <circle cx="47" cy="45" r="6.5" />
        <circle cx="73" cy="45" r="6.5" />
        <circle cx="47" cy="45" r="2.4" fill="#3A3530" />
        <circle cx="73" cy="45" r="2.4" fill="#3A3530" />
      </g>
      <path d="M40 34 L53 38 M80 34 L67 38" stroke="#FFF6EC" strokeWidth="2.5" strokeLinecap="round" />
      {naricita}
      <path d="M54 63 Q60 59 66 63" stroke="#FFF6EC" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <path d="M83 30 q4 6 0 9 q-4 -3 0 -9" fill="#8FD3FF" />
    </g>
  ),
  juzgando: (
    <g>
      {ojosEntornados}
      <path d="M40 38 L54 41 M80 38 L66 41" stroke="#FFF6EC" strokeWidth="2.5" strokeLinecap="round" />
      {naricita}
      <path d="M53 63 Q60 60 67 63" stroke="#FFF6EC" strokeWidth="2.8" fill="none" strokeLinecap="round" />
    </g>
  ),
  fiesta: (
    <g>
      {ojosFelices}
      {naricita}
      <path d="M50 59 Q60 70 70 59" stroke="#FFF6EC" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M60 62 Q60 67 60 62" fill="#FF9F6E" />
      {/* gorrito de fiesta */}
      <path d="M50 16 L60 -4 L70 16 Z" fill="#7C5CFF" />
      <circle cx="60" cy="-3" r="4" fill="#FFC93D" />
      <circle cx="36" cy="54" r="5" fill="#FF9F6E" opacity="0.5" />
      <circle cx="84" cy="54" r="5" fill="#FF9F6E" opacity="0.5" />
    </g>
  ),
}
