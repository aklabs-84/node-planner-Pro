import type { Project } from '../schema.js'

export type Severity = 'error' | 'warn' | 'suggest'

export interface Issue {
  id: string
  severity: Severity
  /** 이 문제와 관련된 노드(점검 목록에서 누르면 캔버스가 첫 번째로 이동한다) */
  nodeIds: string[]
  message: string
  /** 어떻게 고치면 되는지 */
  hint: string
}

export type Rule = (project: Project) => Issue[]

export const SEVERITY_LABEL: Record<Severity, string> = { error: '오류', warn: '경고', suggest: '제안' }
