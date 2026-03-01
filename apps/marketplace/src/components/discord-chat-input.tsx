'use client'

import { useRef, type KeyboardEvent } from 'react'
import { Textarea } from '@/components/ui/textarea'

export function DiscordChatInput({
  onSend,
  disabled,
  disabledPlaceholder,
}: {
  onSend: (message: string) => void
  disabled?: boolean
  disabledPlaceholder?: string
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    if (disabled) return
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
        placeholder={disabled && disabledPlaceholder ? disabledPlaceholder : 'Message #team-chat'}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="bg-muted/50 border-muted-foreground/20 min-h-14 max-h-40 resize-none rounded-lg text-base disabled:opacity-50 disabled:cursor-not-allowed"
        rows={1}
      />
    </div>
  )
}
