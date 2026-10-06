import { useCallback, useMemo } from 'react'
import { Background, BackgroundVariant, Controls, MarkerType, MiniMap, ReactFlow, ReactFlowProvider, type Edge, type EdgeChange, type NodeChange } from '@xyflow/react'
import { resolveDesign } from '../../core/design'
import { buildIr } from '../../core/ir'
import { flowLayout } from '../../core/layout'
import { NODE_META } from '../../core/schema'
import { useViewMode } from '../../lib/useViewMode'
import { useEdgeStyle } from '../../lib/useEdgeStyle'
import { useProject } from '../../store/project'
import { PlanNodeCard, type CardNode } from './PlanNodeCard'
import { FocusWatcher } from './FocusWatcher'
import { TidyButtons } from './TidyButtons'
import { PhoneNode, PHONE_H, PHONE_W, type PhoneNodeT } from './PhoneNode'
import { TourDriver } from './TourDriver'
import { ViewControls } from './ViewControls'

const nodeTypes = { card: PlanNodeCard, phone: PhoneNode }
const EDGE_COLOR = {
  navigate: '#9AA2B1',
  save: '#059669',
  read: '#0284C7',
  trigger: '#D97706',
  branch: '#DB2777',
  permit: '#7C3AED',
} as const

export function Canvas() {
  const project = useProject((s) => s.project)
  const selectedId = useProject((s) => s.selectedId)
  const selectedEdgeId = useProject((s) => s.selectedEdgeId)
  const edgeStyle = useEdgeStyle((s) => s.style)
  const appView = useViewMode((s) => s.mode) === 'app'
  const { moveNode, removeNode, removeEdge, select, selectEdge, addEdge } = useProject.getState()

  const nodes = useMemo<(CardNode | PhoneNodeT)[]>(() => {
    if (!appView) {
      return project.nodes.map((n) => ({
        id: n.id,
        type: 'card',
        position: { x: n.x, y: n.y },
        data: { node: n },
        initialWidth: 240,
        initialHeight: 88,
        selected: n.id === selectedId,
      }))
    }
    // 앱 화면 보기: 화면 노드는 휴대폰 크기라 겹치지 않도록 이 보기에서만 따로 자동 배치한다(저장된 위치는 그대로)
    const ir = buildIr(project)
    const screens = new Map(ir.screens.map((sc, i) => [sc.id, { sc, i }]))
    const design = resolveDesign(project.design)
    const sizeOf = (id: string) => (screens.has(id) ? { w: PHONE_W, h: PHONE_H } : { w: 240, h: 88 })
    const startId = project.nodes.find((n) => n.isStart)?.id ?? null
    const pos = flowLayout(
      project.nodes.map((n) => n.id),
      project.edges.map((e) => ({ from: e.from, to: e.to })),
      startId,
      sizeOf,
    )
    return project.nodes.map((n) => {
      const hit = screens.get(n.id)
      const position = pos[n.id] ?? { x: n.x, y: n.y }
      const base = {
        id: n.id,
        position,
        selected: n.id === selectedId,
        draggable: false,
      }
      return hit
        ? ({
            ...base,
            type: 'phone',
            data: {
              screen: hit.sc,
              design,
              index: hit.i + 1,
              total: ir.screens.length,
            },
            initialWidth: PHONE_W,
            initialHeight: PHONE_H,
          } as PhoneNodeT)
        : ({
            ...base,
            type: 'card',
            data: { node: n },
            initialWidth: 240,
            initialHeight: 88,
          } as CardNode)
    })
  }, [project, selectedId, appView])

  const edges = useMemo<Edge[]>(
    () =>
      project.edges.map((e) => ({
        id: e.id,
        source: e.from,
        target: e.to,
        label: e.label,
        selected: e.id === selectedEdgeId,
        type: edgeStyle,
        ...(edgeStyle === 'smoothstep' ? { pathOptions: { borderRadius: 10 } } : {}),
        style: {
          stroke: EDGE_COLOR[e.kind],
          strokeWidth: 1.6,
          strokeDasharray: e.kind === 'navigate' ? undefined : '5 4',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: EDGE_COLOR[e.kind],
          width: 16,
          height: 16,
        },
        labelBgPadding: [6, 3] as [number, number],
        labelBgBorderRadius: 10,
      })),
    [project.edges, selectedEdgeId, edgeStyle],
  )

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      for (const c of changes) {
        // 앱 화면 보기의 위치는 계산값이라 저장하지 않는다
        if (c.type === 'position' && c.position) {
          if (!appView) moveNode(c.id, c.position.x, c.position.y)
        } else if (c.type === 'remove') removeNode(c.id)
      }
    },
    [moveNode, removeNode, appView],
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      for (const c of changes) if (c.type === 'remove') removeEdge(c.id)
    },
    [removeEdge],
  )

  return (
    <ReactFlowProvider>
      <div className="flex h-full w-full flex-col">
        <ViewControls />
        <div className="relative min-h-0 flex-1">
          <ReactFlow
            key={appView ? 'app' : 'node'}
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={(c) => c.source && c.target && addEdge(c.source, c.target)}
            onNodeClick={(_, n) => select(n.id)}
            onEdgeClick={(_, e) => selectEdge(e.id)}
            onPaneClick={() => select(null)}
            deleteKeyCode={['Backspace', 'Delete']}
            fitView
            fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
            minZoom={appView ? 0.08 : 0.3}
            maxZoom={1.6}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="#CBD0D9" />
            <Controls showInteractive={false} />
            {!appView && <TidyButtons />}
            <FocusWatcher />
            <TourDriver />
            <MiniMap
              pannable
              zoomable
              nodeColor={(n) => {
                const t = (n.data as { node?: { type: keyof typeof NODE_META } } | undefined)?.node?.type
                return t ? NODE_META[t].color : '#94a3b8'
              }}
              maskColor="rgba(246,247,249,0.7)"
            />
          </ReactFlow>
        </div>
      </div>
    </ReactFlowProvider>
  )
}
