import { useMemo, useState } from 'react'
import { countBySeverity, lint, SEVERITY_LABEL, type Severity } from '../../core/lint'
import type { AiFinding } from '../../core/aicheck'
import { runAiCheck } from '../../lib/aiCheck'
import { useFocus } from '../../lib/useFocus'
import { useProject } from '../../store/project'

const TONE: Record<Severity, { dot: string; chip: string }> = {
  error: { dot: 'bg-danger', chip: 'bg-danger-bg text-danger' },
  warn: { dot: 'bg-[#D97706]', chip: 'bg-[#FEF3C7] text-[#B45309]' },
  suggest: { dot: 'bg-accent', chip: 'bg-accent-bg text-accent' },
}

export function LintPanel({ onPick }: { onPick: () => void }) {
  const project = useProject((s) => s.project)
  const issues = useMemo(() => lint(project), [project])
  const count = countBySeverity(issues)
  const [ai, setAi] = useState<{ state: 'idle' | 'loading' | 'done' | 'error'; findings: AiFinding[]; error?: string }>({ state: 'idle', findings: [] })

  const askAi = async () => {
    setAi({ state: 'loading', findings: [] })
    const r = await runAiCheck(project)
    setAi(r.ok ? { state: 'done', findings: r.findings } : { state: 'error', findings: [], error: r.error })
  }

  const go = (nodeId?: string) => {
    if (!nodeId) return
    onPick()
    useProject.getState().select(nodeId)
    useFocus.getState().focus(nodeId)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-3.5">
        <b className="text-[15px]">기획 점검</b>
        <p className="mt-1 text-xs text-mute">AI가 헷갈리거나 추측하게 될 부분을 미리 찾아 줘요. 누르면 그 노드로 이동해요.</p>
        <p className="mt-1.5 text-[11.5px] leading-snug text-mute">
          L001 같은 번호는 <b className="font-medium">린트(Lint)</b> 규칙 번호예요. 린트는 실수나 빠진 부분을 미리 훑어 찾아 주는 검사로, 맞춤법 검사기와 비슷해요. AI 없이 규칙으로 계산해요.
        </p>
        <div className="mt-2.5 flex gap-1.5 text-xs">
          {(['error', 'warn', 'suggest'] as const).map((s) => (
            <span key={s} className={`rounded-full px-2 py-0.5 font-medium ${TONE[s].chip}`}>
              {SEVERITY_LABEL[s]} {count[s]}
            </span>
          ))}
        </div>
      </div>
      <ul className="m-4 mt-3 flex-1 space-y-2 overflow-auto">
        {issues.length === 0 && (
          <li className="rounded-lg border border-line bg-canvas p-3 text-[13px] text-sub">✓ 점검을 모두 통과했어요. 지시문을 만들어도 좋아요.</li>
        )}
        {issues.map((i, k) => (
          <li key={`${i.id}-${i.nodeIds.join()}-${k}`}>
            <button
              onClick={() => go(i.nodeIds[0])}
              disabled={!i.nodeIds[0]}
              className="w-full rounded-lg border border-line2 bg-white p-2.5 text-left hover:bg-canvas disabled:cursor-default disabled:hover:bg-white"
            >
              <span className="flex items-start gap-2">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TONE[i.severity].dot}`} aria-label={SEVERITY_LABEL[i.severity]} />
                <span>
                  <span className="block text-[13px] font-medium">
                    {i.message} <span className="font-normal text-mute">{i.id}</span>
                  </span>
                  <span className="mt-0.5 block text-[11.5px] leading-snug text-sub">{i.hint}</span>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mx-4 mb-4 rounded-lg border border-line bg-canvas p-3">
        <div className="flex items-center justify-between gap-2">
          <b className="text-[13px]">AI 점검 (선택)</b>
          <button
            onClick={askAi}
            disabled={ai.state === 'loading'}
            className="rounded-lg border border-line2 bg-white px-2.5 py-1 text-xs font-medium hover:bg-canvas disabled:opacity-50"
          >
            {ai.state === 'loading' ? '확인 중…' : 'AI에게 물어보기'}
          </button>
        </div>
        <p className="mt-1 text-[11.5px] leading-snug text-mute">규칙으로 못 찾는 "의미" 문제를 AI가 한 번 더 봐요. 누를 때만 기획 내용이 서버로 전달돼요.</p>
        {ai.state === 'error' && (
          <p role="alert" className="mt-2 text-xs text-danger">
            {ai.error}
          </p>
        )}
        {ai.state === 'done' && ai.findings.length === 0 && <p className="mt-2 text-xs text-sub">✓ AI가 더 지적할 부분을 찾지 못했어요.</p>}
        {ai.findings.length > 0 && (
          <ul aria-label="AI 점검 결과" className="mt-2 space-y-1.5">
            {ai.findings.map((f, k) => (
              <li key={k} className="rounded-md bg-white p-2 text-[12px]">
                <span className="font-medium">{f.severity === 'warn' ? '⚠ ' : '💡 '}{f.title}</span>
                {f.detail && <span className="mt-0.5 block leading-snug text-sub">{f.detail}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
