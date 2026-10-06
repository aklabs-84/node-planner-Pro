import { describe, expect, it } from 'vitest'
import { lint } from '../src/core/lint'
import { emptyProject, type PlanEdge, type PlanNode, type Project } from '../src/core/schema'
import { diaryExample } from '../src/examples/diary'

const node = (id: string, type: PlanNode['type'], extra: Partial<PlanNode> = {}): PlanNode => ({
  id, type, x: 0, y: 0, name: id, purpose: `${id} 설명`, ...extra,
})
const edge = (from: string, to: string, kind: PlanEdge['kind'] = 'navigate'): PlanEdge => ({ id: `${from}-${to}`, from, to, kind, label: '' })
const proj = (nodes: PlanNode[], edges: PlanEdge[] = []): Project => ({ version: 1, name: '테스트', goal: '', audience: '', nodes, edges })
const ids = (p: Project) => lint(p).map((i) => i.id)

/** 모든 규칙을 통과하는 기준 프로젝트 */
const clean = (): Project =>
  proj(
    [
      node('home', 'screen', { name: '홈', isStart: true }),
      node('list', 'screen', { name: '목록', hasList: true, emptyState: true }),
      node('db', 'data', { name: '기록', fields: '제목' }),
      node('btn', 'component', { name: '추가 버튼' }),
    ],
    [edge('home', 'list'), edge('list', 'home'), edge('home', 'db', 'save'), edge('db', 'list', 'read'), edge('btn', 'home', 'trigger')],
  )

describe('점검 규칙', () => {
  it('기준 프로젝트는 문제가 없다', () => {
    expect(lint(clean())).toEqual([])
  })

  it('L001 시작 화면이 없거나 둘 이상이면 오류', () => {
    const none = clean()
    none.nodes[0].isStart = false
    expect(lint(none).find((i) => i.id === 'L001')?.severity).toBe('error')
    const two = clean()
    two.nodes[1].isStart = true
    expect(lint(two).find((i) => i.id === 'L001')?.nodeIds).toEqual(['home', 'list'])
    expect(ids(proj([]))).toContain('L001') // 화면이 하나도 없음
    expect(ids(emptyProject())).not.toContain('L001') // 새 프로젝트는 시작 화면이 있다
  })

  it('L002 시작 화면에서 도달할 수 없는 화면은 오류', () => {
    const p = clean()
    p.nodes.push(node('lost', 'screen'))
    p.edges.push(edge('lost', 'home'))
    const hit = lint(p).filter((i) => i.id === 'L002')
    expect(hit.map((i) => i.nodeIds[0])).toEqual(['lost'])
    expect(hit[0].severity).toBe('error')
  })

  it('L003 나가는 이동이 없는 막다른 화면은 경고', () => {
    const p = clean()
    p.edges = p.edges.filter((e) => e.id !== 'list-home')
    expect(lint(p).find((i) => i.id === 'L003')?.nodeIds).toEqual(['list'])
    expect(ids(proj([node('only', 'screen', { isStart: true })]))).not.toContain('L003') // 화면이 하나뿐이면 제외
  })

  it('L004 아무 내용 없는 화면은 경고하고, L011과 겹치지 않는다', () => {
    const p = clean()
    p.nodes.push(node('blank', 'screen', { purpose: '' }))
    p.edges.push(edge('home', 'blank'), edge('blank', 'home'))
    expect(ids(p)).toContain('L004')
    expect(ids(p)).not.toContain('L011')
  })

  it('L005 화면에 이어지지 않은 구성요소·데이터는 경고', () => {
    const p = clean()
    p.nodes.push(node('x', 'component'), node('y', 'data'))
    const hit = lint(p).filter((i) => i.id === 'L005').map((i) => i.nodeIds[0])
    expect(hit).toEqual(['x', 'y'])
  })

  it('L006 읽기만 하고 저장하는 곳이 없는 데이터는 경고', () => {
    const p = clean()
    p.edges = p.edges.filter((e) => e.id !== 'home-db')
    p.edges.push(edge('db', 'home', 'read'))
    expect(lint(p).find((i) => i.id === 'L006')?.nodeIds).toEqual(['db'])
  })

  it('L007 입력이 있는데 저장 연결이 없으면 경고', () => {
    const p = clean()
    p.nodes.push(node('form', 'component', { name: '일기 입력창' }))
    p.edges.push(edge('form', 'list', 'trigger'))
    expect(lint(p).find((i) => i.id === 'L007')?.nodeIds).toEqual(['list', 'form']) // 목록 화면엔 저장 선이 없다
    p.edges.push(edge('list', 'db', 'save'))
    expect(ids(p)).not.toContain('L007')
  })

  it('L008 목록 화면에 비었을 때 안내가 없으면 제안', () => {
    const p = clean()
    p.nodes[1].emptyState = false
    expect(lint(p).find((i) => i.id === 'L008')?.severity).toBe('suggest')
  })

  it('L009 로그인이 필요한데 로그인 화면이 없으면 제안', () => {
    const p = clean()
    p.nodes[0].purpose = '로그인한 사람만 볼 수 있는 홈'
    expect(ids(p)).toContain('L009')
    p.nodes.push(node('login', 'screen', { name: '로그인' }))
    p.edges.push(edge('home', 'login'), edge('login', 'home'))
    expect(ids(p)).not.toContain('L009')
  })

  it('L010 이름이 같은 노드는 제안 (메모는 제외)', () => {
    const p = clean()
    p.nodes.push(node('dup', 'screen', { name: '홈' }), node('m1', 'note', { name: '메모' }), node('m2', 'note', { name: '메모' }))
    const hit = lint(p).filter((i) => i.id === 'L010')
    expect(hit).toHaveLength(1)
    expect(hit[0].nodeIds).toEqual(['home', 'dup'])
  })

  it('L011 목적이 비어 있는 화면은 제안', () => {
    const p = clean()
    p.nodes[1].purpose = ''
    expect(lint(p).find((i) => i.id === 'L011')?.nodeIds).toEqual(['list'])
  })
})

describe('점검 결과 정리', () => {
  it('오류 → 경고 → 제안 순으로 정렬한다', () => {
    const order = lint(diaryExample).map((i) => i.severity)
    expect(order).toEqual([...order].sort((a, b) => ['error', 'warn', 'suggest'].indexOf(a) - ['error', 'warn', 'suggest'].indexOf(b)))
  })

  it('결함 있는 일기장 예시에서 기대한 문제를 찾는다', () => {
    const found = lint(diaryExample).map((i) => `${i.id}:${i.nodeIds[0]}`)
    expect(found).toContain('L002:set') // 설정 화면은 들어가는 길이 없다
    expect(found).toContain('L008:list') // 목록이 비었을 때 안내 없음
    expect(found).toContain('L011:list') // 목록 목적이 비어 있음
  })

  it('프로젝트를 바꾸지 않는다', () => {
    const before = JSON.stringify(diaryExample)
    lint(diaryExample)
    expect(JSON.stringify(diaryExample)).toBe(before)
  })
})
