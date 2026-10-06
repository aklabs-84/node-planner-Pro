import { describe, expect, it } from 'vitest'
import { autoLayout, NODE_W } from '../src/core/layout'
import { diaryExample } from '../src/examples/diary'

describe('자동 정리', () => {
  const pos = autoLayout(diaryExample)

  it('모든 노드에 위치를 준다', () => {
    expect(Object.keys(pos).sort()).toEqual(diaryExample.nodes.map((n) => n.id).sort())
  })

  it('시작 화면이 가장 왼쪽에 놓인다', () => {
    const start = diaryExample.nodes.find((n) => n.isStart)!
    const minX = Math.min(...Object.values(pos).map((p) => p.x))
    expect(pos[start.id].x).toBe(minX)
  })

  it('같은 줄(세로 겹침)에서 노드끼리 겹치지 않는다', () => {
    const list = Object.values(pos)
    for (let i = 0; i < list.length; i++)
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i]
        const b = list[j]
        const sameCol = Math.abs(a.x - b.x) < NODE_W
        if (sameCol) expect(Math.abs(a.y - b.y)).toBeGreaterThanOrEqual(88)
      }
  })

  it('되돌아가는 선이 있어도 계산이 끝난다', () => {
    const loop = { ...diaryExample, edges: [...diaryExample.edges, { id: 'x', from: 'list', to: 'home', kind: 'navigate' as const, label: '뒤로' }] }
    expect(Object.keys(autoLayout(loop)).length).toBe(loop.nodes.length)
  })

  it('프로젝트를 바꾸지 않는다', () => {
    const before = JSON.stringify(diaryExample)
    autoLayout(diaryExample)
    expect(JSON.stringify(diaryExample)).toBe(before)
  })
})
