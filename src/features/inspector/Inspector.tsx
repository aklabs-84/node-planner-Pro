import { useEffect, useRef, useState, type ReactNode } from 'react'
import { EDGE_KINDS, EDGE_META, NODE_META, type EdgeKind } from '../../core/schema'
import { lint } from '../../core/lint'
import { useProject } from '../../store/project'
import { LintPanel } from '../lint-panel/LintPanel'
import { CompilePanel } from '../compile-panel/CompilePanel'

const inputCls =
  'w-full rounded-lg border border-line2 bg-white px-2.5 py-2 text-[13px] outline-none focus:border-accent focus:ring-2 focus:ring-accent-bg'

const lintCount = (p: Parameters<typeof lint>[0]) => lint(p).length

const tabCls = (on: boolean) => `px-3 pb-2.5 pt-3 font-medium ${on ? 'border-b-2 border-accent' : 'text-sub hover:text-ink'}`

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="mt-3 block">
      <span className="mb-1 block text-xs font-medium text-sub">
        {label} {hint && <span className="font-normal text-mute">— {hint}</span>}
      </span>
      {children}
    </label>
  )
}

function ProjectInfo() {
  const project = useProject((s) => s.project)
  const setName = useProject((s) => s.setName)
  const updateMeta = useProject((s) => s.updateMeta)
  return (
    <>
      <b className="text-[15px]">프로젝트 정보</b>
      <p className="mt-1 text-xs text-mute">노드나 선을 누르면 여기서 편집할 수 있어요.</p>
      <Field label="앱 이름">
        <input className={inputCls} value={project.name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="만들려는 것" hint="한두 문장으로">
        <textarea className={`${inputCls} min-h-[72px] resize-y`} value={project.goal} onChange={(e) => updateMeta({ goal: e.target.value })} />
      </Field>
      <Field label="쓰는 사람">
        <input className={inputCls} value={project.audience} onChange={(e) => updateMeta({ audience: e.target.value })} />
      </Field>
    </>
  )
}

function NodeForm({ id }: { id: string }) {
  const node = useProject((s) => s.project.nodes.find((n) => n.id === id))
  const update = useProject((s) => s.updateNode)
  const remove = useProject((s) => s.removeNode)
  const setStart = useProject((s) => s.setStart)
  if (!node) return null
  const m = NODE_META[node.type]
  return (
    <>
      <div className="flex items-center gap-2">
        <span className="grid h-[26px] w-[26px] place-items-center rounded-[7px] text-xs font-semibold text-white" style={{ background: m.color }}>
          {m.glyph}
        </span>
        <b className="text-[15px]">{m.label} 노드</b>
      </div>
      <Field label="이름">
        <input className={inputCls} value={node.name} onChange={(e) => update(id, { name: e.target.value })} />
      </Field>
      <Field label="목적" hint="AI가 읽는 한 줄 설명">
        <textarea
          className={`${inputCls} min-h-[76px] resize-y leading-relaxed`}
          placeholder="이 노드가 하는 일을 적어 주세요"
          value={node.purpose}
          onChange={(e) => update(id, { purpose: e.target.value })}
        />
      </Field>
      {node.type === 'data' && (
        <Field label="저장할 필드" hint="쉼표로 구분">
          <input className={inputCls} value={node.fields ?? ''} onChange={(e) => update(id, { fields: e.target.value })} />
        </Field>
      )}
      {node.type === 'screen' && (
        <div className="mt-3 flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!node.isStart} onChange={() => setStart(id)} />
            시작 화면으로 지정
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!node.hasList} onChange={(e) => update(id, { hasList: e.target.checked })} />
            목록을 보여주는 화면이에요
          </label>
          {node.hasList && (
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!node.emptyState} onChange={(e) => update(id, { emptyState: e.target.checked })} />
              비었을 때 보여줄 안내가 있어요
            </label>
          )}
        </div>
      )}
      <button
        onClick={() => remove(id)}
        className="mt-5 rounded-lg border border-line2 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger-bg"
      >
        노드 삭제
      </button>
    </>
  )
}

function EdgeForm({ id }: { id: string }) {
  const edge = useProject((s) => s.project.edges.find((e) => e.id === id))
  const nodes = useProject((s) => s.project.nodes)
  const update = useProject((s) => s.updateEdge)
  const remove = useProject((s) => s.removeEdge)
  if (!edge) return null
  const name = (nid: string) => nodes.find((n) => n.id === nid)?.name ?? '?'
  return (
    <>
      <b className="text-[15px]">연결선</b>
      <p className="mt-1 text-xs text-mute">
        {name(edge.from)} → {name(edge.to)}
      </p>
      <Field label="종류">
        <select
          className={inputCls}
          value={edge.kind}
          onChange={(e) => {
            const kind = e.target.value as EdgeKind
            const wasDefault = edge.label === EDGE_META[edge.kind].label
            update(id, { kind, ...(wasDefault ? { label: EDGE_META[kind].label } : {}) })
          }}
        >
          {EDGE_KINDS.map((k) => (
            <option key={k} value={k}>
              {EDGE_META[k].label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="선 이름">
        <input className={inputCls} value={edge.label} onChange={(e) => update(id, { label: e.target.value })} />
      </Field>
      <button
        onClick={() => remove(id)}
        className="mt-5 rounded-lg border border-line2 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger-bg"
      >
        선 삭제
      </button>
    </>
  )
}

export function Inspector({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const selectedId = useProject((s) => s.selectedId)
  const selectedEdgeId = useProject((s) => s.selectedEdgeId)
  const [tab, setTab] = useState<'props' | 'lint' | 'compile'>('props')
  // 노드나 선을 고르면 속성 탭으로 돌아온다
  // (점검 목록에서 누른 경우는 점검 탭에 그대로 머문다)
  const fromLint = useRef(false)
  const issueCount = useProject((s) => lintCount(s.project))
  useEffect(() => {
    if (fromLint.current) fromLint.current = false
    else if (selectedId || selectedEdgeId) setTab('props')
  }, [selectedId, selectedEdgeId])
  if (collapsed) {
    return (
      <aside className="flex w-10 shrink-0 flex-col items-center gap-3 border-l border-line bg-white py-3">
        <button onClick={onToggle} aria-label="속성 패널 펼치기" title="속성 패널 펼치기" className="grid h-7 w-7 place-items-center rounded-md text-sub hover:bg-canvas">
          ‹
        </button>
        <span className="text-xs font-medium text-sub [writing-mode:vertical-rl]">속성 · 점검 · 지시문</span>
      </aside>
    )
  }
  return (
    <aside className="flex w-[348px] shrink-0 flex-col border-l border-line bg-white">
      <div className="flex items-center border-b border-line px-2">
        <button onClick={() => setTab('props')} className={tabCls(tab === 'props')}>
          속성
        </button>
        <button data-tour="tab-lint" onClick={() => setTab('lint')} className={tabCls(tab === 'lint')}>
          점검
          {issueCount > 0 && <span className="ml-1 rounded-full bg-danger-bg px-1.5 text-[11px] text-danger">{issueCount}</span>}
        </button>
        <button data-tour="tab-compile" onClick={() => setTab('compile')} className={tabCls(tab === 'compile')}>
          지시문
        </button>
        <span className="flex-1" />
        <button onClick={onToggle} aria-label="속성 패널 접기" title="속성 패널 접기" className="grid h-6 w-6 place-items-center rounded-md text-sm text-sub hover:bg-canvas">
          ›
        </button>
      </div>
      {tab === 'lint' ? (
        <div className="min-h-0 flex-1">
          <LintPanel
            onPick={() => {
              fromLint.current = true
              window.setTimeout(() => (fromLint.current = false), 100)
            }}
          />
        </div>
      ) : tab === 'compile' ? (
        <div className="min-h-0 flex-1">
          <CompilePanel />
        </div>
      ) : (
        <div className="flex-1 overflow-auto px-4 py-3.5" key={selectedId ?? selectedEdgeId ?? 'none'}>
          {selectedId ? <NodeForm id={selectedId} /> : selectedEdgeId ? <EdgeForm id={selectedEdgeId} /> : <ProjectInfo />}
        </div>
      )}
    </aside>
  )
}
