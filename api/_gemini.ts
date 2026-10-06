/** AI 프록시 공통 코드. 밑줄(_)로 시작하는 파일은 Vercel이 주소(엔드포인트)로 열지 않는다. */
declare const process: { env: Record<string, string | undefined> }

const hits = new Map<string, number[]>()
const LIMIT = 10 // IP당 분당 호출 수 (서버 인스턴스별 단순 제한)
const KEY_HEADER = 'x-user-gemini-key'
const KEY_PATTERN = /^[A-Za-z0-9_-]{20,120}$/

export const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } })

export interface Guarded {
  text: string
  /** Gemini에 쓸 키. 사용자가 보낸 키가 있으면 그것, 없으면 서버 환경변수 */
  key: string
  /** 사용자가 직접 보낸 키인지 */
  own: boolean
}

/**
 * 요청을 검사한다: 문제가 있으면 바로 돌려줄 응답, 없으면 본문과 쓸 키를 돌려준다.
 * 사용자 키는 저장·기록하지 않고 이 요청에서만 쓴다.
 */
export async function guard(request: Request, maxBytes: number): Promise<Response | Guarded> {
  if (request.method !== 'POST') return json(405, { error: 'POST만 가능해요' })

  const sent = request.headers.get(KEY_HEADER)?.trim() ?? ''
  if (sent && !KEY_PATTERN.test(sent)) return json(400, { error: '입력한 API 키 모양이 올바르지 않아요' })
  const key = sent || process.env.GEMINI_API_KEY || ''
  if (!key) return json(503, { error: "AI 키가 없어요. 상단 'AI 설정'에서 내 Gemini 키를 입력해 주세요" })

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000)
  recent.push(now)
  hits.set(ip, recent)
  if (recent.length > LIMIT) return json(429, { error: '잠시 후 다시 시도해 주세요(분당 10회)' })

  const text = await request.text()
  if (text.length > maxBytes) return json(413, { error: '내용이 너무 커요' })
  return { text, key, own: !!sent }
}

export type GeminiResult = { ok: true; text: string } | { ok: false; status: number }

/** Gemini에 프롬프트를 보내고 글 응답을 돌려준다. */
export async function askGemini(prompt: string, key: string, opts: { maxTokens: number; json?: boolean }): Promise<GeminiResult> {
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: opts.maxTokens, ...(opts.json ? { responseMimeType: 'application/json' } : {}) },
    }),
  })
  if (!res.ok) return { ok: false, status: res.status }
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
  return { ok: true, text: data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '' }
}

/** Gemini 오류를 사용자에게 도움이 되는 문장으로 바꾼다. */
export function geminiFailure(status: number, own: boolean): Response {
  if (own && [400, 401, 403].includes(status)) return json(401, { error: '입력한 API 키가 올바르지 않거나 사용할 수 없어요. "AI 설정"에서 확인해 주세요' })
  if (status === 429) return json(429, { error: 'Gemini 사용 한도를 넘었어요. 잠시 후 다시 시도해 주세요' })
  return json(502, { error: 'AI 서버가 응답하지 못했어요' })
}
