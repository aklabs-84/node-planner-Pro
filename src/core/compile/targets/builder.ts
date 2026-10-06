import type { Ir } from '../../ir'
import { acceptanceSection, dataSection, designSection, dontSection, externalsSection, notificationsSection, rolesSection, h, join, screensSection, securitySection, unresolvedSection } from '../common'

/** 범용 AI 빌더(Lovable·Bolt·v0): 화면 중심, 한 번에 붙여넣는 한 덩어리. */
export function compileBuilder(ir: Ir): string {
  return join([
    `${ir.name}${ir.goal ? ` — ${ir.goal}` : ''}. 아래 화면 구성 그대로 한 번에 만들어 주세요.`,
    h('누가 쓰나요', ir.audience),
    h('디자인 (모든 화면에 똑같이 적용)', designSection(ir, 'short')),
    h('화면 구성', screensSection(ir)),
    h('저장되는 데이터', ir.data.length ? dataSection(ir) : ''),
    h('외부 연동', externalsSection(ir)),
    h('역할과 권한', rolesSection(ir)),
    h('알림', notificationsSection(ir)),
    h('이렇게 동작해야 해요', acceptanceSection(ir)),
    h('보안', securitySection()),
    h('지켜 주세요', dontSection(ir)),
    h('정해지지 않은 부분 (임의로 정하지 말고 먼저 물어봐 주세요)', unresolvedSection(ir)),
  ])
}
