'use client'

import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import { ScrollArea } from '@/components/ui/scroll-area'

export function SmoothScrollArea({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const viewport = root.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement | null
    if (!viewport) return

    const lenis = new Lenis({
      wrapper: viewport,
      content: viewport.firstElementChild as HTMLElement,
      duration: 1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  return (
    <div ref={rootRef} style={{ display: 'contents' }}>
      <ScrollArea className={className}>
        {children}
      </ScrollArea>
    </div>
  )
}
