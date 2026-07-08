"use client"

import { useEffect, useState } from "react"
import { animate, useReducedMotion } from "framer-motion"

export function useCountUp(target: number, durationMs = 800): number {
  const [value, setValue] = useState(0)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) {
      setValue(target)
      return
    }
    const controls = animate(0, target, {
      duration: durationMs / 1000,
      ease: [0.4, 0, 0.2, 1],
      onUpdate: (v) => setValue(v),
    })
    return () => controls.stop()
  }, [target, durationMs, prefersReducedMotion])

  return value
}
