/**
 * AI 초안 프록시 (Vercel 서버리스 함수): 앱 설명 한두 문장 → 노드 기획 초안.
 * 키는 서버 환경변수 또는 사용자가 보낸 본인 키만 쓰고, 프롬프트는 서버가 만든다.
 */
import { buildDraftPrompt, MAX_DESC, parseDraft } from '../src/core/aidraft.js'
import { askGemini, geminiFailure, guard, json } from './_gemini.js'

export default {
  async fetch(request: Request): Promise<Response> {
    const g = await guard(request, MAX_DESC * 4 + 200)
    if (g instanceof Response) return g

    let description = ''
    try {
      const body = JSON.parse(g.text) as { description?: unknown }
      if (typeof body.description === 'string') description = body.description.trim()
    } catch {
      return json(400, { error: '올바른 JSON이 아니에요' })
    }
    if (description.length < 4) return json(400, { error: '만들고 싶은 앱을 조금 더 적어 주세요' })

    try {
      const out = await askGemini(buildDraftPrompt(description), g.key, { maxTokens: 4000, json: true })
      if (!out.ok) return geminiFailure(out.status, g.own)
      return json(200, { project: parseDraft(out.text) })
    } catch {
      return json(502, { error: 'AI 초안을 읽지 못했어요. 다시 시도해 주세요' })
    }
  },
}
