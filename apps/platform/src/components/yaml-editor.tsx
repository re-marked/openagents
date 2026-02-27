'use client'

import { useRef, useCallback } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'

interface YamlEditorProps {
  value: string
  onChange: (value: string) => void
}

export function YamlEditor({ value, onChange }: YamlEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor

    // Custom dark theme matching the app palette
    monaco.editor.defineTheme('agentbay-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'key', foreground: '86efac' },       // green for keys
        { token: 'string', foreground: '93c5fd' },     // blue for strings
        { token: 'number', foreground: 'fbbf24' },     // amber for numbers
        { token: 'comment', foreground: '6b7280' },
      ],
      colors: {
        'editor.background': '#0a0c0f',
        'editor.foreground': '#e5e7eb',
        'editor.lineHighlightBackground': '#111318',
        'editor.selectionBackground': '#1e3a5f',
        'editorLineNumber.foreground': '#374151',
        'editorLineNumber.activeForeground': '#9ca3af',
        'editor.inactiveSelectionBackground': '#1e293b',
      },
    })
    monaco.editor.setTheme('agentbay-dark')
  }, [])

  return (
    <Editor
      height="100%"
      language="yaml"
      value={value}
      onChange={(v) => onChange(v ?? '')}
      onMount={handleMount}
      theme="vs-dark"
      options={{
        fontSize: 13,
        fontFamily: 'var(--font-geist-mono), monospace',
        lineHeight: 20,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        tabSize: 2,
        padding: { top: 12, bottom: 12 },
        renderLineHighlight: 'line',
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        bracketPairColorization: { enabled: true },
      }}
      loading={
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Loading editor...
        </div>
      }
    />
  )
}
