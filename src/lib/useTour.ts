import { create } from 'zustand'
import { useProject } from '../store/project'

interface Tour {
  /** 지나온 화면들(맨 끝이 지금 보고 있는 화면) */
  trail: string[]
  playing: boolean
  /** 캔버스를 옮기라는 신호(숫자가 바뀔 때마다 옮김) */
  tick: number
  focusId: string | null
  goTo: (id: string) => void
  back: () => void
  setPlaying: (v: boolean) => void
}

/** 앱 화면 보기에서 화면을 따라가는 상태. 저장하지 않는 보기용 상태다. */
export const useTour = create<Tour>((set, get) => ({
  trail: [],
  playing: false,
  tick: 0,
  focusId: null,
  goTo: (id) => {
    useProject.getState().select(id)
    set((s) => ({ trail: s.trail[s.trail.length - 1] === id ? s.trail : [...s.trail, id].slice(-50), focusId: id, tick: s.tick + 1 }))
  },
  back: () => {
    const trail = get().trail.slice(0, -1)
    const id = trail[trail.length - 1]
    if (!id) return
    useProject.getState().select(id)
    set((s) => ({ trail, focusId: id, tick: s.tick + 1 }))
  },
  setPlaying: (playing) => set({ playing }),
}))
