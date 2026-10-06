import { z } from 'zod'
import { LAYOUT_IDS, THEME_IDS } from './design.js'

export const NODE_TYPES = ['screen', 'component', 'data', 'logic', 'external', 'notification', 'role', 'note'] as const
export type NodeType = (typeof NODE_TYPES)[number]

export const EDGE_KINDS = ['navigate', 'save', 'read', 'trigger', 'branch', 'permit'] as const
export type EdgeKind = (typeof EDGE_KINDS)[number]

export const NodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(NODE_TYPES),
  x: z.number(),
  y: z.number(),
  name: z.string(),
  purpose: z.string().default(''),
  isStart: z.boolean().optional(),
  hasList: z.boolean().optional(),
  emptyState: z.boolean().optional(),
  fields: z.string().optional(),
})

export const EdgeSchema = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  kind: z.enum(EDGE_KINDS),
  label: z.string().default(''),
})

/** 값이 이상하면 파일 전체를 거절하지 않고 기본 디자인으로 되돌린다(resolveDesign). */
export const DesignSchema = z.object({ layout: z.enum(LAYOUT_IDS).catch('tabs'), theme: z.enum(THEME_IDS).catch('clean') })

export const ProjectSchema = z
  .object({
    version: z.literal(1),
    name: z.string().min(1),
    goal: z.string().default(''),
    audience: z.string().default(''),
    design: DesignSchema.optional(),
    nodes: z.array(NodeSchema),
    edges: z.array(EdgeSchema),
  })
  .superRefine((p, ctx) => {
    const ids = new Set<string>()
    for (const n of p.nodes) {
      if (ids.has(n.id)) ctx.addIssue({ code: 'custom', message: `노드 id가 겹쳐요: ${n.id}` })
      ids.add(n.id)
    }
    for (const e of p.edges) {
      if (!ids.has(e.from) || !ids.has(e.to)) {
        ctx.addIssue({ code: 'custom', message: `없는 노드를 잇는 선이 있어요: ${e.id}` })
      }
    }
  })

export type PlanNode = z.infer<typeof NodeSchema>
export type PlanEdge = z.infer<typeof EdgeSchema>
export type Project = z.infer<typeof ProjectSchema>

export const NODE_META: Record<NodeType, { label: string; hint: string; color: string; glyph: string }> = {
  screen: { label: '화면', hint: '앱의 한 화면', color: '#4F46E5', glyph: '화' },
  component: { label: '구성요소', hint: '버튼, 입력, 목록', color: '#0284C7', glyph: '구' },
  data: { label: '데이터', hint: '저장되는 정보', color: '#059669', glyph: '데' },
  logic: { label: '조건', hint: '만약 ~라면', color: '#D97706', glyph: '조' },
  external: { label: '외부 연동', hint: '로그인, 결제, API', color: '#DB2777', glyph: '외' },
  notification: { label: '알림', hint: '푸시·이메일 등 먼저 보내는 것', color: '#0D9488', glyph: '알' },
  role: { label: '역할', hint: '관리자·회원 등 사용자 종류', color: '#7C3AED', glyph: '역' },
  note: { label: '메모', hint: '참고 메모', color: '#64748B', glyph: '메' },
}

export const EDGE_META: Record<EdgeKind, { label: string }> = {
  navigate: { label: '이동' },
  save: { label: '저장' },
  read: { label: '읽기' },
  trigger: { label: '실행' },
  branch: { label: '분기' },
  permit: { label: '권한' },
}

export type ParseResult = { ok: true; project: Project } | { ok: false; error: string }

export function parseProject(raw: unknown): ParseResult {
  const r = ProjectSchema.safeParse(raw)
  if (r.success) return { ok: true, project: r.data }
  const first = r.error.issues[0]
  const where = first.path.length ? ` (${first.path.join('.')})` : ''
  return { ok: false, error: `${first.message}${where}` }
}

export function emptyProject(): Project {
  return {
    version: 1,
    name: '새 프로젝트',
    goal: '',
    audience: '',
    nodes: [
      { id: 'home', type: 'screen', x: 80, y: 80, name: '홈', purpose: '앱을 열면 처음 보이는 화면', isStart: true },
    ],
    edges: [],
  }
}
