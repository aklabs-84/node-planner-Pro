import { describe, expect, it } from 'vitest'
import { compile, TARGETS } from '../src/core/compile'
import { lint } from '../src/core/lint'
import { parseProject } from '../src/core/schema'
import { EXAMPLES } from '../src/examples'

describe('예시 프로젝트', () => {
  it.each(EXAMPLES.map((e) => [e.title, e] as const))('%s: 형식이 올바르고 4개 대상 지시문이 만들어진다', (_t, ex) => {
    expect(parseProject(ex.project).ok).toBe(true)
    for (const t of TARGETS) expect(compile(ex.project, t.id).length).toBeGreaterThan(50)
  })

  it('가게 예시는 점검을 모두 통과한다', () => {
    expect(lint(EXAMPLES.find((e) => e.id === 'shop')!.project)).toEqual([])
  })

  it('할 일 예시는 여러 종류의 문제를 보여준다', () => {
    const found = new Set(lint(EXAMPLES.find((e) => e.id === 'todo')!.project).map((i) => i.id))
    for (const id of ['L002', 'L007', 'L008', 'L009']) expect(found.has(id)).toBe(true)
  })
})
