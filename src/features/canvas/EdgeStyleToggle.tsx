import { useEdgeStyle, type EdgeStyle } from '../../lib/useEdgeStyle'

const OPTIONS: { value: EdgeStyle; label: string }[] = [
  { value: 'smoothstep', label: '꺾은선' },
  { value: 'default', label: '곡선' },
]

export function EdgeStyleToggle() {
  const style = useEdgeStyle((s) => s.style)
  const setStyle = useEdgeStyle((s) => s.setStyle)
  return (
    <div role="group" aria-label="선 모양" className="flex overflow-hidden rounded-lg border border-line2 bg-white text-xs font-medium shadow-sm">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => setStyle(o.value)}
          aria-pressed={style === o.value}
          className={`px-3 py-1.5 ${style === o.value ? 'bg-accent-bg text-accent' : 'hover:bg-canvas'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
