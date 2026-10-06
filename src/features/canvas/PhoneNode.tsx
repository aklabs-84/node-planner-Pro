import { useState } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import type { Design } from '../../core/design'
import type { IrScreen } from '../../core/ir'
import { useTour } from '../../lib/useTour'
import { PhoneScreen } from '../preview/PhoneScreen'

export const PHONE_W = 302
export const PHONE_H = 506

export type PhoneData = { screen: IrScreen; design: Design; index: number; total: number }
export type PhoneNodeT = Node<PhoneData, 'phone'>

/** 앱 화면 보기에서 "화면" 노드를 실제 앱 화면 모양으로 그린다. 안의 버튼을 누르면 다음 화면으로 이동해 포커스한다. */
export function PhoneNode({ data, selected }: NodeProps<PhoneNodeT>) {
  const [showEmpty, setShowEmpty] = useState(false)
  const [saved, setSaved] = useState('')
  const goTo = useTour((s) => s.goTo)
  const back = useTour((s) => s.back)
  const canBack = useTour((s) => s.trail.length > 1)
  return (
    <div style={{ width: PHONE_W, borderRadius: 26, outline: selected ? '4px solid #4F46E5' : 'none', outlineOffset: 3, cursor: 'pointer' }}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div
        onClick={(e) => {
          // 버튼을 눌렀을 때는 이동만 하고, 이 화면을 다시 고르는 클릭으로 번지지 않게 한다
          if ((e.target as HTMLElement).closest('button,[role=button],input')) e.stopPropagation()
        }}
      >
        <PhoneScreen screen={data.screen} design={data.design} index={data.index} total={data.total} showEmpty={showEmpty} setShowEmpty={setShowEmpty} saved={saved} setSaved={setSaved} go={goTo} back={back} canBack={canBack} />
      </div>
    </div>
  )
}
