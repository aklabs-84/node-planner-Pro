import { describe, expect, it } from 'vitest'
import { buildSim, reachableFromStart, unvisited } from '../src/core/simulate'
import { emptyProject } from '../src/core/schema'
import { EXAMPLES } from '../src/examples'

const ex = (id: string) => EXAMPLES.find((e) => e.id === id)!.project

describe('클릭 시뮬레이터 계산', () => {
  it('시작 화면을 찾고, 없으면 첫 화면을 쓴다', () => {
    const sim = buildSim(ex('shop'))
    expect(sim.byId.get(sim.startId!)!.name).toBe('상품 목록')
    const p = structuredClone(ex('shop'))
    p.nodes.forEach((n) => delete n.isStart)
    expect(buildSim(p).startId).not.toBeNull()
  })

  it('화면이 없으면 시작 id가 null', () => {
    const p = emptyProject()
    p.nodes = []
    expect(buildSim(p).startId).toBeNull()
  })

  it('완성형 예시는 모든 화면에 닿을 수 있다', () => {
    const sim = buildSim(ex('shop'))
    expect(reachableFromStart(sim).size).toBe(sim.ir.screens.length)
  })

  it('일기장 예시는 닿을 수 없는 화면을 드러낸다', () => {
    const sim = buildSim(ex('diary'))
    const miss = unvisited(sim, reachableFromStart(sim)).map((s) => s.name)
    expect(miss).toContain('설정')
  })

  it('이동 선이 가리키는 화면 id가 실제로 존재한다', () => {
    for (const e of ['diary', 'shop', 'todo']) {
      const sim = buildSim(ex(e))
      for (const s of sim.ir.screens) for (const l of s.goesTo) expect(sim.byId.has(l.to)).toBe(true)
    }
  })
})
