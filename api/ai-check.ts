/**
 * AI 점검 프록시 (Vercel 서버리스 함수).
 * - API 키는 서버 환경변수(GEMINI_API_KEY) 또는 사용자가 헤더로 보낸 본인 키만 쓴다. 번들에는 절대 들어가지 않는다.
 * - 프로젝트를 서버에서 다시 검증하고, 프롬프트도 서버에서 만든다.
 */
import { buildAiPrompt, MAX_PROJECT_BYTES, parseAiFindings } from '../src/core/aicheck.js'
import { ProjectSchema } from '../src/core/schema.js'
import { askGemini, geminiFailure, guard, json } from './_gemini.js'

export default {
  async fetch(request: Request): Promise<Response> {
    const g = await guard(request, MAX_PROJECT_BYTES)
    if (g instanceof Response) return g

    let raw: unknown
    try {
      raw = JSON.parse(g.text)
    } catch {
      return json(400, { error: '올바른 JSON이 아니에요' })
    }
    const parsed = ProjectSchema.safeParse(raw)
    if (!parsed.success) return json(400, { error: '프로젝트 형식이 올바르지 않아요' })

    try {
      const out = await askGemini(buildAiPrompt(parsed.data), g.key, { maxTokens: 1500 })
      if (!out.ok) return geminiFailure(out.status, g.own)
      return json(200, { findings: parseAiFindings(out.text) })
    } catch {
      return json(502, { error: 'AI 결과를 읽지 못했어요. 다시 시도해 주세요' })
    }
  },
}
