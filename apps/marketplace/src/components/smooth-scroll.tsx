'use client'

import { useEffect, type RefObject } from 'react'
import Lenis from 'lenis'

interface SmoothScrollProps {
  /** Custom scroll container element (defaults to window) */
  wrapperRef?: RefObject<HTMLElement | null>
}

export function SmoothScroll({ wrapperRef }: SmoothScrollProps = {}) {
  useEffect(() => {
    const wrapper = wrapperRef?.current
    // If a ref was provided but the element isn't mounted yet, skip
    if (wrapperRef && !wrapper) return

    const lenis = new Lenis({
      ...(wrapper ? { wrapper, content: wrapper.children[0] as HTMLElement } : {}),
      duration: 1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      anchors: true,
    })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [wrapperRef])

  return null
}
