interface GenreCoverProps {
  title: string
  genres: string[]
  id?: string
  className?: string
}

interface GenreConfig {
  bg1: string
  bg2: string
  accent: string
  label: string
}

const GENRE_CONFIG: Record<string, GenreConfig> = {
  fantasy:      { bg1: '#0d0221', bg2: '#2d1060', accent: '#9d4edd', label: 'HUYỀN HUYỄN' },
  martial_arts: { bg1: '#0a1628', bg2: '#1e3a5f', accent: '#e76f51', label: 'KIẾM HIỆP' },
  horror:       { bg1: '#0a0a0a', bg2: '#2a0000', accent: '#cc2222', label: 'KINH DỊ' },
  romance:      { bg1: '#1a0a14', bg2: '#3d1a30', accent: '#e91e8c', label: 'NGÔN TÌNH' },
  adult:        { bg1: '#1a0505', bg2: '#3d0d1a', accent: '#ff6b9d', label: '18+' },
}
const FALLBACK = GENRE_CONFIG.fantasy

function wrapTitle(text: string, maxChars = 14): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w
    if (next.length > maxChars && cur) { lines.push(cur); cur = w }
    else cur = next
  }
  if (cur) lines.push(cur)
  return lines.slice(0, 4)
}

function DecoFantasy({ accent }: { accent: string }) {
  return (
    <>
      <circle cx="150" cy="115" r="65" fill={accent} opacity="0.05" />
      <circle cx="150" cy="115" r="42" fill={accent} opacity="0.08" />
      {/* Outer diamond */}
      <polygon points="150,48 217,115 150,182 83,115" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.4" />
      {/* Inner diamond */}
      <polygon points="150,72 178,115 150,158 122,115" fill="none" stroke={accent} strokeWidth="1" opacity="0.25" />
      {/* Center */}
      <circle cx="150" cy="115" r="5" fill={accent} opacity="0.9" />
      {/* Cardinal dots */}
      <circle cx="150" cy="48" r="2.5" fill={accent} opacity="0.7" />
      <circle cx="217" cy="115" r="2.5" fill={accent} opacity="0.7" />
      <circle cx="150" cy="182" r="2.5" fill={accent} opacity="0.7" />
      <circle cx="83" cy="115" r="2.5" fill={accent} opacity="0.7" />
      {/* Diagonal sparkles */}
      <circle cx="108" cy="73" r="1.5" fill={accent} opacity="0.5" />
      <circle cx="192" cy="73" r="1.5" fill={accent} opacity="0.5" />
      <circle cx="108" cy="157" r="1.5" fill={accent} opacity="0.5" />
      <circle cx="192" cy="157" r="1.5" fill={accent} opacity="0.5" />
    </>
  )
}

function DecoMartialArts({ accent }: { accent: string }) {
  return (
    <>
      <circle cx="150" cy="115" r="60" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.3" />
      <circle cx="150" cy="115" r="38" fill="none" stroke={accent} strokeWidth="1" opacity="0.2" />
      {/* Cross lines */}
      <line x1="150" y1="50" x2="150" y2="180" stroke={accent} strokeWidth="2" opacity="0.5" />
      <line x1="85" y1="115" x2="215" y2="115" stroke={accent} strokeWidth="2" opacity="0.5" />
      {/* Diagonal */}
      <line x1="104" y1="69" x2="196" y2="161" stroke={accent} strokeWidth="1" opacity="0.25" />
      <line x1="196" y1="69" x2="104" y2="161" stroke={accent} strokeWidth="1" opacity="0.25" />
      {/* Center diamond */}
      <polygon points="150,104 161,115 150,126 139,115" fill={accent} opacity="0.7" />
      {/* Cardinal marks */}
      <polygon points="150,52 154,62 146,62" fill={accent} opacity="0.5" />
      <polygon points="150,178 154,168 146,168" fill={accent} opacity="0.5" />
    </>
  )
}

function DecoHorror({ accent, uid }: { accent: string; uid: string }) {
  return (
    <>
      <defs>
        <mask id={`hm-${uid}`}>
          <rect width="300" height="300" fill="white" />
          <circle cx="172" cy="98" r="40" fill="black" />
        </mask>
      </defs>
      {/* Outer glow */}
      <circle cx="150" cy="110" r="60" fill={accent} opacity="0.07" />
      <circle cx="150" cy="110" r="48" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.35" />
      {/* Crescent moon */}
      <circle cx="150" cy="110" r="42" fill={accent} opacity="0.22" mask={`url(#hm-${uid})`} />
      <circle cx="150" cy="110" r="42" fill="none" stroke={accent} strokeWidth="1" opacity="0.4" mask={`url(#hm-${uid})`} />
      {/* Drips */}
      <ellipse cx="134" cy="168" rx="3" ry="6" fill={accent} opacity="0.5" />
      <ellipse cx="150" cy="172" rx="3" ry="8" fill={accent} opacity="0.55" />
      <ellipse cx="166" cy="166" rx="3" ry="5" fill={accent} opacity="0.45" />
      {/* Small dots */}
      <circle cx="90" cy="75" r="2" fill={accent} opacity="0.4" />
      <circle cx="210" cy="80" r="1.5" fill={accent} opacity="0.35" />
      <circle cx="200" cy="155" r="2" fill={accent} opacity="0.4" />
    </>
  )
}

function DecoRomance({ accent }: { accent: string }) {
  const petals: [number, number][] = [
    [150, 78], [178, 94], [178, 130], [150, 146], [122, 130], [122, 94],
  ]
  return (
    <>
      {petals.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="24" fill={accent} opacity="0.09" />
      ))}
      <circle cx="150" cy="112" r="24" fill={accent} opacity="0.12" />
      {petals.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="20" fill="none" stroke={accent} strokeWidth="1" opacity="0.28" />
      ))}
      <circle cx="150" cy="112" r="20" fill="none" stroke={accent} strokeWidth="1" opacity="0.3" />
      <circle cx="150" cy="112" r="7" fill={accent} opacity="0.7" />
      {/* Outer ring */}
      <circle cx="150" cy="112" r="56" fill="none" stroke={accent} strokeWidth="0.5" opacity="0.2" />
    </>
  )
}

function DecoAdult({ accent }: { accent: string }) {
  return (
    <>
      <ellipse cx="150" cy="112" rx="68" ry="52" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.25" />
      <ellipse cx="150" cy="112" rx="48" ry="36" fill={accent} opacity="0.07" />
      <ellipse cx="126" cy="100" rx="32" ry="44" fill="none" stroke={accent} strokeWidth="1" opacity="0.2"
        transform="rotate(-18, 126, 100)" />
      <ellipse cx="174" cy="100" rx="32" ry="44" fill="none" stroke={accent} strokeWidth="1" opacity="0.2"
        transform="rotate(18, 174, 100)" />
      <circle cx="150" cy="112" r="7" fill={accent} opacity="0.65" />
      <circle cx="150" cy="112" r="14" fill="none" stroke={accent} strokeWidth="1" opacity="0.35" />
      <circle cx="150" cy="112" r="22" fill="none" stroke={accent} strokeWidth="0.5" opacity="0.2" />
    </>
  )
}

const DECO_MAP: Record<string, (props: { accent: string; uid: string }) => React.ReactNode> = {
  fantasy:      ({ accent }) => <DecoFantasy accent={accent} />,
  martial_arts: ({ accent }) => <DecoMartialArts accent={accent} />,
  horror:       ({ accent, uid }) => <DecoHorror accent={accent} uid={uid} />,
  romance:      ({ accent }) => <DecoRomance accent={accent} />,
  adult:        ({ accent }) => <DecoAdult accent={accent} />,
}

import React from 'react'

export function GenreCover({ title, genres, id, className = '' }: GenreCoverProps) {
  const genre = genres[0] ?? 'fantasy'
  const cfg = GENRE_CONFIG[genre] ?? FALLBACK
  const uid = (id ?? title).replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 16) || 'default'
  const gradId = `gcg-${uid}`

  const lines = wrapTitle(title)
  const lineHeight = 28
  const titleBlockH = lines.length * lineHeight
  // Title centered between y=200 and y=340
  const titleY = 270 - Math.floor(titleBlockH / 2)

  const decoFn = DECO_MAP[genre] ?? DECO_MAP.fantasy
  const deco = decoFn({ accent: cfg.accent, uid })

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 300 450"
      className={`w-full h-full ${className}`}
      aria-label={title}
      role="img"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor={cfg.bg2} />
          <stop offset="100%" stopColor={cfg.bg1} />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="300" height="450" fill={`url(#${gradId})`} />

      {/* Outer border frame */}
      <rect x="8" y="8" width="284" height="434" rx="3"
        fill="none" stroke={cfg.accent} strokeWidth="0.5" opacity="0.3" />
      <rect x="14" y="14" width="272" height="422" rx="2"
        fill="none" stroke={cfg.accent} strokeWidth="0.5" opacity="0.15" />

      {/* Decoration (top zone ~y 48–182) */}
      {deco}

      {/* Title */}
      {lines.map((line, i) => (
        <text
          key={i}
          x="150"
          y={titleY + i * lineHeight}
          textAnchor="middle"
          fill="white"
          fontSize="19"
          fontWeight="bold"
          fontFamily="'Segoe UI', system-ui, -apple-system, sans-serif"
          letterSpacing="0.3"
        >
          {line}
        </text>
      ))}

      {/* Divider */}
      <line
        x1="70" y1={titleY + titleBlockH + 14}
        x2="230" y2={titleY + titleBlockH + 14}
        stroke={cfg.accent} strokeWidth="1" opacity="0.5"
      />

      {/* Genre label */}
      <text
        x="150"
        y="428"
        textAnchor="middle"
        fill={cfg.accent}
        fontSize="12"
        fontFamily="'Segoe UI', system-ui, -apple-system, sans-serif"
        letterSpacing="2"
        opacity="0.85"
      >
        {cfg.label}
      </text>
    </svg>
  )
}
