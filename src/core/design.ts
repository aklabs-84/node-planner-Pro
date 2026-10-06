/** 디자인 = 레이아웃(구조) 9종 × 색 테마(분위기) 5종. 미리보기와 지시문이 같은 정의를 쓴다. */

export const LAYOUT_IDS = ['tabs', 'feed', 'appbar', 'editorial', 'dashboard', 'big', 'chat', 'map', 'swipe'] as const
export type LayoutId = (typeof LAYOUT_IDS)[number]

export const THEME_IDS = ['clean', 'note', 'dark', 'pop', 'class'] as const
export type ThemeId = (typeof THEME_IDS)[number]

export interface Design {
  layout: LayoutId
  theme: ThemeId
}

export const DEFAULT_DESIGN: Design = { layout: 'tabs', theme: 'clean' }

export const LAYOUTS: Record<LayoutId, { label: string; fits: string; spec: string; extra?: string }> = {
  tabs: {
    label: '기본 탭 + 카드형',
    fits: '대부분의 앱',
    spec: '상단에 화면 제목 바, 가운데에 카드를 위에서 아래로 쌓고, 하단에 탭 메뉴(홈·주요 화면 3개 이내). 주요 행동 버튼은 화면 아래쪽 한 개만 강조한다.',
  },
  feed: {
    label: '카드 피드형',
    fits: '쇼핑·갤러리처럼 사진과 목록을 훑는 앱',
    spec: '상단에 검색창, 가운데에 사진이 있는 카드를 2열 격자로 배치, 하단에는 화면 아래에 떠 있는 알약 모양 메뉴(아이콘 4개 이내).',
  },
  appbar: {
    label: '앱바 + 리스트형',
    fits: '목록 관리·할 일처럼 항목을 쭉 보는 앱',
    spec: '상단 앱바에 햄버거 메뉴·제목·검색 아이콘, 가운데는 왼쪽 원형 아이콘 + 제목/보조 글 + 오른쪽 화살표가 있는 목록 행, 오른쪽 아래에 새로 만들기용 둥근 사각 버튼(FAB) 하나.',
  },
  editorial: {
    label: '에디토리얼형',
    fits: '일기·글 읽기처럼 글이 중심인 앱',
    spec: '큰 제목과 작은 영문 라벨로 시작하고, 아이콘 없이 글자와 가는 선(구분선)만으로 목록을 만든다. 하단 메뉴는 글자 링크만 쓴다. 여백을 넉넉하게 둔다.',
  },
  dashboard: {
    label: '대시보드 홈형',
    fits: '기능이 여러 개인 앱의 첫 화면',
    spec: '상단에 인사말, 그 아래 핵심 숫자를 보여주는 요약 카드 하나, 그 아래 아이콘이 있는 메뉴 4개 격자, 마지막에 최근/인기 항목 목록.',
  },
  big: {
    label: '큰 글씨·큰 버튼형',
    fits: '어린이·어르신처럼 누르기 쉬워야 하는 앱',
    spec: '위쪽에 알약 모양 탭 전환(2~3개), 본문은 큰 글씨(16px 이상)의 굵은 테두리 항목, 가장 중요한 행동은 화면 맨 아래에 꽉 찬 큰 버튼 하나. 누르는 영역은 최소 48px.',
  },
  chat: {
    label: '대화형',
    fits: 'AI 챗봇·상담처럼 주고받는 앱',
    spec: '상단에 뒤로가기·프로필·이름, 가운데는 말풍선(상대는 왼쪽, 나는 오른쪽 강조색), 하단에 메시지 입력창과 보내기 아이콘. 선택지는 말풍선 안의 알약 버튼으로 보여준다.',
  },
  map: {
    label: '지도·위치 중심형',
    fits: '동네 가게·맛집·산책 코스처럼 장소가 중심인 앱',
    spec: '화면 전체를 지도로 쓰고, 장소마다 핀을 찍는다. 위에 검색창, 오른쪽에 내 위치 버튼, 아래에서 올라오는 정보 시트(장소 이름·거리·한 줄 설명·주요 버튼).',
    extra: '지도 서비스(예: 카카오맵, 네이버지도, OpenStreetMap)는 정해지지 않았다. 구현 전에 어떤 걸 쓸지 먼저 질문한다. 내 위치를 쓸 때는 사용자가 허용한 경우에만 사용하고, 위치 정보는 필요한 만큼만 저장한다.',
  },
  swipe: {
    label: '카드 넘기기(스와이프)형',
    fits: '퀴즈·단어장·취향 고르기처럼 한 장씩 보는 앱',
    spec: '위쪽에 진행 막대와 "2 / 4" 같은 진행 숫자, 가운데에 카드 한 장을 크게 보여주고 뒤에 다음 카드가 살짝 겹쳐 보이게 한다. 아래에 ✕(넘기기)와 선택 버튼 두 개.',
    extra: '스와이프 동작만 쓰지 말고, 같은 일을 하는 버튼도 반드시 함께 둔다(손가락 조작이 어려운 사용자를 위해).',
  },
}

export const THEMES: Record<
  ThemeId,
  {
    label: string
    mood: string
    fits: string
    /** 미리보기와 지시문이 함께 쓰는 값 */
    colors: { bg: string; surface: string; ink: string; muted: string; accent: string; onAccent: string; line: string; header: string; headerInk: string; soft: string }
    radius: number
    border: number
    font: 'sans' | 'serif'
  }
> = {
  clean: {
    label: '깔끔 기본',
    mood: '정돈되고 가벼운 느낌. 흰 바탕에 보라색 포인트',
    fits: '대부분의 앱',
    colors: { bg: '#F7F8FC', surface: '#FFFFFF', ink: '#1B1D2A', muted: '#8A8FA8', accent: '#4F46E5', onAccent: '#FFFFFF', line: '#E3E5F0', header: '#FFFFFF', headerInk: '#1B1D2A', soft: '#EEF0FF' },
    radius: 12,
    border: 1,
    font: 'sans',
  },
  note: {
    label: '따뜻한 노트',
    mood: '종이 노트처럼 포근하고 차분한 느낌. 크림색 바탕에 테라코타 포인트',
    fits: '일기·기록 앱',
    colors: { bg: '#FBF5E9', surface: '#FFFBF2', ink: '#3B2F25', muted: '#9A8870', accent: '#C2603A', onAccent: '#FFFFFF', line: '#E8DAC2', header: '#F3E7CF', headerInk: '#3B2F25', soft: '#F6DFD3' },
    radius: 16,
    border: 1,
    font: 'serif',
  },
  dark: {
    label: '다크',
    mood: '눈이 편한 어두운 화면. 연한 보라 포인트',
    fits: '도구·유틸 앱, 밤에 쓰는 앱',
    colors: { bg: '#0F1115', surface: '#1A1D26', ink: '#E8EAF2', muted: '#7B8199', accent: '#8B9CFF', onAccent: '#0F1115', line: '#2A2E3A', header: '#161922', headerInk: '#E8EAF2', soft: '#262B3D' },
    radius: 12,
    border: 1,
    font: 'sans',
  },
  pop: {
    label: '팝',
    mood: '굵은 검정 테두리와 쨍한 색의 발랄한 느낌. 핑크·민트·노랑',
    fits: '게임·청소년 앱',
    colors: { bg: '#FFF1C9', surface: '#FFFFFF', ink: '#111111', muted: '#555555', accent: '#FF5C8A', onAccent: '#111111', line: '#111111', header: '#7CE3C4', headerInk: '#111111', soft: '#FFD6E3' },
    radius: 8,
    border: 2,
    font: 'sans',
  },
  class: {
    label: '교실풍',
    mood: '칠판 초록과 노랑의 친근한 학습 느낌',
    fits: '수업·학습 앱',
    colors: { bg: '#F1F7EE', surface: '#FFFFFF', ink: '#1F3B2D', muted: '#7C9484', accent: '#F2A93B', onAccent: '#3A2A06', line: '#CFE0C8', header: '#2F6B4F', headerInk: '#FFFFFF', soft: '#FCEBCB' },
    radius: 8,
    border: 1,
    font: 'sans',
  },
}

const isLayout = (v: unknown): v is LayoutId => LAYOUT_IDS.includes(v as LayoutId)
const isTheme = (v: unknown): v is ThemeId => THEME_IDS.includes(v as ThemeId)

/** 옛 프로젝트나 값이 잘못된 경우에도 항상 쓸 수 있는 디자인을 돌려준다. */
export function resolveDesign(d?: Partial<Design> | null): Design {
  return {
    layout: isLayout(d?.layout) ? d.layout : DEFAULT_DESIGN.layout,
    theme: isTheme(d?.theme) ? d.theme : DEFAULT_DESIGN.theme,
  }
}

/** 미리보기용 CSS 변수 묶음 */
export function themeVars(theme: ThemeId): Record<string, string> {
  const t = THEMES[theme]
  const c = t.colors
  return {
    '--bg': c.bg,
    '--sf': c.surface,
    '--ink': c.ink,
    '--mu': c.muted,
    '--ac': c.accent,
    '--on': c.onAccent,
    '--ln': c.line,
    '--hd': c.header,
    '--hc': c.headerInk,
    '--as': c.soft,
    '--r': `${t.radius}px`,
    '--bw': `${t.border}px`,
  }
}

export type DesignDetail = 'full' | 'short'

/** 지시문에 들어가는 "디자인" 섹션 본문. full=코딩 도구용(CSS 변수 포함), short=채팅·빌더·문서용 */
export function designText(design: Design | undefined, detail: DesignDetail): string {
  const d = resolveDesign(design)
  const l = LAYOUTS[d.layout]
  const t = THEMES[d.theme]
  const c = t.colors
  const font = t.font === 'serif' ? '명조(세리프) 계열 글꼴로 제목과 본문을 모두 부드럽게' : '고딕(산세리프) 계열 글꼴'
  const lines = [
    `- 레이아웃: ${l.label} — ${l.spec}`,
    `- 분위기: ${t.label} — ${t.mood}`,
    `- 색상: 배경 ${c.bg}, 카드 ${c.surface}, 글자 ${c.ink}, 보조 글자 ${c.muted}, 강조색 ${c.accent}(그 위의 글자 ${c.onAccent}), 구분선 ${c.line}`,
    `- 모양: 모서리 둥글기 ${t.radius}px, 테두리 ${t.border}px, ${font}`,
  ]
  if (l.extra) lines.push(`- 주의: ${l.extra}`)
  if (detail === 'short') return [...lines, '- 이 디자인을 모든 화면에 똑같이 적용하고, 임의로 다른 스타일을 섞지 않는다.'].join('\n')
  const css = [
    ':root {',
    `  --bg: ${c.bg}; --surface: ${c.surface}; --ink: ${c.ink}; --muted: ${c.muted};`,
    `  --accent: ${c.accent}; --on-accent: ${c.onAccent}; --line: ${c.line};`,
    `  --header: ${c.header}; --header-ink: ${c.headerInk}; --soft: ${c.soft};`,
    `  --radius: ${t.radius}px; --border: ${t.border}px;`,
    '}',
  ].join('\n')
  return [
    ...lines,
    '- 위 값은 CSS 변수로 한 곳에 모아 두고, 화면 코드에서는 색을 직접 쓰지 말고 이 변수만 쓴다:',
    '```css',
    css,
    '```',
    '- 이 디자인을 모든 화면에 똑같이 적용하고, 임의로 다른 스타일을 섞지 않는다.',
  ].join('\n')
}
