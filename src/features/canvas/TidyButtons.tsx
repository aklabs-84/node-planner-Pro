import { useState } from 'react'
import { Panel, useReactFlow } from '@xyflow/react'
import { autoLayout, type Positions } from '../../core/layout'
import { useProject } from '../../store/project'
import { EdgeStyleToggle } from './EdgeStyleToggle'

const btn = 'rounded-lg border border-line2 bg-white px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-canvas'

/** 노드를 흐름대로 정리하고, 마음에 안 들면 직전 위치로 되돌린다. */
export function TidyButtons() {
  const { fitView } = useReactFlow()
  const [before, setBefore] = useState<Positions | null>(null)

  const refit = () => window.setTimeout(() => fitView({ padding: 0.2, maxZoom: 1, duration: 300 }), 60)

  const tidy = () => {
    const { project, moveNodes } = useProject.getState()
    if (project.nodes.length === 0) return
    setBefore(Object.fromEntries(project.nodes.map((n) => [n.id, { x: n.x, y: n.y }])))
    moveNodes(autoLayout(project))
    refit()
  }

  const undo = () => {
    if (!before) return
    useProject.getState().moveNodes(before)
    setBefore(null)
    refit()
  }

  return (
    <Panel position="top-left" className="flex gap-2">
      <button onClick={tidy} className={btn} title="노드를 왼쪽에서 오른쪽 흐름으로 깔끔하게 놓아요">
        ✦ 자동 정리
      </button>
      {before && (
        <button onClick={undo} className={btn}>
          정리 취소
        </button>
      )}
      <EdgeStyleToggle />
    </Panel>
  )
}
