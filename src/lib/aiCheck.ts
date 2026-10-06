import { AiFindingSchema, type AiFinding } from '../core/aicheck'
import type { Project } from '../core/schema'
import { z } from 'zod'
import { aiHeaders } from './aiKey'

export type AiCheckResult = { ok: true; findings: AiFinding[] } | { ok: false; error: string; offline?: boolean }

/** 서버(/api/ai-check)에 프로젝트만 보낸다. 키는 서버에만 있다. */
export async function runAiCheck(project: Project): Promise<AiCheckResult> {
  let res: Response
  try {
    res = await fetch('/api/ai-check', { method: 'POST', headers: { 'content-type': 'application/json', ...aiHeaders() }, body: JSON.stringify(project) })
  } catch {
    return { ok: false, error: '서버에 연결하지 못했어요', offline: true }
  }
  const type = res.headers.get('content-type') ?? ''
  if (!type.includes('application/json')) {
    // 로컬 개발 서버처럼 api가 없으면 HTML이나 404가 돌아온다
    return { ok: false, error: 'AI 서버에 연결되지 않았어요(배포 후 사용할 수 있어요)', offline: true }
  }
  const body: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    const msg = z.object({ error: z.string() }).safeParse(body)
    return { ok: false, error: msg.success ? msg.data.error : '알 수 없는 오류', offline: res.status === 503 }
  }
  const parsed = z.object({ findings: z.array(AiFindingSchema) }).safeParse(body)
  return parsed.success ? { ok: true, findings: parsed.data.findings } : { ok: false, error: '응답 형식이 올바르지 않아요' }
}
