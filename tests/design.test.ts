import { describe, expect, it } from 'vitest'
import { compile, TARGETS, type TargetId } from '../src/core/compile'
import { DEFAULT_DESIGN, LAYOUT_IDS, LAYOUTS, THEME_IDS, THEMES, designText, resolveDesign, themeVars } from '../src/core/design'
import { buildIr } from '../src/core/ir'
import { parseProject } from '../src/core/schema'
import { diaryExample } from '../src/examples/diary'

const withDesign = (layout: string, theme: string) => ({ ...structuredClone(diaryExample), design: { layout, theme } })

describe('디자인 정의', () => {
  it('레이아웃 9종, 테마 5종이 모두 정의되어 있다', () => {
    expect(LAYOUT_IDS).toHaveLength(9)
    expect(THEME_IDS).toHaveLength(5)
    for (const id of LAYOUT_IDS) expect(LAYOUTS[id].spec.length).toBeGreaterThan(20)
    for (const id of THEME_IDS) expect(THEMES[id].colors.accent).toMatch(/^#[0-9A-F]{6}$/)
  })

  it('테마마다 미리보기용 CSS 변수가 모두 채워진다', () => {
    for (const id of THEME_IDS) {
      const v = themeVars(id)
      expect(Object.keys(v)).toHaveLength(12)
      expect(Object.values(v).every(Boolean)).toBe(true)
    }
  })

  it('값이 없거나 이상하면 기본 디자인으로 돌아간다', () => {
    expect(resolveDesign(undefined)).toEqual(DEFAULT_DESIGN)
    expect(resolveDesign({ layout: 'nope' as never, theme: 'dark' })).toEqual({ layout: 'tabs', theme: 'dark' })
  })
})

describe('프로젝트 파일의 design', () => {
  it('옛 파일(design 없음)도 열린다', () => {
    const r = parseProject(structuredClone(diaryExample))
    expect(r.ok).toBe(true)
    if (r.ok) expect(buildIr(r.project).design).toEqual(DEFAULT_DESIGN)
  })

  it('저장된 design을 그대로 읽는다', () => {
    const r = parseProject(withDesign('map', 'pop'))
    expect(r.ok && r.project.design).toEqual({ layout: 'map', theme: 'pop' })
  })

  it('이상한 design 값은 파일을 거절하지 않고 기본값으로 바꾼다', () => {
    const r = parseProject(withDesign('???', 'dark'))
    expect(r.ok && r.project.design).toEqual({ layout: 'tabs', theme: 'dark' })
  })
})

describe.each(TARGETS.map((t) => t.id as TargetId))('지시문 디자인 섹션: %s', (target) => {
  it.each(LAYOUT_IDS.flatMap((l) => THEME_IDS.map((t) => [l, t] as const)))('레이아웃 %s × 테마 %s 조합이 들어간다', (l, t) => {
    const text = compile(parseOk(withDesign(l, t)), target)
    expect(text).toContain(LAYOUTS[l].label)
    expect(text).toContain(THEMES[t].label)
    expect(text).toContain(THEMES[t].colors.accent)
    expect(text).not.toContain('undefined')
  })
})

function parseOk(raw: unknown) {
  const r = parseProject(raw)
  if (!r.ok) throw new Error(r.error)
  return r.project
}

describe('도구별 분량', () => {
  it('Claude Code용에만 CSS 변수 예시가 들어간다', () => {
    const p = parseOk(withDesign('tabs', 'dark'))
    expect(compile(p, 'claude')).toContain('--accent: #8B9CFF')
    for (const t of ['builder', 'chat', 'markdown'] as const) expect(compile(p, t)).not.toContain('--accent:')
  })

  it('지도형은 지도 서비스 질문 문구, 스와이프형은 버튼 대체 문구가 들어간다', () => {
    expect(designText({ layout: 'map', theme: 'clean' }, 'short')).toContain('지도 서비스')
    expect(designText({ layout: 'swipe', theme: 'clean' }, 'short')).toContain('버튼도 반드시')
  })

  it('디자인을 안 골라도 기본 디자인이 지시문에 들어간다', () => {
    expect(compile(parseOk(structuredClone(diaryExample)), 'claude')).toContain('기본 탭 + 카드형')
  })
})
