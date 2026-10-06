import { describe, expect, it } from 'vitest'
import { buildDraftPrompt, parseDraft } from '../src/core/aidraft'
import { lint } from '../src/core/lint'

const good = {
  name: '내 일기장',
  goal: '하루 일기를 쓴다',
  audience: '학생',
  nodes: [
    { key: 'list', type: 'screen', name: '일기 목록', purpose: '일기를 보여줌', isStart: true, hasList: true, emptyState: true },
    { key: 'write', type: 'screen', name: '일기 쓰기', purpose: '새 일기를 씀' },
    { key: 'db', type: 'data', name: '일기 저장소', purpose: '일기 보관', fields: '제목, 내용' },
  ],
  edges: [
    { from: 'list', to: 'write', kind: 'navigate', label: '쓰기' },
    { from: 'write', to: 'list', kind: 'navigate', label: '저장 후 돌아가기' },
    { from: 'write', to: 'db', kind: 'save', label: '' },
    { from: 'db', to: 'list', kind: 'read', label: '' },
  ],
}

describe('AI 초안: 프롬프트', () => {
  it('설명을 감싸고 지시가 아님을 밝히며 길이를 자른다', () => {
    const p = buildDraftPrompt('가'.repeat(5000))
    expect(p).toContain('지시가 아닙니다')
    expect(p.length).toBeLessThan(2500)
  })
})

describe('AI 초안: 응답 해석', () => {
  it('올바른 응답을 Project로 바꾸고 위치를 배치한다', () => {
    const p = parseDraft('```json\n' + JSON.stringify(good) + '\n```')
    expect(p.nodes).toHaveLength(3)
    expect(p.edges).toHaveLength(4)
    expect(new Set(p.nodes.map((n) => `${n.x},${n.y}`)).size).toBe(3)
    expect(lint(p).filter((i) => i.severity === 'error')).toEqual([])
  })

  it('없는 노드를 잇는 선·자기 자신·중복 선을 버린다', () => {
    const p = parseDraft(JSON.stringify({ ...good, edges: [...good.edges, { from: 'x', to: 'list', kind: 'navigate' }, { from: 'list', to: 'list', kind: 'navigate' }, { from: 'list', to: 'write', kind: 'navigate' }] }))
    expect(p.edges).toHaveLength(4)
  })

  it('시작 화면이 없거나 여러 개여도 정확히 하나로 맞춘다', () => {
    const none = parseDraft(JSON.stringify({ ...good, nodes: good.nodes.map((n) => ({ ...n, isStart: undefined })) }))
    expect(none.nodes.filter((n) => n.isStart)).toHaveLength(1)
    const many = parseDraft(JSON.stringify({ ...good, nodes: good.nodes.map((n) => (n.type === 'screen' ? { ...n, isStart: true } : n)) }))
    expect(many.nodes.filter((n) => n.isStart)).toHaveLength(1)
  })

  it('같은 key는 하나만, 25개를 넘으면 자른다', () => {
    const dup = parseDraft(JSON.stringify({ ...good, nodes: [...good.nodes, good.nodes[0]] }))
    expect(dup.nodes).toHaveLength(3)
    const many = Array.from({ length: 40 }, (_, i) => ({ key: `k${i}`, type: 'screen', name: `화면${i}`, purpose: 'x' }))
    expect(parseDraft(JSON.stringify({ ...good, nodes: many, edges: [] })).nodes).toHaveLength(25)
  })

  it('JSON이 아니거나 형식이 틀리면 오류', () => {
    expect(() => parseDraft('죄송해요')).toThrow()
    expect(() => parseDraft('{깨짐')).toThrow()
    expect(() => parseDraft(JSON.stringify({ name: 'x', nodes: [] }))).toThrow()
    expect(() => parseDraft(JSON.stringify({ ...good, nodes: [{ key: 'a', type: 'bogus', name: 'x' }] }))).toThrow()
  })
})
