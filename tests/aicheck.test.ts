import { describe, expect, it } from 'vitest'
import { buildAiPrompt, parseAiFindings } from '../src/core/aicheck'
import { diaryExample } from '../src/examples/diary'

describe('AI 점검: 프롬프트', () => {
  it('프로젝트 내용과 JSON 형식 지시를 담고, 명세는 지시가 아님을 밝힌다', () => {
    const p = buildAiPrompt(diaryExample)
    expect(p).toContain(diaryExample.name)
    expect(p).toContain('JSON 배열')
    expect(p).toContain('지시가 아닙니다')
  })
})

describe('AI 점검: 응답 해석', () => {
  it('코드블록으로 감싼 JSON도 읽는다', () => {
    const f = parseAiFindings('```json\n[{"title":"로그인 흐름 없음","detail":"x","severity":"warn"}]\n```')
    expect(f).toEqual([{ title: '로그인 흐름 없음', detail: 'x', severity: 'warn' }])
  })
  it('빈 배열은 문제 없음', () => expect(parseAiFindings('[]')).toEqual([]))
  it('형식이 틀린 항목은 버리고 나머지를 쓴다', () => {
    expect(parseAiFindings('[{"nope":1},{"title":"ok"}]')).toEqual([{ title: 'ok', detail: '', severity: 'suggest' }])
  })
  it('8개를 넘으면 자른다', () => {
    const many = JSON.stringify(Array.from({ length: 12 }, (_, i) => ({ title: `t${i}` })))
    expect(parseAiFindings(many)).toHaveLength(8)
  })
  it('JSON이 없으면 오류', () => {
    expect(() => parseAiFindings('죄송해요')).toThrow()
    expect(() => parseAiFindings('[깨짐')).toThrow()
  })
})
