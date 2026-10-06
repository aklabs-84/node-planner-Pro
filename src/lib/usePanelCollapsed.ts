import { useCallback, useState } from 'react'

const read = (key: string) => {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

/** 패널 접힘 상태. 브라우저에 저장해서 새로고침해도 유지한다. */
export function usePanelCollapsed(key: string) {
  const [collapsed, set] = useState(() => read(key))
  const setCollapsed = useCallback(
    (v: boolean) => {
      set(v)
      try {
        localStorage.setItem(key, v ? '1' : '0')
      } catch {
        /* 저장 실패는 무시 */
      }
    },
    [key],
  )
  return [collapsed, setCollapsed] as const
}
