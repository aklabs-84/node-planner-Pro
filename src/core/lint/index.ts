import type { Project } from '../schema'
import { RULES } from './rules'
import type { Issue, Severity } from './types'

export { SEVERITY_LABEL } from './types'
export type { Issue, Severity } from './types'

const ORDER: Record<Severity, number> = { error: 0, warn: 1, suggest: 2 }

/** 기획을 점검해 문제를 심각한 순서대로 돌려준다. 프로젝트는 바꾸지 않는다. */
export function lint(project: Project): Issue[] {
  return RULES.flatMap((rule) => rule(project)).sort((a, b) => ORDER[a.severity] - ORDER[b.severity])
}

export function countBySeverity(issues: Issue[]): Record<Severity, number> {
  return {
    error: issues.filter((i) => i.severity === 'error').length,
    warn: issues.filter((i) => i.severity === 'warn').length,
    suggest: issues.filter((i) => i.severity === 'suggest').length,
  }
}
