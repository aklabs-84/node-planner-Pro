import { NODE_META, NODE_TYPES, type NodeType } from '../../core/schema'
import { useProject } from '../../store/project'

export function Palette({
  onAdd,
  collapsed,
  onToggle,
}: {
  onAdd: (type: NodeType) => void
  collapsed: boolean
  onToggle: () => void
}) {
  const nodeCount = useProject((s) => s.project.nodes.length)
  if (collapsed) {
    return (
      <aside data-tour="palette" className="flex w-10 shrink-0 flex-col items-center gap-2 border-r border-line bg-white py-3">
        <button onClick={onToggle} aria-label="보관함 펼치기" title="보관함 펼치기" className="grid h-7 w-7 place-items-center rounded-md text-sub hover:bg-canvas">
          ›
        </button>
        {NODE_TYPES.map((t) => {
          const m = NODE_META[t]
          return (
            <button
              key={t}
              onClick={() => onAdd(t)}
              title={`${m.label} 추가`}
              className="grid h-[26px] w-[26px] place-items-center rounded-[7px] text-xs font-semibold text-white"
              style={{ background: m.color }}
            >
              {m.glyph}
            </button>
          )
        })}
      </aside>
    )
  }
  return (
    <aside data-tour="palette" className="w-[232px] shrink-0 overflow-auto border-r border-line bg-white px-3 py-3.5">
      <div className="mx-1 mb-2 flex items-center justify-between text-[11px] font-semibold tracking-wide text-mute">
        노드 추가 (클릭)
        <button onClick={onToggle} aria-label="보관함 접기" title="보관함 접기" className="grid h-6 w-6 place-items-center rounded-md text-sm text-sub hover:bg-canvas">
          ‹
        </button>
      </div>
      <div className="flex flex-col">
        {NODE_TYPES.map((t) => {
          const m = NODE_META[t]
          return (
            <button
              key={t}
              onClick={() => onAdd(t)}
              className="flex items-center gap-2.5 rounded-lg border border-transparent p-2 text-left hover:border-line hover:bg-canvas"
            >
              <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-[7px] text-xs font-semibold text-white" style={{ background: m.color }}>
                {m.glyph}
              </span>
              <span>
                <b className="block font-medium">{m.label}</b>
                <small className="text-[11.5px] text-mute">{m.hint}</small>
              </span>
            </button>
          )
        })}
      </div>
      <div className="mx-1 mt-6 text-[11px] text-mute">현재 노드 {nodeCount}개</div>
      <p className="mx-1 mt-1 text-[11.5px] leading-relaxed text-mute">
        노드 오른쪽 점을 끌어 다른 노드에 놓으면 선이 이어져요. 선택한 노드나 선은 Delete 키로 지울 수 있어요.
      </p>
    </aside>
  )
}
