'use client'

import { motion } from 'framer-motion'
import { springGentle } from '@/lib/spring'

export default function WorkspaceTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springGentle, opacity: { duration: 0.2 } }}
      className="flex flex-1 min-h-0 flex-col overflow-hidden"
    >
      {children}
    </motion.div>
  )
}
