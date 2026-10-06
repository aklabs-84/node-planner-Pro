import dagre from '@dagrejs/dagre'
import type { Project } from './schema'

export const NODE_W = 240
export const NODE_H = 88

export type Positions = Record<string, { x: number; y: number }>

/** 시작 화면에서 출발해 깊이 우선으로 걷다가 "되돌아오는 선"을 찾는다. */
function findBackEdges(project: Project): Set<string> {
  const out = new Map<string, { id: string; to: string }[]>()
  for (const n of project.nodes) out.set(n.id, [])
  for (const e of project.edges) out.get(e.from)?.push({ id: e.id, to: e.to })

  const back = new Set<string>()
  const state = new Map<string, 1 | 2>() // 1 = 걷는 중, 2 = 끝남
  const visit = (id: string) => {
    state.set(id, 1)
    for (const e of out.get(id) ?? []) {
      const s = state.get(e.to)
      if (s === 1) back.add(e.id)
      else if (!s) visit(e.to)
    }
    state.set(id, 2)
  }
  const start = project.nodes.find((n) => n.isStart)
  if (start) visit(start.id)
  const reachable = new Set(state.keys())
  for (const n of project.nodes) if (!state.has(n.id)) visit(n.id)
  // 시작에서 닿지 않는 노드가 시작 쪽으로 향하는 선도 뒤집어야 시작 화면이 맨 왼쪽에 놓인다
  for (const e of project.edges) if (!reachable.has(e.from) && reachable.has(e.to)) back.add(e.id)
  return back
}

/** 왼쪽 → 오른쪽 흐름으로 노드 위치를 계산한다. 프로젝트는 바꾸지 않는다. */
export function autoLayout(project: Project): Positions {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'LR', ranksep: 110, nodesep: 48, marginx: 0, marginy: 0 })
  g.setDefaultEdgeLabel(() => ({}))
  for (const n of project.nodes) g.setNode(n.id, { width: NODE_W, height: NODE_H })

  // 되돌아오는 선은 방향을 뒤집어서 계산해야 시작 화면이 왼쪽 끝에 놓인다
  const back = findBackEdges(project)
  for (const e of project.edges) {
    if (back.has(e.id)) g.setEdge(e.to, e.from)
    else g.setEdge(e.from, e.to)
  }
  dagre.layout(g)

  const pos: Positions = {}
  for (const n of project.nodes) {
    const p = g.node(n.id)
    pos[n.id] = { x: Math.round(p.x - NODE_W / 2), y: Math.round(p.y - NODE_H / 2) }
  }
  return pos
}

export interface FlowEdge {
  from: string
  to: string
}

/** 노드 크기가 제각각일 때의 왼쪽 → 오른쪽 흐름 위치(앱 화면 보기용). 프로젝트는 바꾸지 않는다. */
export function flowLayout(ids: string[], edges: FlowEdge[], startId: string | null, size: (id: string) => { w: number; h: number }): Positions {
  const idSet = new Set(ids)
  const es = edges.filter((e) => idSet.has(e.from) && idSet.has(e.to) && e.from !== e.to)
  const out = new Map<string, string[]>(ids.map((i) => [i, []]))
  for (const e of es) out.get(e.from)!.push(e.to)

  // 되돌아오는 선은 방향을 뒤집어 계산해야 시작 화면이 왼쪽 끝에 놓인다
  const back = new Set<string>()
  const state = new Map<string, 1 | 2>()
  const visit = (id: string) => {
    state.set(id, 1)
    for (const to of out.get(id) ?? []) {
      const s = state.get(to)
      if (s === 1) back.add(`${id}>${to}`)
      else if (!s) visit(to)
    }
    state.set(id, 2)
  }
  if (startId && idSet.has(startId)) visit(startId)
  const reachable = new Set(state.keys())
  for (const i of ids) if (!state.has(i)) visit(i)
  for (const e of es) if (!reachable.has(e.from) && reachable.has(e.to)) back.add(`${e.from}>${e.to}`)

  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'LR', ranksep: 90, nodesep: 40, marginx: 0, marginy: 0 })
  g.setDefaultEdgeLabel(() => ({}))
  for (const i of ids) g.setNode(i, { width: size(i).w, height: size(i).h })
  for (const e of es) {
    if (back.has(`${e.from}>${e.to}`)) g.setEdge(e.to, e.from)
    else g.setEdge(e.from, e.to)
  }
  dagre.layout(g)

  const pos: Positions = {}
  for (const i of ids) {
    const p = g.node(i)
    const { w, h } = size(i)
    pos[i] = { x: Math.round(p.x - w / 2), y: Math.round(p.y - h / 2) }
  }
  return pos
}
