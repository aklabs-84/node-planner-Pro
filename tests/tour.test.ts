import { describe, expect, it } from 'vitest'
import { tourOrder } from '../src/core/tour'

const s = (id: string, to: string[], isStart = false) => ({ id, isStart, goesTo: to.map((t) => ({ to: t })) })

describe('tourOrder', () => {
  it('시작 화면부터 폭 우선으로 간다', () => {
    expect(tourOrder([s('c', []), s('a', ['b', 'c'], true), s('b', ['d']), s('d', [])])).toEqual(['a', 'b', 'c', 'd'])
  })
  it('되돌아오는 선이 있어도 한 번씩만 센다', () => {
    expect(tourOrder([s('a', ['b'], true), s('b', ['a'])])).toEqual(['a', 'b'])
  })
  it('닿지 않는 화면은 맨 뒤에 붙인다', () => {
    expect(tourOrder([s('x', ['y']), s('a', [], true), s('y', [])])).toEqual(['a', 'x', 'y'])
  })
  it('화면이 없으면 빈 목록', () => {
    expect(tourOrder([])).toEqual([])
  })
})
