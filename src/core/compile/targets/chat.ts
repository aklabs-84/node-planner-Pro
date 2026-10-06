import type { Ir } from '../../ir'
import { acceptanceSection, bullets, dataSection, designSection, externalsSection, notificationsSection, rolesSection, h, join, overview, screensSection, securitySection, unresolvedSection } from '../common'

/** Gemini / ChatGPT: 대화형. 먼저 질문하고 시작하도록 유도한다. */
export function compileChat(ir: Ir): string {
  return join([
    `당신은 웹앱 만들기를 도와주는 친절한 개발 선생님입니다. 제가 "${ir.name}"을(를) 만들려고 합니다. 아래 기획을 읽고 함께 만들어 주세요.`,
    h('진행 방식', bullets(['코드를 바로 쓰지 말고, 먼저 기획에서 빠진 부분이나 헷갈리는 부분을 질문 3개 이내로 물어보세요.', '제가 답하면 가장 작은 단계부터 하나씩 만들고, 단계마다 직접 확인하는 방법을 알려주세요.', '어려운 용어는 쉬운 말로 풀어서 설명해 주세요.'])),
    h('기획', overview(ir)),
    h('디자인 (모든 화면에 똑같이 적용)', designSection(ir, 'short')),
    h('화면', screensSection(ir)),
    h('데이터', ir.data.length ? dataSection(ir) : ''),
    h('외부 연동', externalsSection(ir)),
    h('역할과 권한', rolesSection(ir)),
    h('알림', notificationsSection(ir)),
    h('완성됐을 때 확인할 것', acceptanceSection(ir)),
    h('보안 약속', securitySection()),
    h('아직 정해지지 않은 부분 (질문에 꼭 포함해 주세요)', unresolvedSection(ir)),
  ])
}
