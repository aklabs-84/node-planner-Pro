/**
 * 사용자가 직접 입력한 Gemini 키. 코드나 번들에는 없고, 이 브라우저에만 보관한다.
 * 기본은 탭을 닫으면 사라지는 sessionStorage, "기억하기"를 켜면 localStorage.
 */
const K = 'npp.ai.geminiKey'
export const KEY_HEADER = 'x-user-gemini-key'
export const KEY_PATTERN = /^[A-Za-z0-9_-]{20,120}$/

const read = (s: () => Storage): string => {
  try {
    return s().getItem(K) ?? ''
  } catch {
    return ''
  }
}

export const getKey = (): string => read(() => sessionStorage) || read(() => localStorage)
export const isRemembered = (): boolean => !!read(() => localStorage)

export function setKey(key: string, remember: boolean): void {
  clearKey()
  try {
    ;(remember ? localStorage : sessionStorage).setItem(K, key)
  } catch {
    /* 저장소를 못 쓰면 이번 방문에서만 쓰지 못한다 */
  }
}

export function clearKey(): void {
  for (const s of [() => sessionStorage, () => localStorage]) {
    try {
      s().removeItem(K)
    } catch {
      /* 무시 */
    }
  }
}

/** 요청에 붙일 헤더: 키가 있을 때만 */
export function aiHeaders(): Record<string, string> {
  const k = getKey()
  return k ? { [KEY_HEADER]: k } : {}
}
