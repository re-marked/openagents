'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// ── Types ────────────────────────────────────────────────────────────────

interface GraphNode extends SimulationNodeDatum {
  id: string
  label: string
  isRoot: boolean
  content: string
  tags: string[]
  incomingCount: number
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  source: string | GraphNode
  target: string | GraphNode
}

interface FileData {
  path: string
  name: string
  content: string
}

// ── Constants ────────────────────────────────────────────────────────────

const NODE_COLOR_ROOT = 'hsl(215, 90%, 58%)'
const NODE_COLOR_DEFAULT = 'hsl(160, 60%, 45%)'
const EDGE_COLOR = 'hsl(0, 0%, 30%)'
const LABEL_COLOR = 'hsl(0, 0%, 70%)'

// ── Wikilink + tag parsing ───────────────────────────────────────────────

function parseWikilinks(content: string): string[] {
  const matches = content.matchAll(/\[\[([^\]]+)\]\]/g)
  return [...new Set([...matches].map((m) => m[1]))]
}

function parseTags(content: string): string[] {
  const matches = content.matchAll(/#([a-zA-Z][\w-]*)/g)
  return [...new Set([...matches].map((m) => m[1]))]
}

function slugFromFilename(filename: string): string {
  return filename.replace(/\.md$/, '').toLowerCase()
}

// ── Graph builder ────────────────────────────────────────────────────────

function buildGraph(files: FileData[]): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodeMap = new Map<string, GraphNode>()
  const links: GraphLink[] = []

  // Create nodes for all files
  for (const file of files) {
    const slug = slugFromFilename(file.name)
    const isRoot = file.name === 'MEMORY.md'
    const label = isRoot ? 'MEMORY' : slug
    const tags = parseTags(file.content)

    nodeMap.set(slug, {
      id: slug,
      label,
      isRoot,
      content: file.content,
      tags,
      incomingCount: 0,
    })
  }

  // Build edges from wikilinks
  for (const file of files) {
    const sourceSlug = slugFromFilename(file.name)
    const wikilinks = parseWikilinks(file.content)

    for (const target of wikilinks) {
      const targetSlug = target.toLowerCase()
      if (nodeMap.has(targetSlug) && targetSlug !== sourceSlug) {
        links.push({ source: sourceSlug, target: targetSlug })
        const targetNode = nodeMap.get(targetSlug)!
        targetNode.incomingCount++
      }
    }
  }

  return { nodes: Array.from(nodeMap.values()), links }
}

// ── Wikilink preprocessing ────────────────────────────────────────────────

// Convert [[slug]] to markdown links with a special wikilink: protocol
// so we can intercept clicks in the <a> component
function wikilinkify(content: string): string {
  return content.replace(/\[\[([^\]]+)\]\]/g, '[$1](wikilink:$1)')
}

// ── Markdown components (no @tailwindcss/typography needed) ──────────────

function makeMdComponents(onNavigate: (slug: string) => void) {
  return {
    h1: ({ children }: { children?: React.ReactNode }) => (
      <h1 className="text-base font-bold text-foreground mt-4 mb-2 first:mt-0">{children}</h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="text-sm font-semibold text-foreground mt-3 mb-1.5">{children}</h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="text-xs font-semibold text-foreground mt-2.5 mb-1">{children}</h3>
    ),
    p: ({ children }: { children?: React.ReactNode }) => (
      <p className="my-1.5 leading-relaxed">{children}</p>
    ),
    ul: ({ children }: { children?: React.ReactNode }) => (
      <ul className="my-1.5 ml-4 list-disc space-y-0.5">{children}</ul>
    ),
    ol: ({ children }: { children?: React.ReactNode }) => (
      <ol className="my-1.5 ml-4 list-decimal space-y-0.5">{children}</ol>
    ),
    li: ({ children }: { children?: React.ReactNode }) => (
      <li className="leading-relaxed">{children}</li>
    ),
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),
    code: ({ children }: { children?: React.ReactNode }) => (
      <code className="text-[11px] bg-muted/60 px-1 py-0.5 rounded font-mono">{children}</code>
    ),
    a: ({ children, href }: { children?: React.ReactNode; href?: string }) => {
      if (href?.startsWith('wikilink:')) {
        const slug = href.replace('wikilink:', '').toLowerCase()
        return (
          <button
            onClick={() => onNavigate(slug)}
            className="text-blue-400 hover:underline cursor-pointer"
          >
            {children}
          </button>
        )
      }
      return <a href={href} className="text-blue-400 hover:underline">{children}</a>
    },
    table: ({ children }: { children?: React.ReactNode }) => (
      <table className="my-2 w-full text-xs border-collapse">{children}</table>
    ),
    th: ({ children }: { children?: React.ReactNode }) => (
      <th className="text-left font-semibold text-foreground border-b border-border/40 py-1 px-2">{children}</th>
    ),
    td: ({ children }: { children?: React.ReactNode }) => (
      <td className="border-b border-border/20 py-1 px-2">{children}</td>
    ),
    hr: () => <hr className="my-3 border-border/30" />,
  }
}

// ── Component ────────────────────────────────────────────────────────────

interface KnowledgeGraphProps {
  instanceId: string
}

export function KnowledgeGraph({ instanceId }: KnowledgeGraphProps) {
  const [files, setFiles] = useState<FileData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [, setTick] = useState(0)

  const svgRef = useRef<SVGSVGElement>(null)
  const nodesRef = useRef<GraphNode[]>([])
  const linksRef = useRef<GraphLink[]>([])
  const simRef = useRef<ReturnType<typeof forceSimulation<GraphNode>> | null>(null)
  const dragRef = useRef<{
    node: GraphNode | null
    offsetX: number
    offsetY: number
  }>({ node: null, offsetX: 0, offsetY: 0 })
  const panRef = useRef<{
    active: boolean
    startX: number
    startY: number
    startVX: number
    startVY: number
  }>({ active: false, startX: 0, startY: 0, startVX: 0, startVY: 0 })
  const viewBoxRef = useRef({ x: -200, y: -240, w: 400, h: 480 })
  const rafRef = useRef<number>(0)

  // Fetch memory files
  useEffect(() => {
    async function fetchFiles() {
      try {
        // Fetch MEMORY.md
        const memoryRes = await fetch(
          `/api/agent/files?instanceId=${instanceId}&path=/data/workspace/MEMORY.md`
        )
        const memoryData = await memoryRes.json()

        // Fetch memory directory listing
        const dirRes = await fetch(
          `/api/agent/files?instanceId=${instanceId}&path=/data/memory&list=true`
        )
        const dirData = await dirRes.json()

        // Parse filenames from directory listing
        const dirOutput: string = dirData.output || ''
        const filenames = dirOutput
          .split('\n')
          .filter((line: string) => line.includes('.md'))
          .map((line: string) => {
            const parts = line.trim().split(/\s+/)
            return parts[parts.length - 1]
          })
          .filter(Boolean)

        // Fetch each memory file
        const filePromises = filenames.map(async (name: string) => {
          const res = await fetch(
            `/api/agent/files?instanceId=${instanceId}&path=/data/memory/${name}`
          )
          const data = await res.json()
          return { path: `/data/memory/${name}`, name, content: data.content || '' }
        })

        const memoryFiles = await Promise.all(filePromises)

        const allFiles: FileData[] = [
          { path: '/data/workspace/MEMORY.md', name: 'MEMORY.md', content: memoryData.content || '' },
          ...memoryFiles,
        ]

        setFiles(allFiles)
      } catch {
        // Non-critical — show empty graph
      } finally {
        setLoading(false)
      }
    }
    fetchFiles()
  }, [instanceId])

  // Build graph and run simulation
  const graph = useMemo(() => {
    if (files.length === 0) return { nodes: [], links: [] }
    return buildGraph(files)
  }, [files])

  useEffect(() => {
    if (graph.nodes.length === 0) return

    nodesRef.current = graph.nodes.map((n) => ({ ...n }))
    linksRef.current = graph.links.map((l) => ({ ...l }))

    const sim = forceSimulation<GraphNode>(nodesRef.current)
      .force(
        'link',
        forceLink<GraphNode, GraphLink>(linksRef.current)
          .id((d) => d.id)
          .distance(70)
          .strength(0.12)
      )
      .force('charge', forceManyBody().strength(-400))
      .force('center', forceCenter(0, 0).strength(0.02))
      .force('collide', forceCollide<GraphNode>().radius((d) => nodeRadius(d) + 4))
      .alpha(0.8)
      .alphaDecay(0.012)

    simRef.current = sim

    // Pre-select MEMORY.md node
    const memoryNode = nodesRef.current.find((n) => n.isRoot)
    if (memoryNode) {
      setSelectedNode(memoryNode)
    }

    function tick() {
      setTick((t) => t + 1)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      sim.stop()
    }
  }, [graph])

  // Node radius based on incoming links
  function nodeRadius(node: GraphNode): number {
    if (node.isRoot) return 16
    return 7 + node.incomingCount * 2
  }

  // ── Drag handlers ──────────────────────────────────────────────────────

  const handlePointerDown = useCallback((e: React.PointerEvent, node: GraphNode) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)

    const svg = svgRef.current
    if (!svg) return

    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse())

    dragRef.current = {
      node,
      offsetX: (node.x ?? 0) - svgP.x,
      offsetY: (node.y ?? 0) - svgP.y,
    }

    node.fx = node.x
    node.fy = node.y
    simRef.current?.alphaTarget(0.3).restart()
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const { node } = dragRef.current
    if (!node) return

    const svg = svgRef.current
    if (!svg) return

    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse())

    node.fx = svgP.x + dragRef.current.offsetX
    node.fy = svgP.y + dragRef.current.offsetY
  }, [])

  const handlePointerUp = useCallback(() => {
    const { node } = dragRef.current
    if (node) {
      node.fx = null
      node.fy = null
      simRef.current?.alphaTarget(0)
    }
    dragRef.current = { node: null, offsetX: 0, offsetY: 0 }
  }, [])

  // ── Pan handlers ───────────────────────────────────────────────────────

  const handleBgPointerDown = useCallback((e: React.PointerEvent) => {
    if (dragRef.current.node) return
    e.currentTarget.setPointerCapture(e.pointerId)
    panRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startVX: viewBoxRef.current.x,
      startVY: viewBoxRef.current.y,
    }
  }, [])

  const handleBgPointerMove = useCallback((e: React.PointerEvent) => {
    if (!panRef.current.active || dragRef.current.node) return

    const svg = svgRef.current
    if (!svg) return

    const ctm = svg.getScreenCTM()
    if (!ctm) return
    const scale = ctm.a // current scale factor

    const dx = (e.clientX - panRef.current.startX) / scale
    const dy = (e.clientY - panRef.current.startY) / scale

    viewBoxRef.current.x = panRef.current.startVX - dx
    viewBoxRef.current.y = panRef.current.startVY - dy
    setTick((t) => t + 1)
  }, [])

  const handleBgPointerUp = useCallback(() => {
    panRef.current.active = false
  }, [])

  // ── Zoom handler ───────────────────────────────────────────────────────

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const factor = e.deltaY > 0 ? 1.1 : 0.9
    const vb = viewBoxRef.current

    const svg = svgRef.current
    if (!svg) return

    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse())

    const newW = vb.w * factor
    const newH = vb.h * factor

    // Zoom toward cursor
    vb.x = svgP.x - (svgP.x - vb.x) * factor
    vb.y = svgP.y - (svgP.y - vb.y) * factor
    vb.w = newW
    vb.h = newH

    setTick((t) => t + 1)
  }, [])

  // ── Click handler ──────────────────────────────────────────────────────

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode((prev) => (prev?.id === node.id ? null : node))
  }, [])

  // Navigate to a node by slug (from wikilink click)
  const navigateToNode = useCallback((slug: string) => {
    const target = nodesRef.current.find((n) => n.id === slug)
    if (target) setSelectedNode(target)
  }, [])

  // Memoize md components so they don't recreate on every render
  const mdComponents = useMemo(() => makeMdComponents(navigateToNode), [navigateToNode])

  // ── Render ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[480px]">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading memory graph...
        </div>
      </div>
    )
  }

  if (files.length === 0 || graph.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-[480px] text-sm text-muted-foreground">
        No memory files found.
      </div>
    )
  }

  const vb = viewBoxRef.current
  const nodes = nodesRef.current
  const links = linksRef.current

  return (
    <div className="flex gap-3 items-stretch">
      {/* SVG graph — compact left side */}
      <div
        className={`relative rounded-xl border border-border/40 bg-card/30 overflow-hidden select-none shrink-0 transition-all duration-200 ${
          selectedNode ? 'w-[55%]' : 'w-full'
        }`}
        style={{ touchAction: 'none', height: 480 }}
      >
        <svg
          ref={svgRef}
          className="w-full h-full"
          viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
          onPointerDown={handleBgPointerDown}
          onPointerMove={(e) => {
            handleBgPointerMove(e)
            handlePointerMove(e)
          }}
          onPointerUp={() => {
            handleBgPointerUp()
            handlePointerUp()
          }}
          onWheel={handleWheel}
        >
          {/* Edges */}
          {links.map((link, i) => {
            const s = link.source as GraphNode
            const t = link.target as GraphNode
            if (s.x == null || t.x == null) return null
            return (
              <line
                key={i}
                x1={s.x}
                y1={s.y}
                x2={t.x}
                y2={t.y}
                stroke={EDGE_COLOR}
                strokeWidth={1.2}
                strokeOpacity={0.5}
              />
            )
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            if (node.x == null || node.y == null) return null
            const r = nodeRadius(node)
            const isSelected = selectedNode?.id === node.id
            const fill = node.isRoot ? NODE_COLOR_ROOT : NODE_COLOR_DEFAULT

            return (
              <g
                key={node.id}
                className="cursor-pointer"
                onPointerDown={(e) => handlePointerDown(e, node)}
                onClick={() => handleNodeClick(node)}
              >
                {/* Glow for selected */}
                {isSelected && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={r + 6}
                    fill="none"
                    stroke="white"
                    strokeWidth={2}
                    strokeOpacity={0.6}
                  />
                )}

                {/* Node circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r}
                  fill={fill}
                  fillOpacity={0.85}
                  stroke={fill}
                  strokeWidth={isSelected ? 2 : 1}
                  strokeOpacity={isSelected ? 1 : 0.4}
                />

                {/* Label */}
                <text
                  x={node.x}
                  y={(node.y ?? 0) + r + 14}
                  textAnchor="middle"
                  fill={LABEL_COLOR}
                  fontSize={node.isRoot ? 12 : 10}
                  fontWeight={node.isRoot ? 600 : 400}
                  className="pointer-events-none"
                >
                  {node.label}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Zoom hint */}
        <div className="absolute bottom-2 right-3 text-[10px] text-muted-foreground/40 pointer-events-none">
          scroll to zoom · drag to pan
        </div>
      </div>

      {/* Content panel — right side */}
      <AnimatePresence mode="wait">
        {selectedNode && (
          <motion.div
            key={selectedNode.id}
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '45%' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden min-w-0"
          >
            <div className="rounded-xl border border-border/40 bg-card/50 p-4 h-[480px] flex flex-col">
              <div className="flex items-start justify-between gap-3 shrink-0">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold truncate">{selectedNode.label}</h3>
                  {selectedNode.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {selectedNode.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              </div>
              <div className="mt-3 text-xs text-muted-foreground overflow-y-auto flex-1 min-h-0">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={mdComponents}
                >
                  {wikilinkify(selectedNode.content.trim())}
                </ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
