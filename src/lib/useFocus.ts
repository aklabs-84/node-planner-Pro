import { create } from 'zustand'

/** 점검 목록에서 노드를 누르면 캔버스가 그 노드로 이동하도록 알려 주는 신호 */
export const useFocus = create<{ nodeId: string | null; tick: number; focus: (id: string) => void }>((set, get) => ({
  nodeId: null,
  tick: 0,
  focus: (id) => set({ nodeId: id, tick: get().tick + 1 }),
}))
