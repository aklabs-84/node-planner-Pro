import { resolveDesign, type Design } from './design.js'
import { lint } from './lint/index.js'
import type { PlanEdge, PlanNode, Project } from './schema.js'

/** 화면 사이의 한 번의 이동 */
export interface IrLink {
  to: string
  toName: string
  label: string
}

export interface IrScreen {
  id: string
  name: string
  purpose: string
  isStart: boolean
  hasList: boolean
  emptyState: boolean
  /** 이 화면에 연결된 구성요소 이름 */
  components: { name: string; purpose: string }[]
  /** 이 화면에서 나가는 이동 */
  goesTo: IrLink[]
  /** 이 화면이 저장하는 데이터 이름 */
  writes: string[]
  /** 이 화면이 읽어 보여주는 데이터 이름 */
  reads: string[]
  /** 이 화면과 연결된 외부 서비스 이름 */
  externals: string[]
  /** 이 화면에서 확인해야 하는 조건 */
  conditions: { name: string; purpose: string }[]
  /** 이 화면을 쓸 수 있는 역할 이름 */
  roles: string[]
  /** 이 화면과 이어진 알림 이름 */
  notifies: string[]
}

export interface IrData {
  name: string
  purpose: string
  fields: string[]
  writtenBy: string[]
  readBy: string[]
}

export interface IrRole {
  name: string
  purpose: string
  /** 이 역할이 쓸 수 있는 화면 이름 */
  screens: string[]
}

export interface IrNotification {
  name: string
  purpose: string
  /** 이 알림이 보내지는 계기가 되는 화면(화면 → 알림) */
  sentBy: string[]
  /** 알림을 누르면 열리는 화면(알림 → 화면) */
  opens: string[]
}

export interface Ir {
  design: Design
  name: string
  goal: string
  audience: string
  screens: IrScreen[]
  data: IrData[]
  externals: { name: string; purpose: string }[]
  roles: IrRole[]
  notifications: IrNotification[]
  notes: string[]
  /** "~하면 ~된다" 형태의 확인 기준 */
  acceptance: string[]
  /** 아직 정해지지 않아 AI가 추측하게 될 부분 */
  unresolved: string[]
}

const nameOf = (n: PlanNode) => n.name.trim() || '(이름 없음)'
const splitFields = (s?: string) =>
  (s ?? '')
    .split(/[,，、\n]/)
    .map((x) => x.trim())
    .filter(Boolean)

const uniq = <T>(a: T[]) => [...new Set(a)]

/** 그래프를 AI 도구별 지시문이 공통으로 쓰는 정리된 명세로 바꾼다. 프로젝트는 바꾸지 않는다. */
export function buildIr(project: Project): Ir {
  const byId = new Map(project.nodes.map((n) => [n.id, n]))
  const other = (e: PlanEdge, id: string) => byId.get(e.from === id ? e.to : e.from)

  const screens: IrScreen[] = project.nodes
    .filter((n) => n.type === 'screen')
    .map((s) => {
      const touching = project.edges.filter((e) => e.from === s.id || e.to === s.id)
      const neighbors = (type: PlanNode['type']) =>
        touching.map((e) => ({ e, n: other(e, s.id) })).filter((x): x is { e: PlanEdge; n: PlanNode } => x.n?.type === type)

      return {
        id: s.id,
        name: nameOf(s),
        purpose: s.purpose.trim(),
        isStart: !!s.isStart,
        hasList: !!s.hasList,
        emptyState: !!s.emptyState,
        components: neighbors('component').map(({ n }) => ({ name: nameOf(n), purpose: n.purpose.trim() })),
        goesTo: project.edges
          .filter((e) => e.from === s.id && byId.get(e.to)?.type === 'screen')
          .map((e) => ({ to: e.to, toName: nameOf(byId.get(e.to)!), label: e.label.trim() })),
        // 저장: 화면 → 데이터. 읽기: 데이터 → 화면, 또는 "읽기" 선으로 이은 화면 → 데이터
        writes: uniq(neighbors('data').filter(({ e }) => e.from === s.id && e.kind !== 'read').map(({ n }) => nameOf(n))),
        reads: uniq(neighbors('data').filter(({ e }) => e.to === s.id || e.kind === 'read').map(({ n }) => nameOf(n))),
        externals: uniq(neighbors('external').map(({ n }) => nameOf(n))),
        conditions: neighbors('logic').map(({ n }) => ({ name: nameOf(n), purpose: n.purpose.trim() })),
        roles: uniq(neighbors('role').map(({ n }) => nameOf(n))),
        notifies: uniq(neighbors('notification').map(({ n }) => nameOf(n))),
      }
    })

  const screenName = (id: string) => nameOf(byId.get(id)!)

  const data: IrData[] = project.nodes
    .filter((n) => n.type === 'data')
    .map((d) => {
      const edges = project.edges.filter((e) => e.from === d.id || e.to === d.id)
      const screensOf = (pred: (e: PlanEdge) => boolean) =>
        uniq(
          edges
            .filter(pred)
            .map((e) => (e.from === d.id ? e.to : e.from))
            .filter((id) => byId.get(id)?.type === 'screen')
            .map(screenName),
        )
      return {
        name: nameOf(d),
        purpose: d.purpose.trim(),
        fields: splitFields(d.fields),
        writtenBy: screensOf((e) => e.to === d.id && e.kind !== 'read'),
        readBy: screensOf((e) => e.from === d.id || e.kind === 'read'),
      }
    })

  const externals = project.nodes.filter((n) => n.type === 'external').map((n) => ({ name: nameOf(n), purpose: n.purpose.trim() }))
  const linkedScreens = (id: string, pred: (e: PlanEdge) => boolean) =>
    uniq(
      project.edges
        .filter((e) => (e.from === id || e.to === id) && pred(e))
        .map((e) => e.from === id ? e.to : e.from)
        .filter((x) => byId.get(x)?.type === 'screen')
        .map(screenName),
    )
  const roles: IrRole[] = project.nodes
    .filter((n) => n.type === 'role')
    .map((n) => ({ name: nameOf(n), purpose: n.purpose.trim(), screens: linkedScreens(n.id, () => true) }))
  const notifications: IrNotification[] = project.nodes
    .filter((n) => n.type === 'notification')
    .map((n) => ({
      name: nameOf(n),
      purpose: n.purpose.trim(),
      sentBy: linkedScreens(n.id, (e) => e.to === n.id),
      opens: linkedScreens(n.id, (e) => e.from === n.id),
    }))
  const notes = project.nodes.filter((n) => n.type === 'note').map((n) => [nameOf(n), n.purpose.trim()].filter(Boolean).join(': '))

  const ir: Ir = {
    design: resolveDesign(project.design),
    name: project.name.trim(),
    goal: project.goal.trim(),
    audience: project.audience.trim(),
    screens,
    data,
    externals,
    roles,
    notifications,
    notes,
    acceptance: [],
    unresolved: [],
  }
  ir.acceptance = buildAcceptance(ir)
  ir.unresolved = findOpenQuestions(project, ir)
  return ir
}

function buildAcceptance(ir: Ir): string[] {
  const out: string[] = []
  for (const s of ir.screens) {
    for (const l of s.goesTo) {
      const how = l.label && !['이동', '뒤로'].includes(l.label) ? `"${l.label}" 하면` : l.label === '뒤로' ? '뒤로 가면' : '이동하면'
      out.push(`'${s.name}'에서 ${how} '${l.toName}' 화면이 열린다.`)
    }
    for (const d of s.writes) out.push(`'${s.name}'에서 저장하면 '${d}'에 내용이 저장되고, 새로고침해도 남아 있다.`)
    for (const d of s.reads) out.push(`'${s.name}'을(를) 열면 '${d}'에 저장된 내용을 읽어 보여준다.`)
    if (s.roles.length && ir.roles.length) out.push(`'${s.name}'은(는) ${s.roles.join(', ')}만 열 수 있고, 다른 사용자가 열려고 하면 막는다.`)
    if (s.hasList && s.emptyState) out.push(`'${s.name}'의 목록이 비어 있으면 안내 문구를 보여준다.`)
  }
  return out
}

/**
 * 아직 정해지지 않은 부분을 모은다. AI가 이 부분을 마음대로 추측하지 않게 지시문 끝에 적는다.
 */
function findOpenQuestions(project: Project, ir: Ir): string[] {
  const out: string[] = []
  const starts = project.nodes.filter((n) => n.type === 'screen' && n.isStart)
  if (ir.screens.length === 0) out.push('화면이 하나도 없습니다. 어떤 화면이 필요한지 먼저 물어봐 주세요.')
  else if (starts.length === 0) out.push('시작 화면이 정해지지 않았습니다. 처음 보일 화면을 먼저 물어봐 주세요.')
  else if (starts.length > 1) out.push(`시작 화면이 ${starts.length}개입니다(${starts.map(nameOf).join(', ')}). 하나만 정해 달라고 물어봐 주세요.`)

  for (const s of ir.screens) {
    if (!s.purpose) out.push(`'${s.name}' 화면이 무엇을 하는지 적혀 있지 않습니다. 추측하지 말고 물어봐 주세요.`)
    if (s.hasList && !s.emptyState) out.push(`'${s.name}' 목록이 비어 있을 때 무엇을 보여줄지 정해지지 않았습니다.`)
  }
  for (const d of ir.data) {
    if (d.fields.length === 0) out.push(`'${d.name}'에 어떤 항목을 저장할지 정해지지 않았습니다.`)
  }

  // 시작 화면에서 닿을 수 없는 화면
  if (starts.length === 1) {
    const seen = new Set([starts[0].id])
    const queue = [starts[0].id]
    while (queue.length) {
      const cur = ir.screens.find((s) => s.id === queue.shift())
      for (const l of cur?.goesTo ?? []) if (!seen.has(l.to)) (seen.add(l.to), queue.push(l.to))
    }
    for (const s of ir.screens) if (!seen.has(s.id)) out.push(`'${s.name}' 화면으로 들어가는 길이 없습니다. 어디서 열리는지 물어봐 주세요.`)
  }

  // 위에서 이미 문장으로 다룬 규칙(L001·L002·L008·L011)을 뺀 나머지 점검 결과도 AI가 추측하지 않게 적는다
  const covered = new Set(['L001', 'L002', 'L008', 'L011'])
  for (const i of lint(project)) if (!covered.has(i.id)) out.push(`${i.message}. 임의로 정하지 말고 물어봐 주세요.`)
  return out
}
