'use client'

import { useRef, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (message: string) => void
  disabled?: boolean
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    const value = textareaRef.current?.value.trim()
    if (!value || disabled) return
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
    <div className="border-t p-4">
      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          placeholder="Type a message..."
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="min-h-10 max-h-32 resize-none"
          rows={1}
        />
        <Button onClick={handleSend} disabled={disabled} size="default">
          Send
        </Button>
      </div>
    </div>
  )
}
