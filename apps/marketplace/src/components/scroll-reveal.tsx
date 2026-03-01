'use client'

import { motion } from 'framer-motion'
import { springGentle } from '@/lib/spring'

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function ScrollReveal({ children, className, delay = 0 }: ScrollRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ ...springGentle, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
