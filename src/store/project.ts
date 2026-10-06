import { create } from 'zustand'
import { EDGE_META, NODE_META, parseProject, type EdgeKind, type NodeType, type PlanEdge, type PlanNode, type Project } from '../core/schema'
import { diaryExample } from '../examples/diary'

const KEY = 'npp.project.v1'

function load(): Project {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const r = parseProject(JSON.parse(raw))
      if (r.ok) return r.project
    }
  } catch {
    // 저장소를 못 읽으면 예시로 시작
  }
  return structuredClone(diaryExample)
}

function save(p: Project) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    // 저장 공간이 막혀 있어도 화면은 계속 동작
  }
}

const uid = (prefix: string) => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`

const HISTORY_LIMIT = 100
const MERGE_MS = 800

type State = {
  project: Project
  past: Project[]
  future: Project[]
  undo: () => void
  redo: () => void
  selectedId: string | null
  selectedEdgeId: string | null
  savedAt: number
  select: (id: string | null) => void
  selectEdge: (id: string | null) => void
  setProject: (p: Project) => void
  setName: (name: string) => void
  updateMeta: (patch: Partial<Pick<Project, 'goal' | 'audience' | 'design'>>) => void
  addNode: (type: NodeType, pos: { x: number; y: number }) => string
  updateNode: (id: string, patch: Partial<PlanNode>) => void
  moveNode: (id: string, x: number, y: number) => void
  moveNodes: (positions: Record<string, { x: number; y: number }>) => void
  removeNode: (id: string) => void
  setStart: (id: string) => void
  addEdge: (from: string, to: string, kind?: EdgeKind) => void
  updateEdge: (id: string, patch: Partial<PlanEdge>) => void
  removeEdge: (id: string) => void
}

export const useProject = create<State>((set, get) => {
  // 같은 항목을 연달아 고치는 동작(글자 입력, 드래그)은 한 번의 되돌리기로 묶는다
  let lastKey = ''
  let lastAt = 0
  const commit = (project: Project, selectedId = get().selectedId, key = '') => {
    const now = Date.now()
    const merge = key !== '' && key === lastKey && now - lastAt < MERGE_MS
    lastKey = key
    lastAt = now
    const past = merge ? get().past : [...get().past, get().project].slice(-HISTORY_LIMIT)
    save(project)
    set({ project, past, future: [], selectedId, savedAt: now })
  }
  const jump = (project: Project, past: Project[], future: Project[]) => {
    lastKey = ''
    save(project)
    const { selectedId, selectedEdgeId } = get()
    set({
      project,
      past,
      future,
      selectedId: project.nodes.some((n) => n.id === selectedId) ? selectedId : null,
      selectedEdgeId: project.edges.some((e) => e.id === selectedEdgeId) ? selectedEdgeId : null,
      savedAt: Date.now(),
    })
  }
  return {
    project: load(),
    past: [],
    future: [],
    undo: () => {
      const { past, future, project } = get()
      if (past.length) jump(past[past.length - 1], past.slice(0, -1), [project, ...future])
    },
    redo: () => {
      const { past, future, project } = get()
      if (future.length) jump(future[0], [...past, project], future.slice(1))
    },
    selectedId: null,
    selectedEdgeId: null,
    savedAt: Date.now(),
    select: (id) => set({ selectedId: id, selectedEdgeId: null }),
    selectEdge: (id) => set({ selectedEdgeId: id, selectedId: null }),
    setProject: (p) => commit(p, null),
    setName: (name) => commit({ ...get().project, name: name || '이름 없는 프로젝트' }, undefined, 'name'),
    updateMeta: (patch) => commit({ ...get().project, ...patch }, undefined, `meta:${Object.keys(patch).join()}`),
    addNode: (type, pos) => {
      const p = get().project
      const id = uid('n')
      const node: PlanNode = {
        id,
        type,
        x: Math.round(pos.x),
        y: Math.round(pos.y),
        name: `새 ${NODE_META[type].label}`,
        purpose: '',
        ...(type === 'screen' && !p.nodes.some((n) => n.isStart) ? { isStart: true } : {}),
      }
      commit({ ...p, nodes: [...p.nodes, node] }, id)
      return id
    },
    updateNode: (id, patch) => {
      const p = get().project
      commit({ ...p, nodes: p.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) }, undefined, `node:${id}:${Object.keys(patch).join()}`)
    },
    moveNode: (id, x, y) => {
      const p = get().project
      commit({ ...p, nodes: p.nodes.map((n) => (n.id === id ? { ...n, x: Math.round(x), y: Math.round(y) } : n)) }, undefined, `move:${id}`)
    },
    moveNodes: (positions) => {
      const p = get().project
      commit({ ...p, nodes: p.nodes.map((n) => (positions[n.id] ? { ...n, ...positions[n.id] } : n)) })
    },
    removeNode: (id) => {
      const p = get().project
      commit(
        { ...p, nodes: p.nodes.filter((n) => n.id !== id), edges: p.edges.filter((e) => e.from !== id && e.to !== id) },
        get().selectedId === id ? null : get().selectedId,
      )
    },
    setStart: (id) => {
      const p = get().project
      commit({ ...p, nodes: p.nodes.map((n) => ({ ...n, isStart: n.id === id && n.type === 'screen' ? true : undefined })) })
    },
    addEdge: (from, to, kind) => {
      const p = get().project
      if (from === to || p.edges.some((e) => e.from === from && e.to === to)) return
      const src = p.nodes.find((n) => n.id === from)
      const dst = p.nodes.find((n) => n.id === to)
      const k: EdgeKind =
        kind ??
        (src?.type === 'role' || dst?.type === 'role' ? 'permit' : src?.type === 'notification' || dst?.type === 'notification' ? 'trigger' : dst?.type === 'data' ? 'save' : src?.type === 'data' ? 'read' : 'navigate')
      commit({ ...p, edges: [...p.edges, { id: uid('e'), from, to, kind: k, label: EDGE_META[k].label }] })
    },
    updateEdge: (id, patch) => {
      const p = get().project
      commit({ ...p, edges: p.edges.map((e) => (e.id === id ? { ...e, ...patch } : e)) }, undefined, `edge:${id}:${Object.keys(patch).join()}`)
    },
    removeEdge: (id) => {
      const p = get().project
      commit({ ...p, edges: p.edges.filter((e) => e.id !== id) })
    },
  }
})
