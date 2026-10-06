import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { NODE_META, type PlanNode } from '../../core/schema'

export type CardData = { node: PlanNode }
export type CardNode = Node<CardData, 'card'>

export function PlanNodeCard({ data, selected }: NodeProps<CardNode>) {
  const n = data.node
  const meta = NODE_META[n.type]
  return (
    <div
      className={`w-60 rounded-xl border-[1.5px] bg-white px-3 pb-3 pt-2.5 shadow-sm ${
        selected ? 'border-accent ring-4 ring-accent-bg' : 'border-line hover:border-line2'
      }`}
    >
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: meta.color }}>
        <span
          className="grid h-[18px] w-[18px] place-items-center rounded-[5px] text-[10px] text-white"
          style={{ background: meta.color }}
        >
          {meta.glyph}
        </span>
        {meta.label}
        {n.isStart && <span className="ml-auto rounded-full bg-accent-bg px-2 py-px text-accent">시작</span>}
      </div>
      <div className="mb-0.5 text-sm font-semibold">{n.name || '이름 없음'}</div>
      <div className={`line-clamp-2 min-h-[17px] text-xs leading-snug ${n.purpose ? 'text-sub' : 'italic text-mute'}`}>
        {n.purpose || '목적을 적어 주세요'}
      </div>
    </div>
  )
}
