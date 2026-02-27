/**
 * Upside-down Sierpinski triangle, order 2.
 * 9 filled sub-triangles forming the fractal pattern.
 */
export function SierpinskiLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 128 111"
      className={className}
      role="img"
      aria-label="AgentBay logo"
    >
      <g fill="currentColor">
        <polygon points="0,0 32,0 16,27.7" />
        <polygon points="32,0 64,0 48,27.7" />
        <polygon points="16,27.7 48,27.7 32,55.4" />
        <polygon points="64,0 96,0 80,27.7" />
        <polygon points="96,0 128,0 112,27.7" />
        <polygon points="80,27.7 112,27.7 96,55.4" />
        <polygon points="32,55.4 64,55.4 48,83.1" />
        <polygon points="64,55.4 96,55.4 80,83.1" />
        <polygon points="48,83.1 80,83.1 64,110.9" />
      </g>
    </svg>
  )
}
