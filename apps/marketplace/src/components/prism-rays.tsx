/**
 * Rainbow prism rays emanating from a center point.
 * Vercel-inspired light refraction effect for behind the Sierpinski hero.
 */

function getRayColor(t: number): string {
  // Full HSL wheel — seamless wrap, no hard edge.
  // Offset so blue/cyan lands at the top of the circle.
  const hue = (t * 360 + 290) % 360
  return `hsl(${hue}, 80%, 55%)`
}

export function PrismRays({ className }: { className?: string }) {
  const numRays = 72 // Reduced from 90 for less visual noise
  const spreadDeg = 360
  const startDeg = 0

  const rays = Array.from({ length: numRays }, (_, i) => {
    const t = i / (numRays - 1)
    const angleDeg = startDeg + spreadDeg * t
    const angleRad = (angleDeg * Math.PI) / 180
    const len = 5000
    return {
      x: Math.cos(angleRad) * len,
      y: Math.sin(angleRad) * len,
      color: getRayColor(t),
    }
  })

  return (
    <svg className={className} viewBox="-5000 -5000 10000 10000">
      <defs>
        <filter id="ray-glow">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <radialGradient id="fade-mask-gradient">
          <stop offset="0%" stopColor="black" />
          <stop offset="8%" stopColor="black" />
          <stop offset="12%" stopColor="white" />
          <stop offset="70%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </radialGradient>
        <mask id="fade-mask">
          <rect x="-5000" y="-5000" width="10000" height="10000" fill="url(#fade-mask-gradient)" />
        </mask>
      </defs>

      <g mask="url(#fade-mask)">
        {/* Glow layer */}
        {rays.map((ray, i) => (
          <line
            key={`g${i}`}
            x1={0}
            y1={0}
            x2={ray.x}
            y2={ray.y}
            stroke={ray.color}
            strokeWidth={12}
            opacity={0.2}
            filter="url(#ray-glow)"
          />
        ))}

        {/* Sharp rays */}
        {rays.map((ray, i) => (
          <line
            key={i}
            x1={0}
            y1={0}
            x2={ray.x}
            y2={ray.y}
            stroke={ray.color}
            strokeWidth={2}
            opacity={0.4}
          />
        ))}
      </g>
    </svg>
  )
}
