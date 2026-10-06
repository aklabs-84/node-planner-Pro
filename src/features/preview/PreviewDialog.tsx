import { useEffect, useMemo, useState } from 'react'
import { buildSim, reachableFromStart, unvisited } from '../../core/simulate'
import { LAYOUT_IDS, LAYOUTS, resolveDesign, THEME_IDS, THEMES, type Design } from '../../core/design'
import { useProject } from '../../store/project'
import { PhoneScreen } from './PhoneScreen'

/** 클릭 시뮬레이터: 그린 화면을 와이어프레임으로 보여 주고, 버튼을 눌러 흐름을 직접 따라가 본다. */
export function PreviewDialog({ onClose }: { onClose: () => void }) {
  const project = useProject((s) => s.project)
  const sim = useMemo(() => buildSim(project), [project])
  const [path, setPath] = useState<string[]>(() => (sim.startId ? [sim.startId] : []))
  const [visited, setVisited] = useState<Set<string>>(() => new Set(sim.startId ? [sim.startId] : []))
  const design = resolveDesign(project.design)
  const setDesign = (d: Partial<Design>) => useProject.getState().updateMeta({ design: { ...design, ...d } })
  const [showEmpty, setShowEmpty] = useState(false)
  const [saved, setSaved] = useState('')

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])

  const cur = sim.byId.get(path[path.length - 1] ?? '')
  const total = sim.ir.screens.length
  const missing = unvisited(sim, visited)
  const unreachable = useMemo(() => {
    const r = reachableFromStart(sim)
    return new Set(sim.ir.screens.filter((s) => !r.has(s.id)).map((s) => s.id))
  }, [sim])

  const go = (id: string) => {
    if (!sim.byId.has(id)) return
    setPath((p) => [...p, id])
    setVisited((v) => new Set(v).add(id))
    setShowEmpty(false)
    setSaved('')
  }
  const back = () => {
    setPath((p) => (p.length > 1 ? p.slice(0, -1) : p))
    setShowEmpty(false)
    setSaved('')
  }
  const restart = () => {
    if (!sim.startId) return
    setPath([sim.startId])
    setVisited(new Set([sim.startId]))
    setShowEmpty(false)
    setSaved('')
  }
  const jump = (id: string) => {
    // 닿을 수 없는 화면도 직접 열어서 볼 수 있다
    setPath([id])
    setVisited((v) => new Set(v).add(id))
    setShowEmpty(false)
    setSaved('')
  }

  const designPanel = (
      <div className="rounded-lg border border-line p-3">
        <b>디자인</b>
        <label className="mt-2 block text-[11.5px] text-sub">
          레이아웃
          <select aria-label="레이아웃" value={design.layout} onChange={(e) => setDesign({ layout: e.target.value as Design['layout'] })} className="mt-0.5 w-full rounded-md border border-line2 bg-white px-2 py-1 text-[12.5px] text-ink">
            {LAYOUT_IDS.map((id) => (
              <option key={id} value={id}>{LAYOUTS[id].label}</option>
            ))}
          </select>
        </label>
        <p className="mt-1 text-[11.5px] text-mute">이런 앱에 어울려요: {LAYOUTS[design.layout].fits}</p>
        <div className="mt-2 text-[11.5px] text-sub">색 테마</div>
        <div role="radiogroup" aria-label="색 테마" className="mt-1 flex flex-wrap gap-1.5">
          {THEME_IDS.map((id) => (
            <button key={id} role="radio" aria-checked={design.theme === id} onClick={() => setDesign({ theme: id })} className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] ${design.theme === id ? 'border-accent bg-accent-bg text-accent' : 'border-line2 hover:bg-canvas'}`}>
              <i className="h-3 w-3 rounded-full border border-line2" style={{ background: THEMES[id].colors.accent }} />
              {THEMES[id].label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-snug text-mute">고른 디자인은 프로젝트에 저장되고, 지시문의 "디자인" 부분에 들어가요.</p>
      </div>
  )

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="클릭 미리보기" onClick={(e) => e.stopPropagation()} className="flex max-h-full w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-center gap-3 border-b border-line px-5 py-3">
          <b className="text-base">▶ 클릭 미리보기</b>
          <span className="text-xs text-mute">버튼을 눌러 화면 흐름을 직접 따라가 보세요. 실제 앱이 아니라 기획을 훑어보는 용도예요.</span>
          <span className="flex-1" />
          <button onClick={onClose} aria-label="닫기" className="rounded-lg px-2 py-1 text-sub hover:bg-canvas">
            ✕
          </button>
        </div>

        {!cur ? (
          <p className="p-8 text-center text-sm text-sub">화면 노드가 없어요. 왼쪽 팔레트에서 "화면"을 먼저 추가해 주세요.</p>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-5 sm:flex-row">
            {/* 휴대폰 모양 화면 */}
            <div className="mx-auto w-[300px] shrink-0">
              <PhoneScreen
                screen={cur}
                design={design}
                index={Math.max(1, sim.ir.screens.findIndex((x) => x.id === cur.id) + 1)}
                total={total}
                showEmpty={showEmpty}
                setShowEmpty={setShowEmpty}
                saved={saved}
                setSaved={setSaved}
                go={go}
                back={back}
                canBack={path.length > 1}
              />
              <div className="mt-2.5 flex gap-2">
                <button onClick={back} disabled={path.length < 2} className="flex-1 rounded-lg border border-line2 py-1.5 text-xs font-medium hover:bg-canvas disabled:opacity-40">
                  ← 이전 화면
                </button>
                <button onClick={restart} className="flex-1 rounded-lg border border-line2 py-1.5 text-xs font-medium hover:bg-canvas">
                  ⟲ 처음부터
                </button>
              </div>
            </div>

            {/* 옆 정보 */}
            <div className="min-w-0 flex-1 space-y-3 text-[12.5px]">
              {designPanel}
              <div className="rounded-lg bg-canvas p-3">
                <b>가 본 화면 {visited.size} / {total}</b>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                  <div className="h-full bg-accent" style={{ width: `${total ? (visited.size / total) * 100 : 0}%` }} />
                </div>
                <p className="mt-2 text-sub">
                  지나온 길: {path.map((id) => sim.byId.get(id)?.name ?? '?').join(' → ')}
                </p>
              </div>
              {missing.length > 0 ? (
                <div className="rounded-lg border border-line p-3">
                  <b>아직 못 가 본 화면</b>
                  <ul className="mt-1.5 space-y-1">
                    {missing.map((s) => (
                      <li key={s.id} className="flex items-center gap-2">
                        <span className="flex-1">
                          {s.name}
                          {unreachable.has(s.id) && <span className="ml-1.5 rounded bg-danger-bg px-1.5 py-0.5 text-[10.5px] text-danger">들어가는 길 없음</span>}
                        </span>
                        <button onClick={() => jump(s.id)} className="rounded border border-line2 px-2 py-0.5 text-[11px] hover:bg-canvas">
                          바로 보기
                        </button>
                      </li>
                    ))}
                  </ul>
                  {missing.some((s) => unreachable.has(s.id)) && (
                    <p className="mt-2 text-[11.5px] leading-snug text-sub">"들어가는 길 없음"은 시작 화면에서 어떻게 눌러도 닿을 수 없는 화면이에요. 이동 선을 이어 주세요.</p>
                  )}
                </div>
              ) : (
                <p className="rounded-lg bg-accent-bg p-3 text-accent">✓ 모든 화면을 가 봤어요.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
