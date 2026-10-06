import type { Ir } from '../../ir'
import { acceptanceSection, bullets, dataSection, designSection, externalsSection, notificationsSection, rolesSection, h, join, screensSection, unresolvedSection } from '../common'

/** Markdown 기획서: 사람이 읽는 문서(공유·PDF용). AI용 규칙 대신 설명 중심. */
export function compileMarkdown(ir: Ir): string {
  return join([
    `# ${ir.name} 기획서`,
    h('1. 만들려는 것', [ir.goal || '(미정)', ir.audience ? `\n쓰는 사람: ${ir.audience}` : ''].join('')),
    h('디자인 방향', designSection(ir, 'short')),
    h('2. 화면 목록', screensSection(ir)),
    h('3. 화면 이동', ir.screens.some((s) => s.goesTo.length) ? bullets(ir.screens.flatMap((s) => s.goesTo.map((l) => `${s.name} → ${l.toName}${l.label ? ` (${l.label})` : ''}`))) : ''),
    h('4. 저장하는 정보', ir.data.length ? dataSection(ir) : ''),
    h('5. 외부 서비스', externalsSection(ir)),
    h('6. 역할과 권한', rolesSection(ir)),
    h('7. 알림', notificationsSection(ir)),
    h('8. 완성 기준', acceptanceSection(ir)),
    h('9. 메모', ir.notes.length ? bullets(ir.notes) : ''),
    h('10. 더 정해야 할 것', unresolvedSection(ir)),
  ])
}
