import { useEffect, useState } from 'react'
import { MAX_DESC } from '../../core/aidraft'
import type { Project } from '../../core/schema'
import { runAiDraft } from '../../lib/aiDraft'

const IDEAS = ['하루 일기를 쓰고 모아 보는 앱', '동네 가게 물건을 보고 장바구니에 담는 앱', '오늘 할 일을 적고 체크하는 앱']

export function AiDraftDialog({ onClose, onDone }: { onClose: () => void; onDone: (p: Project) => void }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose, busy])

  const make = async () => {
    setBusy(true)
    setError('')
    const r = await runAiDraft(text.trim())
    setBusy(false)
    if (r.ok) onDone(r.project)
    else setError(r.error)
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" onClick={() => !busy && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="AI로 초안 만들기" onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <b className="text-base">AI로 초안 만들기</b>
        <p className="mt-1 text-xs text-mute">만들고 싶은 앱을 한두 문장으로 적으면 화면과 연결을 그려 줘요. 그린 뒤 직접 고치고 "점검" 탭으로 확인하세요.</p>
        <textarea
          autoFocus
          aria-label="만들고 싶은 앱 설명"
          value={text}
          maxLength={MAX_DESC}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="예) 학생들이 독서 기록을 남기고 읽은 책을 모아 보는 앱"
          className="mt-3 w-full resize-none rounded-lg border border-line2 p-2.5 text-[13px] outline-none focus:border-accent"
        />
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {IDEAS.map((i) => (
            <button key={i} onClick={() => setText(i)} className="rounded-full bg-canvas px-2.5 py-1 text-[11.5px] text-sub hover:bg-line">
              {i}
            </button>
          ))}
        </div>
        <p className="mt-2.5 text-[11.5px] leading-snug text-mute">누르면 입력한 글이 AI 서버로 전달돼요. 현재 작업은 "되돌리기"(Ctrl/⌘+Z)로 복구할 수 있어요.</p>
        {error && (
          <p role="alert" className="mt-2 rounded-lg bg-danger-bg px-2.5 py-1.5 text-xs text-danger">
            {error}
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <button onClick={onClose} disabled={busy} className="rounded-lg border border-line2 px-4 py-2 text-sm font-medium hover:bg-canvas disabled:opacity-50">
            취소
          </button>
          <button
            onClick={make}
            disabled={busy || text.trim().length < 4}
            className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy ? '그리는 중… (최대 20초)' : '초안 만들기'}
          </button>
        </div>
      </div>
    </div>
  )
}
