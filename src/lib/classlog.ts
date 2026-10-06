import { useProject } from '../store/project'

/** 클래스로그AI 교실에서 열렸을 때 주소에 붙어 오는 정보(?entryCode=…&studentName=…) */
export function getClassLogContext() {
  const p = new URLSearchParams(window.location.search)
  return { entryCode: p.get('entryCode') || null, studentName: p.get('studentName') || null, studentId: p.get('studentId') || null }
}

export const inClass = () => !!getClassLogContext().entryCode

/** 결과물을 이 앱의 서버(/api/submit)로 보낸다. 비밀키는 서버에만 있다. */
export async function submitToClass(input: { title: string; textContent: string }) {
  const ctx = getClassLogContext()
  if (!ctx.entryCode) throw new Error('클래스로그AI 교실에서 들어와야 제출할 수 있어요')
  const res = await fetch('/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...ctx, ...input, resultType: 'text' }),
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error || `제출 실패 (${res.status})`)
  }
  return res.json()
}

let dirty = false
export const markClean = () => {
  dirty = false
}

/** 교실에서 들어왔고 작업 내용이 바뀐 뒤에만, 탭을 닫을 때 브라우저 확인 창을 띄운다. 반환값은 정리 함수. */
export function initClassLogGuard() {
  if (!inClass()) return () => {}
  const onUnload = (e: BeforeUnloadEvent) => {
    if (!dirty) return
    e.preventDefault()
    e.returnValue = ''
  }
  window.addEventListener('beforeunload', onUnload)
  const unsub = useProject.subscribe((s, prev) => {
    if (s.project !== prev.project) dirty = true
  })
  return () => {
    window.removeEventListener('beforeunload', onUnload)
    unsub()
  }
}
