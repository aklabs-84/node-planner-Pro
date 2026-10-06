import { create } from 'zustand'

export type ViewMode = 'node' | 'app'

const KEY = 'npp.ui.canvasView'

const read = (): ViewMode => {
  try {
    return localStorage.getItem(KEY) === 'app' ? 'app' : 'node'
  } catch {
    return 'node'
  }
}

/** 캔버스를 노드 모양으로 볼지, 앱 화면 모양으로 볼지. 프로젝트가 아니라 이 브라우저의 보기 설정이다. */
export const useViewMode = create<{ mode: ViewMode; setMode: (m: ViewMode) => void }>((set) => ({
  mode: read(),
  setMode: (mode) => {
    set({ mode })
    try {
      localStorage.setItem(KEY, mode)
    } catch {
      /* 저장 실패는 무시 */
    }
  },
}))
