import { parseProject, type Project } from '../core/schema'
import { z } from 'zod'
import { aiHeaders } from './aiKey'

export type AiDraftResult = { ok: true; project: Project } | { ok: false; error: string }

export async function runAiDraft(description: string): Promise<AiDraftResult> {
  let res: Response
  try {
    res = await fetch('/api/ai-draft', { method: 'POST', headers: { 'content-type': 'application/json', ...aiHeaders() }, body: JSON.stringify({ description }) })
  } catch {
    return { ok: false, error: '서버에 연결하지 못했어요' }
  }
  if (!(res.headers.get('content-type') ?? '').includes('application/json')) {
    return { ok: false, error: 'AI 서버에 연결되지 않았어요(배포 후 사용할 수 있어요)' }
  }
  const body: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    const m = z.object({ error: z.string() }).safeParse(body)
    return { ok: false, error: m.success ? m.data.error : '알 수 없는 오류' }
  }
  const p = parseProject((body as { project?: unknown } | null)?.project)
  return p.ok ? { ok: true, project: p.project } : { ok: false, error: '응답 형식이 올바르지 않아요' }
}
