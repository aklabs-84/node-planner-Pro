import { useEffect } from 'react'
import { useProject } from '../store/project'

/** Ctrl/Cmd+Z 되돌리기, Ctrl/Cmd+Shift+Z 또는 Ctrl+Y 다시 실행. 글을 쓰는 중에는 입력칸 자체의 되돌리기를 쓴다. */
export function useUndoKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      const k = e.key.toLowerCase()
      const { undo, redo } = useProject.getState()
      if (k === 'z') {
        e.preventDefault()
        e.shiftKey ? redo() : undo()
      } else if (k === 'y' && !e.shiftKey) {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
