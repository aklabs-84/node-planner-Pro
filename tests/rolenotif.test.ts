import { describe, expect, it } from 'vitest'
import { compile, TARGETS, type TargetId } from '../src/core/compile'
import { buildIr } from '../src/core/ir'
import { lint } from '../src/core/lint'
import { parseProject, type PlanEdge, type PlanNode, type Project } from '../src/core/schema'
import { useProject } from '../src/store/project'

const node = (id: string, type: PlanNode['type'], extra: Partial<PlanNode> = {}): PlanNode => ({ id, type, x: 0, y: 0, name: id, purpose: `${id} 설명`, ...extra })
const edge = (from: string, to: string, kind: PlanEdge['kind']): PlanEdge => ({ id: `${from}-${to}`, from, to, kind, label: '' })
const base = (): Project => ({
  version: 1, name: '모임', goal: '모임 관리', audience: '회원',
  nodes: [
    node('home', 'screen', { name: '홈', isStart: true }),
    node('admin', 'screen', { name: '관리 화면' }),
    node('boss', 'role', { name: '관리자' }),
    node('bell', 'notification', { name: '공지 알림', purpose: '새 공지가 올라오면 푸시' }),
  ],
  edges: [edge('home', 'admin', 'navigate'), edge('admin', 'home', 'navigate'), edge('boss', 'admin', 'permit'), edge('admin', 'bell', 'trigger'), edge('bell', 'home', 'navigate')],
})

describe('역할·알림 노드', () => {
  it('새 노드와 선 종류를 파일에서 읽는다', () => {
    expect(parseProject(JSON.parse(JSON.stringify(base()))).ok).toBe(true)
  })

  it('IR에 역할과 알림이 정리된다', () => {
    const ir = buildIr(base())
    expect(ir.roles).toEqual([{ name: '관리자', purpose: 'boss 설명', screens: ['관리 화면'] }])
    expect(ir.notifications[0]).toMatchObject({ name: '공지 알림', sentBy: ['관리 화면'], opens: ['홈'] })
    expect(ir.screens[1].roles).toEqual(['관리자'])
    expect(ir.acceptance.some((a) => a.includes('관리자만 열 수 있고'))).toBe(true)
  })

  it.each(TARGETS.map((t) => t.id as TargetId))('%s 지시문에 역할과 알림이 들어간다', (t) => {
    const out = compile(base(), t)
    expect(out).toContain('관리자')
    expect(out).toContain('공지 알림')
  })

  it('역할·알림이 연결되지 않으면 점검이 알려 준다', () => {
    const p = base()
    p.nodes.push(node('guest', 'role', { name: '손님' }), node('x', 'notification', { name: '빈 알림', purpose: '' }))
    const issues = lint(p)
    expect(issues.some((i) => i.id === 'L012' && i.nodeIds[0] === 'guest')).toBe(true)
    expect(issues.filter((i) => i.id === 'L013' && i.nodeIds[0] === 'x')).toHaveLength(2)
    expect(lint(base()).some((i) => i.id === 'L012' || i.id === 'L013')).toBe(false)
  })

  it('역할·알림에 선을 이으면 기본 선 종류가 맞게 정해진다', () => {
    const st = useProject.getState()
    st.setProject(base())
    st.addEdge('boss', 'home')
    st.addEdge('home', 'bell')
    const es = useProject.getState().project.edges
    expect(es.find((e) => e.id !== 'boss-admin' && e.from === 'boss')?.kind).toBe('permit')
    expect(es.find((e) => e.from === 'home' && e.to === 'bell')?.kind).toBe('trigger')
  })
})
