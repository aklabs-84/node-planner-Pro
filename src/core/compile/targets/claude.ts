import type { Ir } from '../../ir'
import { acceptanceSection, bullets, designSection, dataSection, dontSection, externalsSection, notificationsSection, rolesSection, h, join, overview, screensSection, securitySection, unresolvedSection } from '../common'

/** Claude Code / Codex: 파일 구조 제안, 단계별 구현 순서, 확인 방법을 포함한다. */
export function compileClaude(ir: Ir): string {
  const steps = [
    '프로젝트 뼈대를 만들고 실행되는지 확인한다(화면 하나가 뜨면 성공).',
    ...ir.screens.map((s) => `'${s.name}' 화면을 만든다${s.isStart ? ' (가장 먼저, 앱을 열면 이 화면이 보여야 함)' : ''}.`),
    ir.data.length ? `데이터 저장을 붙인다: ${ir.data.map((d) => d.name).join(', ')}.` : '',
    '화면 사이 이동을 연결한다.',
    '아래 "확인 기준"을 하나씩 직접 눌러 보며 확인한다.',
  ].filter(Boolean)

  return join([
    `# ${ir.name} 만들기`,
    ir.unresolved.length ? '아래 명세대로 웹앱을 만들어 주세요. 작업 전에 "아직 정해지지 않은 부분"을 먼저 질문해 주세요.' : '아래 명세대로 웹앱을 만들어 주세요.',
    h('개요', overview(ir)),
    h('기술 조건', bullets(['프론트엔드는 바닐라 HTML/CSS/JS 또는 React + Tailwind 중 가장 단순한 쪽을 고른다.', '저장은 처음엔 브라우저 localStorage로 시작하고, 서버 저장이 필요하면 Supabase를 쓴다.', '기능마다 파일을 나눠 읽기 쉽게 유지한다.'])),
    h('디자인 (모든 화면에 똑같이 적용)', designSection(ir, 'full')),
    h('화면', screensSection(ir)),
    h('데이터', dataSection(ir)),
    h('외부 연동', externalsSection(ir)),
    h('역할과 권한', rolesSection(ir)),
    h('알림', notificationsSection(ir)),
    h('구현 순서', steps.map((s, i) => `${i + 1}. ${s}`).join('\n')),
    h('확인 기준 (끝나면 하나씩 확인)', acceptanceSection(ir)),
    h('보안', securitySection()),
    h('하지 말 것', dontSection(ir)),
    h('아직 정해지지 않은 부분 (추측하지 말고 질문)', unresolvedSection(ir)),
    h('작업 방식', bullets(['변경 전에 계획을 먼저 보여주고 확인을 받는다.', '변경 후에는 직접 확인하는 방법(실행 명령과 눌러볼 순서)을 알려준다.'])),
  ])
}
