import { useEffect, useState } from 'react'
import type { Project } from '../../core/schema'
import { EXAMPLES } from '../../examples'
import { useProject } from '../../store/project'

export function TopBar({
  onExport,
  onImport,
  onExample,
  onNew,
  onHelp,
  onAiDraft,
  onPreview,
  onAiSettings,
  aiKeySet,
}: {
  onExport: () => void
  onImport: () => void
  onExample: (p: Project) => void
  onNew: () => void
  onHelp: () => void
  onAiDraft: () => void
  onPreview: () => void
  onAiSettings: () => void
  aiKeySet: boolean
}) {
  const name = useProject((s) => s.project.name)
  const setName = useProject((s) => s.setName)
  const savedAt = useProject((s) => s.savedAt)
  const [label, setLabel] = useState('저장됨')
  const [menu, setMenu] = useState(false)
  const canUndo = useProject((s) => s.past.length > 0)
  const canRedo = useProject((s) => s.future.length > 0)
  const undo = useProject((s) => s.undo)
  const redo = useProject((s) => s.redo)

  useEffect(() => {
    setLabel('저장 중…')
    const t = setTimeout(() => setLabel('저장됨'), 400)
    return () => clearTimeout(t)
  }, [savedAt])

  return (
    <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-line bg-white px-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <i className="grid h-6 w-6 place-items-center rounded-[7px] bg-accent">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="3" cy="3" r="1.6" />
            <circle cx="11" cy="7" r="1.6" />
            <circle cx="3" cy="11" r="1.6" />
            <path d="M4.4 3.6L9.6 6.4M4.4 10.4L9.6 7.6" />
          </svg>
        </i>
        노드 기획 PRO
      </div>
      <span className="h-5 w-px bg-line" />
      <input
        aria-label="프로젝트 이름"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-48 rounded-md bg-transparent px-2 py-1 font-medium outline-none hover:bg-canvas focus:bg-canvas"
      />
      <span className="text-xs text-mute">{label}</span>
      <span className="flex-1" />
      <div className="flex items-center gap-1">
        <button onClick={undo} disabled={!canUndo} aria-label="되돌리기" title="되돌리기 (Ctrl/⌘+Z)" className="grid h-8 w-8 place-items-center rounded-lg border border-line2 bg-white hover:bg-canvas disabled:opacity-35 disabled:hover:bg-white">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5.5 3L2.5 6l3 3" /><path d="M2.5 6H10a3.5 3.5 0 010 7H6" /></svg>
        </button>
        <button onClick={redo} disabled={!canRedo} aria-label="다시 실행" title="다시 실행 (Ctrl/⌘+Shift+Z)" className="grid h-8 w-8 place-items-center rounded-lg border border-line2 bg-white hover:bg-canvas disabled:opacity-35 disabled:hover:bg-white">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 3l3 3-3 3" /><path d="M13.5 6H6a3.5 3.5 0 000 7h4" /></svg>
        </button>
      </div>
      <button onClick={onPreview} className="rounded-lg border border-line2 bg-white px-3 py-1.5 font-medium hover:bg-canvas">
        ▶ 미리보기
      </button>
      <button onClick={onHelp} className="rounded-lg px-3 py-1.5 font-medium text-sub hover:bg-canvas">
        사용 안내
      </button>
      <button onClick={onAiSettings} aria-label="AI 설정" title={aiKeySet ? '내 Gemini 키가 설정되어 있어요' : 'AI에 쓸 내 Gemini 키 입력'} className="rounded-lg px-3 py-1.5 font-medium text-sub hover:bg-canvas">
        AI 설정{aiKeySet && <span className="ml-1 text-accent">●</span>}
      </button>
      <button onClick={onAiDraft} className="rounded-lg border border-accent bg-accent-bg px-3 py-1.5 font-medium text-accent hover:opacity-90">
        ✨ AI로 초안 만들기
      </button>
      <button onClick={onNew} className="rounded-lg border border-line2 bg-white px-3 py-1.5 font-medium hover:bg-canvas">
        새로 만들기
      </button>
      <div className="relative">
        <button
          onClick={() => setMenu(!menu)}
          aria-haspopup="menu"
          aria-expanded={menu}
          className="rounded-lg border border-line2 bg-white px-3 py-1.5 font-medium hover:bg-canvas"
        >
          예시 불러오기 ▾
        </button>
        {menu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
            <div role="menu" className="absolute right-0 top-full z-20 mt-1 w-72 rounded-xl border border-line bg-white p-1.5 shadow-lg">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.id}
                  role="menuitem"
                  onClick={() => {
                    setMenu(false)
                    onExample(ex.project)
                  }}
                  className="block w-full rounded-lg px-2.5 py-2 text-left hover:bg-canvas"
                >
                  <b className="text-[13px]">{ex.title}</b>
                  <span className="mt-0.5 block text-[11.5px] leading-snug text-sub">{ex.desc}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <button onClick={onImport} className="rounded-lg border border-line2 bg-white px-3 py-1.5 font-medium hover:bg-canvas">
        가져오기
      </button>
      <button onClick={onExport} className="rounded-lg border border-accent bg-accent px-3 py-1.5 font-medium text-white hover:bg-indigo-700">
        내보내기
      </button>
    </header>
  )
}
