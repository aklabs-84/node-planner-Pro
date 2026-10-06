/**
 * 클래스로그AI 제출 프록시 (Vercel 서버리스 함수).
 * CLASS_TOOL_API_KEY는 이 서버 코드 안에서만 쓰며 번들에는 절대 들어가지 않는다.
 */
import { json } from './_gemini'

declare const process: { env: Record<string, string | undefined> }

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') return json(405, { error: 'POST만 가능해요' })

    const baseUrl = process.env.AISERVICEHUB_BASE_URL
    const apiKey = process.env.CLASS_TOOL_API_KEY
    if (!baseUrl || !apiKey) return json(500, { error: '서버 설정이 필요해요' })

    // 같은 사이트에서 보낸 요청인지 확인 (보조 수단)
    const origin = request.headers.get('origin')
    if (origin && origin !== new URL(request.url).origin) return json(403, { error: 'Forbidden' })

    const raw = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!raw || typeof raw !== 'object') return json(400, { error: '올바른 요청이 아니에요' })

    // 허용한 필드만 골라서 길이 제한
    const body = {
      entryCode: str(raw.entryCode, 100),
      studentId: str(raw.studentId, 100) || undefined,
      studentName: str(raw.studentName, 100) || undefined,
      title: str(raw.title, 200),
      resultType: raw.resultType,
      linkUrl: str(raw.linkUrl, 2000) || undefined,
      textContent: str(raw.textContent, 20000) || undefined,
    }
    if (!body.entryCode || !body.title) return json(400, { error: 'entryCode, title은 필수예요' })
    if (body.resultType !== 'link' && body.resultType !== 'text') return json(400, { error: 'resultType은 link 또는 text여야 해요' })
    if (body.linkUrl && !/^https:\/\//i.test(body.linkUrl)) return json(400, { error: '링크는 https:// 로 시작해야 해요' })

    try {
      const res = await fetch(`${baseUrl}/api/classlog/submission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      return json(res.status, data)
    } catch (err) {
      console.error('submit proxy failed', err)
      return json(502, { error: '제출 서버에 연결하지 못했어요. 잠시 뒤 다시 시도해 주세요.' })
    }
  },
}
