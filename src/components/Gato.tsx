import { Mood } from '../lib/gamification'

// Nube: gata rusa azul de ojos verde claro, con expresiones según las finanzas.
const PELAJE = '#8494A9'
const PELAJE_OSCURO = '#6E7C90'
const PANZA = '#AEBACB'
const ROSA = '#C9B2BC'
const OJO_VERDE = '#7BE8B8'
const PUPILA = '#1E2A30'
const LINEA = '#E8EDF3'

export function Gato({ mood, size = 110 }: { mood: Mood; size?: number }) {
  const cara = CARAS[mood] ?? CARAS.neutral
  return (
    <svg
      className="gato-svg"
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={`Nube ${mood}`}
    >
      {/* cola */}
      <path d="M97 92 Q116 84 108 64" fill="none" stroke={PELAJE_OSCURO} strokeWidth="10" strokeLinecap="round">
        <animate attributeName="d" dur="2.4s" repeatCount="indefinite"
          values="M97 92 Q116 84 108 64; M97 92 Q118 90 110 70; M97 92 Q116 84 108 64" />
      </path>
      {/* cuerpo */}
      <ellipse cx="60" cy="90" rx="37" ry="24" fill={PELAJE} />
      <ellipse cx="60" cy="96" rx="18" ry="13" fill={PANZA} />
      {/* patitas */}
      <ellipse cx="42" cy="110" rx="9" ry="6" fill={PELAJE_OSCURO} />
      <ellipse cx="78" cy="110" rx="9" ry="6" fill={PELAJE_OSCURO} />
      {/* orejas */}
      <path d="M26 36 L32 10 L52 26 Z" fill={PELAJE} />
      <path d="M94 36 L88 10 L68 26 Z" fill={PELAJE} />
      <path d="M31 30 L35 17 L45 25 Z" fill={ROSA} />
      <path d="M89 30 L85 17 L75 25 Z" fill={ROSA} />
      {/* cabeza */}
      <circle cx="60" cy="48" r="35" fill={PELAJE} />
      {/* cara según mood */}
      {cara}
      {/* bigotes */}
      <g stroke={LINEA} strokeWidth="1.8" strokeLinecap="round" opacity="0.9">
        <line x1="21" y1="52" x2="36" y2="54" />
        <line x1="21" y1="60" x2="36" y2="59" />
        <line x1="99" y1="52" x2="84" y2="54" />
        <line x1="99" y1="60" x2="84" y2="59" />
      </g>
    </svg>
  )
}

// Ojos grandes y amigables de verde claro
const ojosAbiertos = (
  <g>
    <ellipse cx="46" cy="47" rx="8.5" ry="9.5" fill={OJO_VERDE} />
    <ellipse cx="74" cy="47" rx="8.5" ry="9.5" fill={OJO_VERDE} />
    <circle cx="46" cy="48.5" r="5.2" fill={PUPILA} />
    <circle cx="74" cy="48.5" r="5.2" fill={PUPILA} />
    <circle cx="48" cy="46" r="2" fill="#FFFFFF" />
    <circle cx="76" cy="46" r="2" fill="#FFFFFF" />
    <circle cx="44.5" cy="51" r="1" fill="#FFFFFF" opacity="0.8" />
    <circle cx="72.5" cy="51" r="1" fill="#FFFFFF" opacity="0.8" />
  </g>
)

const ojosFelices = (
  <g stroke={OJO_VERDE} strokeWidth="4" fill="none" strokeLinecap="round">
    <path d="M39 47 Q46 39 53 47" />
    <path d="M67 47 Q74 39 81 47" />
  </g>
)

const ojosEntornados = (
  <g>
    <path d="M38 45 h16 a1 1 0 0 1 0 7 h-16 a1 1 0 0 1 0-7" fill={OJO_VERDE} />
    <path d="M66 45 h16 a1 1 0 0 1 0 7 h-16 a1 1 0 0 1 0-7" fill={OJO_VERDE} />
    <circle cx="47" cy="48.5" r="3" fill={PUPILA} />
    <circle cx="75" cy="48.5" r="3" fill={PUPILA} />
  </g>
)

const naricita = <path d="M57 59 L63 59 L60 63 Z" fill={ROSA} />
const cachetes = (
  <g fill={ROSA} opacity="0.55">
    <circle cx="35" cy="58" r="5.5" />
    <circle cx="85" cy="58" r="5.5" />
  </g>
)

const CARAS: Record<Mood, React.ReactNode> = {
  feliz: (
    <g>
      {ojosFelices}
      {naricita}
      <path d="M52 66 Q56 70 60 66 Q64 70 68 66" stroke={LINEA} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      {cachetes}
    </g>
  ),
  neutral: (
    <g>
      {ojosAbiertos}
      {naricita}
      <path d="M52 66 Q56 70 60 66 Q64 70 68 66" stroke={LINEA} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      {cachetes}
    </g>
  ),
  preocupado: (
    <g>
      <ellipse cx="46" cy="47" rx="9" ry="10" fill={OJO_VERDE} />
      <ellipse cx="74" cy="47" rx="9" ry="10" fill={OJO_VERDE} />
      <circle cx="46" cy="47" r="3.6" fill={PUPILA} />
      <circle cx="74" cy="47" r="3.6" fill={PUPILA} />
      <path d="M38 35 L52 39 M82 35 L68 39" stroke={PELAJE_OSCURO} strokeWidth="2.5" strokeLinecap="round" />
      {naricita}
      <path d="M54 68 Q60 64 66 68" stroke={LINEA} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M84 32 q4 6 0 9 q-4 -3 0 -9" fill="#8FD3FF" />
    </g>
  ),
  juzgando: (
    <g>
      {ojosEntornados}
      <path d="M38 40 L54 43 M82 40 L66 43" stroke={PELAJE_OSCURO} strokeWidth="2.5" strokeLinecap="round" />
      {naricita}
      <path d="M53 67 Q60 64 67 67" stroke={LINEA} strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </g>
  ),
  fiesta: (
    <g>
      {ojosFelices}
      {naricita}
      <path d="M50 65 Q60 76 70 65" stroke={LINEA} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M50 16 L60 -4 L70 16 Z" fill="#1D9E75" />
      <circle cx="60" cy="-3" r="4" fill="#FFC93D" />
      {cachetes}
    </g>
  ),
}
