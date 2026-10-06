import { useEffect, useState } from 'react'
import { clearKey, getKey, isRemembered, KEY_PATTERN, setKey } from '../../lib/aiKey'

export function AiKeyDialog({ onClose, onChange }: { onClose: () => void; onChange: () => void }) {
  const current = getKey()
  const [value, setValue] = useState('')
  const [remember, setRemember] = useState(isRemembered)
  const [error, setError] = useState('')

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])

  const save = () => {
    const v = value.trim()
    if (!KEY_PATTERN.test(v)) return setError('키 모양이 올바르지 않아요. Google AI Studio에서 만든 키를 그대로 붙여넣어 주세요.')
    setKey(v, remember)
    onChange()
    onClose()
  }
  const remove = () => {
    clearKey()
    onChange()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="AI 설정" onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <b className="text-base">AI 설정 · 내 Gemini 키</b>
        <p className="mt-1 text-xs text-mute">서버에 AI 키가 없어도, 내 키를 입력하면 "AI 초안"과 "AI 점검"을 바로 쓸 수 있어요.</p>

        <p className="mt-3 text-[12.5px]">
          {current ? <>현재: <b>저장됨</b> (…{current.slice(-4)}) · {isRemembered() ? '이 브라우저에 기억 중' : '이 탭에서만 사용 중'}</> : '현재: 키 없음'}
        </p>

        <input
          type="password"
          autoComplete="off"
          spellCheck={false}
          aria-label="Gemini API 키"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError('')
          }}
          placeholder={current ? '새 키로 바꾸려면 여기에 입력' : 'AIza… 로 시작하는 키 붙여넣기'}
          className="mt-2 w-full rounded-lg border border-line2 p-2.5 text-[13px] outline-none focus:border-accent"
        />
        <label className="mt-2 flex items-center gap-1.5 text-[12px] text-sub">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          이 브라우저에 기억하기 <span className="text-mute">(끄면 탭을 닫을 때 지워져요)</span>
        </label>
        {error && (
          <p role="alert" className="mt-2 rounded-lg bg-danger-bg px-2.5 py-1.5 text-xs text-danger">
            {error}
          </p>
        )}

        <ul className="mt-3 list-disc space-y-1 pl-4 text-[11.5px] leading-snug text-mute">
          <li>키는 이 브라우저에만 보관돼요. AI를 쓸 때 우리 서버를 거쳐 Google로 전달만 되고, 서버에 저장하지 않아요.</li>
          <li>학교·공용 컴퓨터에서는 "기억하기"를 끄고, 다 쓰면 "키 삭제"를 눌러 주세요.</li>
          <li>
            키는 <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-accent underline">Google AI Studio</a>에서 만들 수 있어요. 남에게 알려 주지 마세요.
          </li>
        </ul>

        <div className="mt-4 flex gap-2">
          {current && (
            <button onClick={remove} className="rounded-lg border border-line2 px-3 py-2 text-sm font-medium text-danger hover:bg-danger-bg">
              키 삭제
            </button>
          )}
          <span className="flex-1" />
          <button onClick={onClose} className="rounded-lg border border-line2 px-4 py-2 text-sm font-medium hover:bg-canvas">
            닫기
          </button>
          <button onClick={save} disabled={!value.trim()} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
