'use client'

import { useEffect, useState } from 'react'

const words = [
  { text: 'everyone', duration: 3000 },
  { text: 'builders', duration: 2000 },
  { text: 'students', duration: 2000 },
  { text: 'creators', duration: 2000 },
  { text: 'founders', duration: 2000 },
  { text: 'designers', duration: 2000 },
  { text: 'developers', duration: 2000 },
]

type Phase = 'in' | 'visible' | 'out'

export function RotatingText() {
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('in')

  useEffect(() => {
    const current = words[index]

    if (phase === 'in') {
      const t = setTimeout(() => setPhase('visible'), 50)
      return () => clearTimeout(t)
    }

    if (phase === 'visible') {
      const t = setTimeout(() => setPhase('out'), current.duration - 400)
      return () => clearTimeout(t)
    }

    if (phase === 'out') {
      const t = setTimeout(() => {
        setIndex((i) => (i + 1) % words.length)
        setPhase('in')
      }, 400)
      return () => clearTimeout(t)
    }
  }, [index, phase])

  const transform =
    phase === 'in'
      ? 'translateY(0.3em)'
      : phase === 'visible'
        ? 'translateY(0)'
        : 'translateY(-0.3em)'

  const opacity = phase === 'visible' ? 1 : 0

  const transition =
    phase === 'in'
      ? 'none'
      : phase === 'visible'
        ? 'opacity 0.4s ease-out, transform 0.4s ease-out'
        : 'opacity 0.35s ease-in, transform 0.35s ease-in'

  return (
    <span
      className="inline-block"
      style={{ transform, opacity, transition }}
    >
      {words[index].text}
    </span>
  )
}
