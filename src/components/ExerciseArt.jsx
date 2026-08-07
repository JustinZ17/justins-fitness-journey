/**
 * Line drawings for the exercise guides.
 *
 * Hand-drawn SVG rather than photographs: real gym photos are copyrighted and
 * this repo is public, and generated images would be guesses dressed up as
 * fact. A clean outline is honest about being a diagram, weighs nothing, works
 * offline, and recolours itself per theme.
 *
 * Equipment is drawn in the muted ink, the body in full ink, and the direction
 * of the rep in the accent colour — so the thing you're looking for and the
 * thing you're doing read differently at a glance.
 */

const V = '0 0 120 92'

// Equipment reads in the mid-tone rather than the faintest ink: half the point
// of these drawings is recognising the machine across the gym floor.
const eq = { stroke: 'var(--ink-muted)', strokeWidth: 2.5, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }
const body = { stroke: 'var(--ink)', strokeWidth: 3, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }
const move = { stroke: 'var(--accent)', strokeWidth: 2.5, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }
const head = { fill: 'var(--ink)' }

/** Arrow showing which way the rep travels. */
const Arrow = ({ d, id }) => (
  <>
    <defs>
      <marker id={id} markerWidth="5" markerHeight="5" refX="3.4" refY="2.5" orient="auto">
        <path d="M0,0 L5,2.5 L0,5 z" fill="var(--accent)" />
      </marker>
    </defs>
    <path d={d} {...move} strokeDasharray="5 4" markerEnd={`url(#${id})`} />
  </>
)

const Floor = () => <path d="M8 84h104" {...eq} />

const art = {
  legPress: (
    <>
      <Floor />
      {/* angled sled rail and footplate */}
      <path d="M30 78 L96 30" {...eq} />
      <path d="M84 18 L104 32" {...eq} strokeWidth="5" />
      {/* reclined seat */}
      <path d="M16 78 L34 62" {...eq} strokeWidth="5" />
      {/* lifter */}
      <circle cx="24" cy="60" r="5" {...head} />
      <path d="M28 64 L48 72 L70 50" {...body} />
      <path d="M48 72 L66 56" {...body} />
      <Arrow id="a-legpress" d="M74 62 L92 48" />
    </>
  ),

  seatedRow: (
    <>
      <Floor />
      {/* weight stack */}
      <rect x="12" y="20" width="20" height="58" {...eq} />
      <path d="M14 30h16M14 38h16M14 46h16" {...eq} strokeWidth="1.8" />
      {/* high cable to handle */}
      <path d="M22 24 L74 40" {...eq} />
      <path d="M74 36v8" {...eq} strokeWidth="5" />
      {/* seat + chest pad */}
      <path d="M78 68h22M88 68v10" {...eq} />
      {/* lifter, seated, pulling */}
      <circle cx="86" cy="34" r="5" {...head} />
      <path d="M86 39 L86 60 L100 66" {...body} />
      <path d="M86 44 L74 40" {...body} />
      <Arrow id="a-row" d="M66 52 L84 56" />
    </>
  ),

  chestPress: (
    <>
      <Floor />
      {/* frame + seat back */}
      <rect x="14" y="22" width="16" height="56" {...eq} />
      <path d="M60 76 L60 46" {...eq} strokeWidth="5" />
      {/* handles */}
      <path d="M40 44v10" {...eq} strokeWidth="5" />
      <path d="M30 40 L40 46" {...eq} />
      {/* lifter facing left, pressing */}
      <circle cx="66" cy="38" r="5" {...head} />
      <path d="M64 43 L62 66 L78 74" {...body} />
      <path d="M63 50 L42 48" {...body} />
      <Arrow id="a-chest" d="M34 62 L20 62" />
    </>
  ),

  benchPress: (
    <>
      <Floor />
      <path d="M26 62h60" {...eq} strokeWidth="5" />
      <path d="M34 64v14M78 64v14" {...eq} />
      {/* lying lifter */}
      <circle cx="32" cy="55" r="5" {...head} />
      <path d="M38 58 L74 58 L86 74" {...body} />
      <path d="M48 57 L48 40" {...body} />
      {/* dumbbells */}
      <path d="M40 38h16M40 34v8M56 34v8" {...eq} />
      <Arrow id="a-bench" d="M64 44 L64 28" />
    </>
  ),

  shoulderPress: (
    <>
      <Floor />
      <path d="M46 78 L46 44" {...eq} strokeWidth="5" />
      <path d="M46 74h22" {...eq} strokeWidth="5" />
      <circle cx="54" cy="36" r="5" {...head} />
      <path d="M54 41 L54 62 L70 70" {...body} />
      <path d="M54 46 L44 30" {...body} />
      <path d="M54 46 L66 30" {...body} />
      <path d="M36 26h18M36 22v8M54 22v8" {...eq} />
      <path d="M62 26h18M62 22v8M80 22v8" {...eq} />
      <Arrow id="a-shoulder" d="M92 34 L92 16" />
    </>
  ),

  pushdown: (
    <>
      <Floor />
      <rect x="16" y="14" width="20" height="64" {...eq} />
      <path d="M18 24h16M18 32h16M18 40h16" {...eq} strokeWidth="1.8" />
      <circle cx="26" cy="12" r="4" {...eq} />
      <path d="M30 12 L62 12 L62 40" {...eq} />
      <path d="M52 40h20" {...eq} strokeWidth="5" />
      <circle cx="70" cy="26" r="5" {...head} />
      <path d="M70 31 L70 58 L70 80" {...body} />
      <path d="M70 38 L62 40" {...body} />
      <Arrow id="a-pushdown" d="M84 42 L84 62" />
    </>
  ),

  overheadExtension: (
    <>
      <Floor />
      <circle cx="58" cy="34" r="5" {...head} />
      <path d="M58 39 L58 62 L58 80" {...body} />
      <path d="M58 44 L48 26 L62 20" {...body} />
      <path d="M56 16h16M56 12v8M72 12v8" {...eq} />
      <Arrow id="a-ohe" d="M78 24 Q84 34 74 40" />
    </>
  ),

  lateralRaise: (
    <>
      <Floor />
      <circle cx="60" cy="26" r="5" {...head} />
      <path d="M60 31 L60 58 L52 80M60 58 L68 80" {...body} />
      <path d="M60 38 L36 44" {...body} />
      <path d="M60 38 L84 44" {...body} />
      <path d="M28 44h14M28 40v8M42 40v8" {...eq} />
      <path d="M78 44h14M78 40v8M92 40v8" {...eq} />
      <Arrow id="a-lat-l" d="M30 34 L30 22" />
      <Arrow id="a-lat-r" d="M90 34 L90 22" />
    </>
  ),

  bicepCurl: (
    <>
      <Floor />
      <circle cx="58" cy="24" r="5" {...head} />
      <path d="M58 29 L58 58 L50 80M58 58 L66 80" {...body} />
      <path d="M58 34 L58 48 L74 42" {...body} />
      <path d="M70 42h14M70 38v8M84 38v8" {...eq} />
      <Arrow id="a-curl" d="M88 52 Q94 40 84 34" />
    </>
  ),

  dumbbellRow: (
    <>
      <Floor />
      <path d="M30 58h48" {...eq} strokeWidth="5" />
      <path d="M38 60v18M70 60v18" {...eq} />
      <circle cx="88" cy="42" r="5" {...head} />
      <path d="M84 45 L52 52" {...body} />
      <path d="M60 52 L58 76" {...body} />
      <path d="M76 47 L76 62" {...body} />
      <path d="M68 62h16M68 58v8M84 58v8" {...eq} />
      <Arrow id="a-dbrow" d="M92 66 L92 52" />
    </>
  ),

  pullover: (
    <>
      <Floor />
      <path d="M30 62h56" {...eq} strokeWidth="5" />
      <path d="M38 64v14M78 64v14" {...eq} />
      <circle cx="36" cy="55" r="5" {...head} />
      <path d="M42 58 L74 58 L86 74" {...body} />
      <path d="M48 57 L36 38" {...body} />
      <path d="M28 34h16M28 30v8M44 30v8" {...eq} />
      <Arrow id="a-pullover" d="M56 30 Q44 20 30 26" />
    </>
  ),

  rearDeltFly: (
    <>
      <Floor />
      {/* hinged forward at the hips — otherwise it reads as a lateral raise */}
      <circle cx="60" cy="38" r="5" {...head} />
      <path d="M60 43 L66 56 L66 80" {...body} />
      <path d="M61 48 L38 60" {...body} />
      <path d="M61 48 L84 60" {...body} />
      <path d="M30 60h14M30 56v8M44 56v8" {...eq} />
      <path d="M78 60h14M78 56v8M92 56v8" {...eq} />
      <Arrow id="a-rdf-l" d="M30 50 L30 38" />
      <Arrow id="a-rdf-r" d="M92 50 L92 38" />
    </>
  ),

  gobletSquat: (
    <>
      <Floor />
      <circle cx="58" cy="24" r="5" {...head} />
      <path d="M58 29 L58 50 L44 62 L44 80" {...body} />
      <path d="M58 50 L72 62 L72 80" {...body} />
      <path d="M52 38h14M52 34v8M66 34v8" {...eq} />
      <Arrow id="a-goblet" d="M90 42 L90 66" />
    </>
  ),

  rdl: (
    <>
      <Floor />
      <circle cx="34" cy="34" r="5" {...head} />
      <path d="M39 36 L64 44 L66 80" {...body} />
      <path d="M56 42 L56 62" {...body} />
      <path d="M48 62h16M48 58v8M64 58v8" {...eq} />
      <Arrow id="a-rdl" d="M84 40 Q92 54 82 68" />
    </>
  ),

  lunge: (
    <>
      <Floor />
      <circle cx="58" cy="24" r="5" {...head} />
      <path d="M58 29 L58 52" {...body} />
      <path d="M58 52 L40 66 L40 82" {...body} />
      <path d="M58 52 L74 68 L86 82" {...body} />
      <path d="M46 44h12M46 40v8M58 40v8" {...eq} />
      <path d="M74 44h12M74 40v8M86 40v8" {...eq} />
      <Arrow id="a-lunge" d="M24 46 L24 68" />
    </>
  ),

  calfRaise: (
    <>
      <Floor />
      <path d="M40 78h40v6h-40z" {...eq} />
      <circle cx="58" cy="24" r="5" {...head} />
      <path d="M58 29 L58 60 L58 74" {...body} />
      <path d="M58 74 L68 78" {...body} />
      <path d="M50 50h12M50 46v8M62 46v8" {...eq} />
      <Arrow id="a-calf" d="M86 60 L86 44" />
    </>
  ),

  gluteBridge: (
    <>
      <Floor />
      <circle cx="26" cy="72" r="5" {...head} />
      <path d="M32 74 L58 56 L74 78" {...body} />
      <path d="M50 60h18M50 54v10M68 54v10" {...eq} />
      <Arrow id="a-bridge" d="M92 66 L92 46" />
    </>
  ),

  shoulderCircles: (
    <>
      <Floor />
      <circle cx="60" cy="30" r="5" {...head} />
      <path d="M60 35 L60 60 L52 80M60 60 L68 80" {...body} />
      <path d="M60 42 L38 34" {...body} />
      <path d="M60 42 L82 34" {...body} />
      <Arrow id="a-atw" d="M30 44 Q30 12 60 12 Q90 12 90 44" />
    </>
  ),
}

export function ExerciseArt({ name, className }) {
  const drawing = art[name]
  if (!drawing) return null
  return (
    <svg viewBox={V} className={className} role="img" aria-label="Movement diagram">
      {drawing}
    </svg>
  )
}

export const hasArt = (name) => Boolean(art[name])
