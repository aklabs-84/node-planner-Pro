import { useEffect, useMemo } from 'react'
import { useReactFlow } from '@xyflow/react'
import { LAYOUT_IDS, LAYOUTS, resolveDesign, THEME_IDS, THEMES, type Design } from '../../core/design'
import { buildIr } from '../../core/ir'
import { tourOrder } from '../../core/tour'
import { useTour } from '../../lib/useTour'
import { useViewMode, type ViewMode } from '../../lib/useViewMode'
import { useProject } from '../../store/project'

/** 노드 보기 / 앱 화면 보기 전환. 앱 화면 보기에서는 디자인(레이아웃·색 테마) 선택기가 같이 나온다. */
export function ViewControls() {
  const { mode, setMode } = useViewMode()
  const design = resolveDesign(useProject((s) => s.project.design))
  const setDesign = (d: Partial<Design>) => useProject.getState().updateMeta({ design: { ...design, ...d } })

  const { fitView } = useReactFlow()
  const project = useProject((s) => s.project)
  const selectedId = useProject((s) => s.selectedId)
  const playing = useTour((s) => s.playing)
  const order = useMemo(() => tourOrder(buildIr(project).screens), [project])
  const idx = selectedId ? order.indexOf(selectedId) : -1
  const app = mode === 'app'

  const step = (d: 1 | -1) => {
    const next = order[idx < 0 ? (d === 1 ? 0 : order.length - 1) : idx + d]
    if (next) useTour.getState().goTo(next)
    else useTour.getState().setPlaying(false)
  }
  const stepRef = { current: step }
  stepRef.current = step

  // 자동 재생: 2초마다 다음 화면. 끝에 닿으면 멈춘다.
  useEffect(() => {
    if (!app || !playing) return
    const t = window.setInterval(() => {
      const { selectedId: cur } = useProject.getState()
      const i = cur ? order.indexOf(cur) : -1
      if (i >= order.length - 1) return useTour.getState().setPlaying(false)
      useTour.getState().goTo(order[i + 1])
    }, 2000)
    return () => window.clearInterval(t)
  }, [app, playing, order])

  // 앱 화면 보기를 벗어나면 재생을 멈춘다
  useEffect(() => {
    if (!app) useTour.getState().setPlaying(false)
  }, [app])

  // 키보드 ← / → 로 이전·다음 화면
  useEffect(() => {
    if (!app) return
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable) return
      if (e.key === 'ArrowRight') stepRef.current(1)
      else if (e.key === 'ArrowLeft') stepRef.current(-1)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 border-b border-line bg-white px-3 py-1.5 text-xs">
      <div role="tablist" aria-label="캔버스 보기 방식" className="flex rounded-lg border border-line2 bg-white p-0.5 text-xs">
        {([['node', '노드 보기'], ['app', '앱 화면 보기']] as [ViewMode, string][]).map(([id, label]) => (
          <button key={id} data-tour={`view-${id}`} role="tab" aria-selected={mode === id} onClick={() => setMode(id)} className={`whitespace-nowrap rounded-md px-3 py-1 font-medium ${mode === id ? 'bg-accent text-white' : 'text-sub hover:bg-canvas'}`}>
            {label}
          </button>
        ))}
      </div>
      {app && (
        <><span className="h-5 w-px bg-line" /><div className="flex items-center gap-1">
          <button onClick={() => step(-1)} disabled={idx <= 0} aria-label="이전 화면으로" className="rounded-md px-2 py-1 font-medium hover:bg-canvas disabled:opacity-40">◀ 이전</button>
          <span aria-live="polite" className="min-w-[44px] text-center tabular-nums text-sub">{idx < 0 ? '–' : idx + 1} / {order.length}</span>
          <button onClick={() => step(1)} disabled={idx >= order.length - 1} aria-label="다음 화면으로" className="rounded-md px-2 py-1 font-medium hover:bg-canvas disabled:opacity-40">다음 ▶</button>
          <span className="mx-1 h-4 w-px bg-line" />
          <button onClick={() => { if (!playing && idx >= order.length - 1) useTour.getState().goTo(order[0]); useTour.getState().setPlaying(!playing) }} aria-pressed={playing} className={`rounded-md px-2 py-1 font-medium ${playing ? 'bg-accent text-white' : 'hover:bg-canvas'}`}>{playing ? '⏸ 멈춤' : '▶ 재생'}</button>
          <button onClick={() => fitView({ padding: 0.12, maxZoom: 1, minZoom: 0.08, duration: 300 })} className="rounded-md px-2 py-1 font-medium hover:bg-canvas">전체 맞춤</button>
        </div></>
      )}
      {app && (
        <><span className="h-5 w-px bg-line" /><div className="flex items-center gap-2">
          <select aria-label="레이아웃" value={design.layout} onChange={(e) => setDesign({ layout: e.target.value as Design['layout'] })} className="rounded-md border border-line2 bg-white px-2 py-1">
            {LAYOUT_IDS.map((id) => (
              <option key={id} value={id}>{LAYOUTS[id].label}</option>
            ))}
          </select>
          <div role="radiogroup" aria-label="색 테마" className="flex gap-1">
            {THEME_IDS.map((id) => (
              <button key={id} role="radio" aria-label={THEMES[id].label} title={THEMES[id].label} aria-checked={design.theme === id} onClick={() => setDesign({ theme: id })} className={`flex items-center rounded-full border p-1 ${design.theme === id ? 'border-accent bg-accent-bg text-accent' : 'border-line2 hover:bg-canvas'}`}>
                <i className="h-3.5 w-3.5 rounded-full border border-line2" style={{ background: THEMES[id].colors.accent }} />
              </button>
            ))}
          </div>
        </div></>
      )}
    </div>
  )
}
