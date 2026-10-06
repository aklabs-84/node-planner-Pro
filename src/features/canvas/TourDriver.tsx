import { useEffect } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useTour } from '../../lib/useTour'
import { PHONE_H, PHONE_W } from './PhoneNode'

/** 앱 화면 보기에서 고른 화면이 캔버스 가운데에 읽히는 크기로 오게 옮긴다. */
export function TourDriver() {
  const { setCenter, getNode } = useReactFlow()
  const tick = useTour((s) => s.tick)

  useEffect(() => {
    if (tick === 0) return
    const n = getNode(useTour.getState().focusId ?? '')
    if (n) setCenter(n.position.x + PHONE_W / 2, n.position.y + PHONE_H / 2, { zoom: 1, duration: 400 })
  }, [tick, setCenter, getNode])

  return null
}
