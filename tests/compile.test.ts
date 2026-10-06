import { describe, expect, it } from 'vitest'
import { compile, TARGETS, type TargetId } from '../src/core/compile'
import { buildIr } from '../src/core/ir'
import { emptyProject, type Project } from '../src/core/schema'
import { diaryExample } from '../src/examples/diary'

/** 모든 것이 갖춰진 프로젝트: 미정인 부분이 없어야 한다 */
const shop: Project = {
  version: 1,
  name: '작은 가게',
  goal: '물건을 보고 장바구니에 담는 앱',
  audience: '동네 주민',
  nodes: [
    { id: 'a', type: 'screen', x: 0, y: 0, name: '상품 목록', purpose: '상품을 보여줌', isStart: true, hasList: true, emptyState: true },
    { id: 'b', type: 'screen', x: 0, y: 0, name: '장바구니', purpose: '담은 상품 확인' },
    { id: 'c', type: 'data', x: 0, y: 0, name: '장바구니 기록', purpose: '담은 상품', fields: '상품명, 개수' },
    { id: 'd', type: 'component', x: 0, y: 0, name: '담기 버튼', purpose: '상품을 담음' },
    { id: 'e', type: 'external', x: 0, y: 0, name: '결제 서비스', purpose: '결제 처리' },
    { id: 'f', type: 'note', x: 0, y: 0, name: '메모', purpose: '가격은 원 단위' },
  ],
  edges: [
    { id: '1', from: 'a', to: 'b', kind: 'navigate', label: '장바구니 보기' },
    { id: '2', from: 'b', to: 'a', kind: 'navigate', label: '뒤로' },
    { id: '3', from: 'a', to: 'c', kind: 'save', label: '저장' },
    { id: '4', from: 'c', to: 'b', kind: 'read', label: '읽기' },
    { id: '5', from: 'd', to: 'a', kind: 'trigger', label: '실행' },
    { id: '6', from: 'b', to: 'e', kind: 'trigger', label: '실행' },
  ],
}

const projects: [string, Project][] = [
  ['일기장 예시', diaryExample],
  ['빈 프로젝트', emptyProject()],
  ['작은 가게', shop],
]

describe('IR', () => {
  it('화면별 이동·저장·읽기를 정리한다', () => {
    const ir = buildIr(diaryExample)
    const write = ir.screens.find((s) => s.name === '일기 쓰기')!
    expect(write.writes).toEqual(['일기 저장소'])
    expect(write.goesTo.map((l) => l.toName)).toEqual(['일기 목록'])
    const list = ir.screens.find((s) => s.name === '일기 목록')!
    expect(list.reads).toEqual(['일기 저장소'])
    expect(ir.data[0].fields).toEqual(['제목', '내용', '날짜'])
  })

  it('구성요소·외부 연동·메모를 해당 화면/목록에 붙인다', () => {
    const ir = buildIr(shop)
    expect(ir.screens[0].components.map((c) => c.name)).toEqual(['담기 버튼'])
    expect(ir.screens[1].externals).toEqual(['결제 서비스'])
    expect(ir.notes).toEqual(['메모: 가격은 원 단위'])
  })

  it('확인 기준을 "~하면 ~된다" 문장으로 만든다', () => {
    const ir = buildIr(shop)
    expect(ir.acceptance).toContain("'상품 목록'에서 \"장바구니 보기\" 하면 '장바구니' 화면이 열린다.")
    expect(ir.acceptance).toContain("'장바구니'에서 뒤로 가면 '상품 목록' 화면이 열린다.")
    expect(ir.acceptance.some((a) => a.includes('목록이 비어 있으면'))).toBe(true)
  })

  it('미정인 부분을 찾아낸다', () => {
    const text = buildIr(diaryExample).unresolved.join('\n')
    expect(text).toContain("'일기 목록' 화면이 무엇을 하는지") // 목적이 비어 있음
    expect(text).toContain("'일기 목록' 목록이 비어 있을 때") // 빈 상태 안내 없음
    expect(text).toContain("'설정' 화면으로 들어가는 길이 없습니다") // 도달 불가
  })

  it('다 갖춰진 프로젝트는 미정이 없다', () => {
    expect(buildIr(shop).unresolved).toEqual([])
  })

  it('점검 규칙(L003 등) 결과도 미정 목록에 들어간다', () => {
    const p = structuredClone(shop)
    p.edges = p.edges.filter((e) => e.id !== '2') // 장바구니에서 나가는 길 제거 → 막다른 화면
    expect(buildIr(p).unresolved.join('\n')).toContain('"장바구니"은 막다른 화면')
  })

  it('프로젝트를 바꾸지 않는다', () => {
    const before = JSON.stringify(diaryExample)
    buildIr(diaryExample)
    expect(JSON.stringify(diaryExample)).toBe(before)
  })
})

describe.each(TARGETS.map((t) => t.id as TargetId))('컴파일 대상: %s', (target) => {
  it.each(projects)('%s에서 지시문을 만든다', (_name, project) => {
    const text = compile(project, target)
    expect(text.length).toBeGreaterThan(50)
    expect(text).toContain(project.name)
    expect(text).not.toContain('undefined')
    expect(text).not.toContain('[object Object]')
  })

  it('미정인 부분이 있으면 지시문에 적는다', () => {
    expect(compile(diaryExample, target)).toContain('일기 목록')
    expect(compile(diaryExample, target)).toContain('들어가는 길이 없습니다')
  })

  it('미정이 없으면 "정해지지 않은" 섹션이 없다', () => {
    expect(compile(shop, target)).not.toContain('정해지지 않은')
    expect(compile(shop, target)).not.toContain('더 정해야')
  })
})

describe('대상별 특징', () => {
  it('AI 도구용 지시문에는 보안 지침이 들어간다', () => {
    for (const t of ['claude', 'builder', 'chat'] as const) expect(compile(shop, t)).toContain('API 키')
  })

  it('Claude Code용에는 구현 순서와 확인 기준이 있다', () => {
    const t = compile(shop, 'claude')
    expect(t).toContain('## 구현 순서')
    expect(t).toContain('1. 프로젝트 뼈대')
    expect(t).toContain('[ ] ')
  })

  it('채팅용은 먼저 질문하도록 시킨다', () => {
    expect(compile(shop, 'chat')).toContain('질문')
  })

  it('Markdown 기획서에는 AI용 보안 지침이 없다', () => {
    expect(compile(shop, 'markdown')).not.toContain('API 키')
  })
})
