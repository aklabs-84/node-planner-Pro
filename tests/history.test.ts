import { beforeEach, describe, expect, it } from 'vitest'
import { emptyProject } from '../src/core/schema'

// 저장소(localStorage)가 없는 환경에서도 스토어가 뜨도록 막아 둔다
const mem: Record<string, string> = {}
;(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => mem[k] ?? null,
  setItem: (k: string, v: string) => void (mem[k] = v),
} as Storage

const { useProject } = await import('../src/store/project')
const st = () => useProject.getState()

describe('되돌리기/다시 실행', () => {
  beforeEach(() => {
    st().setProject(emptyProject())
    useProject.setState({ past: [], future: [] })
  })

  it('노드 추가를 되돌리고 다시 실행한다', () => {
    const n = st().project.nodes.length
    st().addNode('screen', { x: 0, y: 0 })
    expect(st().project.nodes.length).toBe(n + 1)
    st().undo()
    expect(st().project.nodes.length).toBe(n)
    st().redo()
    expect(st().project.nodes.length).toBe(n + 1)
  })

  it('새 변경을 하면 다시 실행 기록이 지워진다', () => {
    st().addNode('screen', { x: 0, y: 0 })
    st().undo()
    st().addNode('data', { x: 0, y: 0 })
    expect(st().future).toEqual([])
  })

  it('같은 노드의 연속된 글자 입력은 한 번에 되돌린다', () => {
    const id = st().project.nodes[0].id
    const before = st().project.nodes[0].name
    for (const name of ['ㅎ', '홈', '홈화', '홈화면']) st().updateNode(id, { name })
    st().undo()
    expect(st().project.nodes[0].name).toBe(before)
  })

  it('기록이 없으면 undo/redo는 아무 일도 안 한다', () => {
    const before = st().project
    st().undo()
    st().redo()
    expect(st().project).toBe(before)
  })

  it('되돌려서 사라진 노드의 선택은 해제된다', () => {
    const id = st().addNode('screen', { x: 0, y: 0 })
    expect(st().selectedId).toBe(id)
    st().undo()
    expect(st().selectedId).toBeNull()
  })
})
