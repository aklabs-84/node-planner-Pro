import { useEffect, useRef, useState } from 'react'
import { useProject } from '../../store/project'

const KEY = 'npp.ui.onboarded'

/** 처음 방문이면 true. 안내를 끝내거나 건너뛰면 다시는 자동으로 시작하지 않는다. */
export function useFirstRun(): [boolean, (v: boolean) => void] {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(KEY) !== '1'
    } catch {
      return false
    }
  })
  const set = (v: boolean) => {
    setOpen(v)
    if (!v) {
      try {
        localStorage.setItem(KEY, '1')
      } catch {
        /* 무시 */
      }
    }
  }
  return [open, set]
}

type Side = 'right' | 'left' | 'bottom'
interface Step {
  title: string
  body: string
  anchor: string
  side: Side
  dim: boolean
  /** 사용자가 직접 해 보면 끝나는 행동 */
  wait: { kind: 'node' } | { kind: 'edge' } | { kind: 'click'; sel: string }
  /** 앵커를 못 찾을 때 보여줄 안내 */
  missing?: string
}

const STEPS: Step[] = [
  { title: '1. 화면 하나 만들기', body: '왼쪽 보관함에서 "화면"을 눌러 보세요. 캔버스에 노드가 생겨요.', anchor: '[data-tour="palette"]', side: 'right', dim: true, wait: { kind: 'node' } },
  { title: '2. 노드 이어 보기', body: '노드 오른쪽 점을 끌어 다른 노드의 점에 놓아 보세요. 노드가 하나뿐이면 보관함에서 하나 더 만들어요.', anchor: '[data-tour="canvas"]', side: 'bottom', dim: false, wait: { kind: 'edge' } },
  { title: '3. 빠진 곳 점검하기', body: '오른쪽 "점검" 탭을 눌러 보세요. 시작 화면이 없는지, 막다른 화면은 없는지 규칙으로 알려 줘요.', anchor: '[data-tour="tab-lint"]', side: 'left', dim: true, wait: { kind: 'click', sel: '[data-tour="tab-lint"]' }, missing: '오른쪽 속성 패널의 "점검" 탭을 눌러 보세요. (패널이 접혀 있으면 화살표로 펼쳐요)' },
  { title: '4. 지시문 만들기', body: '"지시문" 탭을 눌러 보세요. 쓸 AI 도구를 고르고 복사해서 붙여넣으면 앱이 만들어져요.', anchor: '[data-tour="tab-compile"]', side: 'left', dim: true, wait: { kind: 'click', sel: '[data-tour="tab-compile"]' }, missing: '오른쪽 속성 패널의 "지시문" 탭을 눌러 보세요.' },
  { title: '5. 앱 화면으로 보기', body: '캔버스 위 "앱 화면 보기"를 눌러 보세요. 노드가 휴대폰 화면으로 바뀌고, 버튼을 누르거나 ▶ 재생으로 흐름을 따라갈 수 있어요. 막히면 위쪽 "예시 불러오기"로 완성본을 열어 보세요.', anchor: '[data-tour="view-app"]', side: 'bottom', dim: true, wait: { kind: 'click', sel: '[data-tour="view-app"]' } },
]

const W = 300

/** 실제 화면 위에 말풍선을 띄워, 눌러 보며 배우게 하는 짧은 안내(5단계). */
export function GuideTour({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0)
  const [done, setDone] = useState(false)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const step = STEPS[i]
  const last = i === STEPS.length - 1
  const next = useRef<() => void>(() => {})
  next.current = () => (last ? onClose() : (setDone(false), setI(i + 1)))

  // 앵커 위치를 따라간다(패널이 접히거나 창 크기가 바뀌어도)
  useEffect(() => {
    const measure = () => {
      const el = document.querySelector(step.anchor)
      const r = el?.getBoundingClientRect()
      setRect(r && r.width > 0 ? r : null)
    }
    measure()
    const t = window.setInterval(measure, 300)
    window.addEventListener('resize', measure)
    return () => {
      window.clearInterval(t)
      window.removeEventListener('resize', measure)
    }
  }, [step.anchor])

  // 사용자가 시킨 행동을 하면 "잘했어요" 후 다음 단계로
  useEffect(() => {
    const finish = () => setDone(true)
    const w = step.wait
    if (w.kind === 'click') {
      const onClick = (e: MouseEvent) => (e.target as HTMLElement).closest(w.sel) && finish()
      document.addEventListener('click', onClick, true)
      return () => document.removeEventListener('click', onClick, true)
    }
    const count = (s: ReturnType<typeof useProject.getState>) => (w.kind === 'node' ? s.project.nodes.length : s.project.edges.length)
    const base = count(useProject.getState())
    return useProject.subscribe((s) => count(s) > base && finish())
  }, [step])

  useEffect(() => {
    if (!done) return
    const t = window.setTimeout(() => next.current(), 900)
    return () => window.clearTimeout(t)
  }, [done])

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])

  const vw = window.innerWidth
  const vh = window.innerHeight
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
  const pad = 6
  const pos: React.CSSProperties = { width: W }
  if (!rect) Object.assign(pos, { left: (vw - W) / 2, top: vh / 3 })
  else if (step.side === 'right') Object.assign(pos, { left: clamp(rect.right + 14, 8, vw - W - 8), top: clamp(rect.top + 40, 12, vh - 240) })
  else if (step.side === 'left') Object.assign(pos, { left: clamp(rect.left - W - 14, 8, vw - W - 8), top: clamp(rect.top, 12, vh - 240) })
  else Object.assign(pos, { left: clamp(rect.left + rect.width / 2 - W / 2, 8, vw - W - 8), top: clamp(rect.bottom + 12, 12, vh - 240) })
  // 캔버스처럼 큰 영역은 아래쪽 가운데에 띄운다
  if (rect && step.anchor === '[data-tour="canvas"]') Object.assign(pos, { left: clamp(rect.left + rect.width / 2 - W / 2, 8, vw - W - 8), top: Math.max(12, rect.bottom - 230) })

  return (
    <div className="pointer-events-none fixed inset-0 z-40" role="region" aria-label="사용 안내 따라 하기">
      {rect && (
        <div
          className="absolute rounded-lg ring-2 ring-accent"
          style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, boxShadow: step.dim ? '0 0 0 9999px rgba(15,23,42,0.35)' : undefined }}
        />
      )}
      <div className="pointer-events-auto absolute rounded-xl bg-white p-3.5 shadow-xl ring-1 ring-line" style={pos}>
        <div className="flex items-center justify-between text-[11px] text-mute">
          <span>
            {i + 1} / {STEPS.length}
          </span>
          <button onClick={onClose} className="rounded px-1.5 py-0.5 hover:bg-canvas">
            건너뛰기
          </button>
        </div>
        <b className="mt-1 block text-[14px]">{step.title}</b>
        <p className="mt-1 text-[12.5px] leading-relaxed text-sub">{!rect && step.missing ? step.missing : step.body}</p>
        <div className="mt-3 flex items-center justify-between">
          <span aria-live="polite" className="text-[12px] font-medium text-accent">
            {done ? '✓ 잘했어요!' : ''}
          </span>
          <div className="flex gap-1.5">
            {i > 0 && (
              <button onClick={() => (setDone(false), setI(i - 1))} className="rounded-lg border border-line2 px-2.5 py-1 text-xs hover:bg-canvas">
                이전
              </button>
            )}
            <button onClick={() => next.current()} className={`rounded-lg px-3 py-1 text-xs font-medium ${last || done ? 'bg-accent text-white' : 'border border-line2 hover:bg-canvas'}`}>
              {last ? '끝내기' : '다음'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
