import { create } from 'zustand'

export type EdgeStyle = 'smoothstep' | 'default'

const KEY = 'npp.ui.edgeStyle'

const read = (): EdgeStyle => {
  try {
    return localStorage.getItem(KEY) === 'default' ? 'default' : 'smoothstep'
  } catch {
    return 'smoothstep'
  }
}

/** 선 모양(꺾은선/곡선). 프로젝트가 아니라 이 브라우저의 보기 설정으로 저장한다. */
export const useEdgeStyle = create<{ style: EdgeStyle; setStyle: (s: EdgeStyle) => void }>((set) => ({
  style: read(),
  setStyle: (style) => {
    set({ style })
    try {
      localStorage.setItem(KEY, style)
    } catch {
      /* 저장 실패는 무시 */
    }
  },
}))
