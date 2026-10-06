import { useCallback, useEffect, useRef, useState } from 'react'
import { emptyProject, type NodeType, type Project } from './core/schema'
import { AiKeyDialog } from './features/ai-settings/AiKeyDialog'
import { PreviewDialog } from './features/preview/PreviewDialog'
import { getKey } from './lib/aiKey'
import { AiDraftDialog } from './features/ai-draft/AiDraftDialog'
import { Canvas } from './features/canvas/Canvas'
import { HelpDialog } from './features/help/HelpDialog'
import { initClassLogGuard } from './lib/classlog'
import { GuideTour, useFirstRun } from './features/tour/GuideTour'
import { Inspector } from './features/inspector/Inspector'
import { Palette } from './features/palette/Palette'
import { TopBar } from './features/topbar/TopBar'
import { downloadProject, pickProjectFile } from './lib/io'
import { useUndoKeys } from './lib/useUndoKeys'
import { usePanelCollapsed } from './lib/usePanelCollapsed'
import { useProject } from './store/project'

export function App() {
  const [viewKey, setViewKey] = useState(0)
  const [toast, setToast] = useState<{ msg: string; bad?: boolean } | null>(null)
  const timer = useRef<number>()
  const [leftOff, setLeftOff] = usePanelCollapsed('npp.ui.left.collapsed')
  const [rightOff, setRightOff] = usePanelCollapsed('npp.ui.right.collapsed')
  useUndoKeys()
  useEffect(() => initClassLogGuard(), [])
  const [draftOpen, setDraftOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [keyOpen, setKeyOpen] = useState(false)
  const [keySet, setKeySet] = useState(() => !!getKey())
  const [helpOpen, setHelpOpen] = useState(false)
  const [tourOpen, setTourOpen] = useFirstRun()
  const selectedId = useProject((s) => s.selectedId)
  const selectedEdgeId = useProject((s) => s.selectedEdgeId)

  // 노드나 선을 고르면 접혀 있던 속성 패널을 자동으로 펼친다
  useEffect(() => {
    if (selectedId || selectedEdgeId) setRightOff(false)
  }, [selectedId, selectedEdgeId, setRightOff])

  const say = useCallback((msg: string, bad = false) => {
    setToast({ msg, bad })
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(null), 3000)
  }, [])

  const replace = (p: Project) => {
    useProject.getState().setProject(structuredClone(p))
    setViewKey((k) => k + 1)
  }

  const addNode = (type: NodeType) => {
    const { project, addNode: add } = useProject.getState()
    const i = project.nodes.length
    add(type, { x: 120 + (i % 4) * 40, y: 120 + (i % 5) * 36 })
  }

  const onImport = async () => {
    const r = await pickProjectFile()
    if (!r) return
    if (!r.ok) return say(`가져오지 못했어요: ${r.error}`, true)
    if (!window.confirm('지금 작업 중인 내용이 가져온 파일로 바뀌어요. 계속할까요?')) return
    replace(r.project)
    say(`"${r.project.name}"을(를) 가져왔어요`)
  }

  const confirmReplace = (msg: string, p: Project) => {
    if (window.confirm(msg)) replace(p)
  }

  return (
    <div className="flex h-full flex-col">
      <TopBar
        onExport={() => downloadProject(useProject.getState().project)}
        onImport={onImport}
        onExample={(p) => confirmReplace(`지금 작업 중인 내용이 "${p.name}" 예시로 바뀌어요. 계속할까요?`, p)}
        onHelp={() => setHelpOpen(true)}
        onAiDraft={() => setDraftOpen(true)}
        onPreview={() => setPreviewOpen(true)}
        onAiSettings={() => setKeyOpen(true)}
        aiKeySet={keySet}
        onNew={() => confirmReplace('지금 작업 중인 내용이 지워져요. 먼저 내보내기를 해 두셨나요?', emptyProject())}
      />
      <div className="flex min-h-0 flex-1">
        <Palette onAdd={addNode} collapsed={leftOff} onToggle={() => setLeftOff(!leftOff)} />
        <main data-tour="canvas" className="relative min-w-0 flex-1">
          <Canvas key={viewKey} />
          {toast && (
            <div
              role="status"
              className={`absolute left-1/2 top-3.5 -translate-x-1/2 rounded-lg px-3.5 py-2 text-xs text-white ${
                toast.bad ? 'bg-danger' : 'bg-ink'
              }`}
            >
              {toast.msg}
            </div>
          )}
        </main>
        <Inspector collapsed={rightOff} onToggle={() => setRightOff(!rightOff)} />
      </div>
      {previewOpen && <PreviewDialog onClose={() => setPreviewOpen(false)} />}
      {keyOpen && <AiKeyDialog onClose={() => setKeyOpen(false)} onChange={() => setKeySet(!!getKey())} />}
      {draftOpen && (
        <AiDraftDialog
          onClose={() => setDraftOpen(false)}
          onDone={(p) => {
            replace(p)
            setDraftOpen(false)
            setRightOff(false)
            say(`"${p.name}" 초안을 만들었어요. "점검" 탭으로 확인해 보세요 (Ctrl/⌘+Z로 되돌리기)`)
          }}
        />
      )}
      {helpOpen && (
        <HelpDialog
          onClose={() => setHelpOpen(false)}
          onTour={() => {
            setHelpOpen(false)
            setTourOpen(true)
          }}
        />
      )}
      {tourOpen && <GuideTour onClose={() => setTourOpen(false)} />}
    </div>
  )
}
