import { useEffect } from 'react'
import { useReactFlow } from '@xyflow/react'
import { NODE_H, NODE_W } from '../../core/layout'
import { useFocus } from '../../lib/useFocus'
import { useProject } from '../../store/project'

/** 점검 목록에서 고른 노드가 화면 가운데 오도록 캔버스를 옮긴다. */
export function FocusWatcher() {
  const { setCenter, getZoom } = useReactFlow()
  const tick = useFocus((s) => s.tick)

  useEffect(() => {
    if (tick === 0) return
    const id = useFocus.getState().nodeId
    const n = useProject.getState().project.nodes.find((x) => x.id === id)
    if (n) setCenter(n.x + NODE_W / 2, n.y + NODE_H / 2, { zoom: Math.max(getZoom(), 0.9), duration: 300 })
  }, [tick, setCenter, getZoom])

  return null
}
