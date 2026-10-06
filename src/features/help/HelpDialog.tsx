import { useEffect } from 'react'

const STEPS = [
  { t: '1. 그려요', d: '왼쪽에서 화면·데이터 등을 골라 캔버스에 놓고, 점을 끌어 서로 이어요. 선을 누르면 "이동·저장·읽기" 같은 종류를 정할 수 있어요.' },
  { t: '2. 점검해요', d: '오른쪽 "점검" 탭이 빠진 곳을 알려줘요(시작 화면 없음, 막다른 화면 등). 항목을 누르면 해당 노드로 이동해요. AI 없이 규칙으로 계산해요.' },
  { t: '3. 지시문을 만들어요', d: '"지시문" 탭에서 쓸 도구(Claude Code·Codex, AI 빌더, 채팅, 기획서)를 고르고 복사해 붙여넣으면 끝이에요.' },
]

export function HelpDialog({ onClose, onTour }: { onClose: () => void; onTour: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="사용 안내" onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <b className="text-base">노드 기획 PRO, 이렇게 써요</b>
        <p className="mt-1 text-xs text-mute">앱을 만들기 전에 화면과 흐름을 그려 두면, AI가 훨씬 정확하게 만들어 줘요.</p>
        <ol className="mt-3 space-y-2.5">
          {STEPS.map((s) => (
            <li key={s.t} className="rounded-lg bg-canvas px-3 py-2">
              <b className="text-[13px]">{s.t}</b>
              <p className="mt-0.5 text-[12px] leading-snug text-sub">{s.d}</p>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-[12px] text-sub">처음이라면 위쪽 "예시 불러오기"로 완성된 예시를 열어 보세요. 안내는 위쪽 "사용 안내"에서 다시 볼 수 있어요.</p>
        <button autoFocus onClick={onTour} className="mt-4 w-full rounded-lg bg-accent py-2 text-sm font-medium text-white hover:opacity-90">
          눌러 보며 배우기 (5단계)
        </button>
        <button onClick={onClose} className="mt-2 w-full rounded-lg border border-line2 py-2 text-sm font-medium hover:bg-canvas">
          닫기
        </button>
      </div>
    </div>
  )
}
