'use client'

import { useRef, type KeyboardEvent } from 'react'
import { Textarea } from '@/components/ui/textarea'

export function DiscordChatInput({
  onSend,
}: {
  onSend: (message: string) => void
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    const value = textareaRef.current?.value.trim()
    if (!value) return
    onSend(value)
    if (textareaRef.current) {
      textareaRef.current.value = ''
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="px-4 pb-6 pt-0">
      <Textarea
        ref={textareaRef}
        placeholder="Message #team-chat"
        onKeyDown={handleKeyDown}
        className="bg-muted/50 border-muted-foreground/20 min-h-14 max-h-40 resize-none rounded-lg text-base focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground/30"
        rows={1}
      />
    </div>
  )
}
