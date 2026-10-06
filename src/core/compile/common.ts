import { designText, type DesignDetail } from '../design.js'
import type { Ir, IrScreen } from '../ir.js'

export const SECURITY_RULES = [
  'API 키·비밀번호·토큰은 화면(프론트엔드) 코드에 절대 쓰지 않는다. 필요하면 서버(프록시)를 거쳐 호출한다.',
  '데이터베이스를 쓴다면 사용자별 접근 권한 규칙(예: Supabase RLS)을 반드시 켜고, 남의 데이터를 읽거나 고칠 수 없게 한다.',
  '사용자가 입력한 글은 그대로 화면에 끼워 넣지 말고 안전하게 처리한다(스크립트 삽입 방지).',
  '.env 같은 비밀 파일은 저장소에 올리지 않는다.',
]

export function dontList(ir: Ir): string[] {
  return [
    '아래 명세에 없는 화면·기능을 마음대로 추가하지 않는다.',
    ...(ir.unresolved.length ? ['"아직 정해지지 않은 부분"은 추측해서 채우지 말고, 먼저 질문한다.'] : []),
    '한 번에 모든 것을 만들지 말고, 단계별로 나눠서 만든다.',
  ]
}

const bullets = (items: string[], indent = '') => items.map((i) => `${indent}- ${i}`).join('\n')

export function overview(ir: Ir): string {
  return [
    `앱 이름: ${ir.name}`,
    `만들려는 것: ${ir.goal || '(적혀 있지 않음)'}`,
    `쓰는 사람: ${ir.audience || '(적혀 있지 않음)'}`,
  ].join('\n')
}

export function screenLines(s: IrScreen): string[] {
  const lines = [`**${s.name}**${s.isStart ? ' (시작 화면)' : ''} — ${s.purpose || '(목적 미정)'}`]
  if (s.components.length) lines.push(`  - 구성요소: ${s.components.map((c) => (c.purpose ? `${c.name}(${c.purpose})` : c.name)).join(', ')}`)
  if (s.hasList) lines.push(`  - 목록 화면. 비었을 때 안내: ${s.emptyState ? '보여준다' : '(미정)'}`)
  if (s.reads.length) lines.push(`  - 읽어서 보여줌: ${s.reads.join(', ')}`)
  if (s.writes.length) lines.push(`  - 저장함: ${s.writes.join(', ')}`)
  if (s.conditions.length) lines.push(`  - 확인할 조건: ${s.conditions.map((c) => (c.purpose ? `${c.name}(${c.purpose})` : c.name)).join(', ')}`)
  if (s.externals.length) lines.push(`  - 외부 연동: ${s.externals.join(', ')}`)
  if (s.roles.length) lines.push(`  - 열 수 있는 역할: ${s.roles.join(', ')}`)
  if (s.notifies.length) lines.push(`  - 관련 알림: ${s.notifies.join(', ')}`)
  if (s.goesTo.length) lines.push(`  - 이동: ${s.goesTo.map((l) => `${l.label ? `[${l.label}] ` : ''}→ ${l.toName}`).join(', ')}`)
  return lines
}

export function screensSection(ir: Ir): string {
  return ir.screens.length ? ir.screens.map((s) => screenLines(s).join('\n')).join('\n\n') : '(화면 없음)'
}

export function dataSection(ir: Ir): string {
  if (!ir.data.length) return '(저장할 데이터 없음)'
  return ir.data
    .map((d) => {
      const lines = [`**${d.name}**${d.purpose ? ` — ${d.purpose}` : ''}`]
      lines.push(`  - 저장 항목: ${d.fields.length ? d.fields.join(', ') : '(미정)'}`)
      if (d.writtenBy.length) lines.push(`  - 저장하는 화면: ${d.writtenBy.join(', ')}`)
      if (d.readBy.length) lines.push(`  - 읽는 화면: ${d.readBy.join(', ')}`)
      return lines.join('\n')
    })
    .join('\n\n')
}

export const externalsSection = (ir: Ir) =>
  ir.externals.length ? bullets(ir.externals.map((e) => (e.purpose ? `${e.name} — ${e.purpose}` : e.name))) : ''

export const rolesSection = (ir: Ir) =>
  ir.roles.length
    ? [
        ...ir.roles.map((r) => `**${r.name}**${r.purpose ? ` — ${r.purpose}` : ''}\n  - 쓸 수 있는 화면: ${r.screens.length ? r.screens.join(', ') : '(연결된 화면 없음)'}`),
        '',
        '- 화면을 숨기는 것만으로는 부족하다. 데이터를 읽고 쓰는 쪽(서버·Supabase RLS)에서도 역할별로 막는다.',
      ].join('\n')
    : ''

export const notificationsSection = (ir: Ir) =>
  ir.notifications.length
    ? ir.notifications
        .map((n) => {
          const lines = [`**${n.name}**${n.purpose ? ` — ${n.purpose}` : ' — (언제 보내는지 미정)'}`]
          if (n.sentBy.length) lines.push(`  - 보내는 계기가 되는 화면: ${n.sentBy.join(', ')}`)
          if (n.opens.length) lines.push(`  - 누르면 열리는 화면: ${n.opens.join(', ')}`)
          return lines.join('\n')
        })
        .join('\n\n')
    : ''

export const acceptanceSection = (ir: Ir) => (ir.acceptance.length ? bullets(ir.acceptance.map((a) => `[ ] ${a}`)) : '')

export const unresolvedSection = (ir: Ir) => (ir.unresolved.length ? bullets(ir.unresolved) : '')

export const designSection = (ir: Ir, detail: DesignDetail) => designText(ir.design, detail)
export const securitySection = () => bullets(SECURITY_RULES)
export const dontSection = (ir: Ir) => bullets(dontList(ir))
export { bullets }

/** 값이 있는 섹션만 이어 붙인다. */
export function join(sections: (string | false | '' | undefined)[]): string {
  return sections.filter(Boolean).join('\n\n').trim() + '\n'
}

export const h = (title: string, body: string) => (body ? `## ${title}\n${body}` : '')
