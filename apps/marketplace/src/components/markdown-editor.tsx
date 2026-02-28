'use client'

import { useRef, useCallback } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor

    monaco.editor.defineTheme('agentbay-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword.md', foreground: 'e5a84b' },           // headings — warm amber
        { token: 'string.link.md', foreground: 'c8962a' },        // link URLs — amber accent
        { token: 'markup.underline.link.md', foreground: 'c8962a' },
        { token: 'string.md', foreground: 'c8962a' },
        { token: 'markup.bold.md', foreground: 'f0e6d3', fontStyle: 'bold' },
        { token: 'markup.italic.md', foreground: 'ddd0c0', fontStyle: 'italic' },
        { token: 'variable.md', foreground: '6ec87a' },           // code spans — green
        { token: 'markup.inline.raw.md', foreground: '6ec87a' },
        { token: 'comment.md', foreground: '6b6560' },            // comments — warm muted
        { token: 'punctuation.md', foreground: '8a8078' },        // punctuation — dim
        { token: 'markup.list.md', foreground: 'c8a97a' },        // list markers — warm tan
      ],
      colors: {
        'editor.background': '#1a1918',
        'editor.foreground': '#e8e0d6',
        'editor.lineHighlightBackground': '#211f1e',
        'editor.selectionBackground': '#2a4060',
        'editorLineNumber.foreground': '#5c5550',
        'editorLineNumber.activeForeground': '#9a9088',
        'editor.inactiveSelectionBackground': '#252220',
        'editorCursor.foreground': '#d4952a',
        'editorIndentGuide.background': '#2a2826',
        'editorWidget.background': '#1a1918',
        'editorWidget.border': '#2e2c2a',
      },
    })
    monaco.editor.setTheme('agentbay-dark')
  }, [])

  return (
    <Editor
      height="100%"
      language="markdown"
      value={value}
      onChange={(v) => onChange(v ?? '')}
      onMount={handleMount}
      theme="vs-dark"
      options={{
        fontSize: 13,
        fontFamily: 'var(--font-geist-mono), monospace',
        lineHeight: 22,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        tabSize: 2,
        padding: { top: 12, bottom: 12 },
        renderLineHighlight: 'line',
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        lineNumbers: 'on',
        folding: true,
        glyphMargin: false,
        lineDecorationsWidth: 8,
        lineNumbersMinChars: 3,
        overviewRulerBorder: false,
        hideCursorInOverviewRuler: true,
        scrollbar: {
          verticalScrollbarSize: 6,
          horizontalScrollbarSize: 6,
        },
      }}
      loading={
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Loading editor...
        </div>
      }
    />
  )
}
