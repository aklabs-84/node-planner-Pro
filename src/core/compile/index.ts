import { buildIr } from '../ir.js'
import type { Project } from '../schema.js'
import { compileBuilder } from './targets/builder.js'
import { compileChat } from './targets/chat.js'
import { compileClaude } from './targets/claude.js'
import { compileMarkdown } from './targets/markdown.js'

export const TARGETS = [
  {
    id: 'claude',
    label: 'Claude Code · Codex',
    hint: '파일 구조와 단계별 구현 순서, 확인 방법 포함',
    when: '내 컴퓨터에서 코딩 도구로 직접 만들 때',
    traits: ['번호 붙은 구현 순서(뼈대 → 화면 → 데이터 → 이동)', '기술 조건 · 확인 체크리스트 · 보안 규칙', '"변경 전에 계획부터 보여달라"는 작업 방식'],
  },
  {
    id: 'builder',
    label: 'AI 빌더 (Lovable·Bolt·v0)',
    hint: '화면 중심, 한 번에 붙여넣기',
    when: '웹 빌더 사이트에 한 번에 붙여넣을 때',
    traits: ['짧고 화면 구성 위주', '구현 순서·기술 조건 없음 (빌더가 알아서 정함)', '동작 기준 · 보안 · 금지 사항 포함'],
  },
  {
    id: 'chat',
    label: 'Gemini · ChatGPT',
    hint: '먼저 질문하고 단계별로 진행',
    when: '채팅창에서 대화하며 만들 때 (초보자용)',
    traits: ['코드부터 쓰지 말고 질문 3개 이내로 먼저 묻게 함', '가장 작은 단계부터 하나씩, 쉬운 말로 설명', '"친절한 개발 선생님" 역할 부여'],
  },
  {
    id: 'markdown',
    label: 'Markdown 기획서',
    hint: '사람이 읽는 문서, 공유용',
    when: '동료·학생에게 보여주는 문서, 공유·PDF용',
    traits: ['AI에게 시키는 말 없음 (보안·금지 규칙 제외)', '1~8번 번호 문서, 화면 이동 목록·메모 포함'],
  },
] as const

export type TargetId = (typeof TARGETS)[number]['id']

const COMPILERS = { claude: compileClaude, builder: compileBuilder, chat: compileChat, markdown: compileMarkdown }

/** 프로젝트를 선택한 도구용 지시문 텍스트로 바꾼다. */
export function compile(project: Project, target: TargetId): string {
  return COMPILERS[target](buildIr(project))
}
