import { useMemo, useState } from 'react'
import { countBySeverity, lint } from '../../core/lint'
import { compile, TARGETS, type TargetId } from '../../core/compile'
import { inClass, markClean, submitToClass } from '../../lib/classlog'
import { useProject } from '../../store/project'

const KEY = 'npp.ui.compileTarget'

function loadTarget(): TargetId {
  try {
    const v = localStorage.getItem(KEY)
    if (TARGETS.some((t) => t.id === v)) return v as TargetId
  } catch {
    /* 저장소를 못 쓰는 환경 */
  }
  return 'claude'
}

export function CompilePanel() {
  const project = useProject((s) => s.project)
  const [target, setTarget] = useState<TargetId>(loadTarget)
  const [copied, setCopied] = useState(false)
  const [sent, setSent] = useState<'idle' | 'busy' | 'done' | string>('idle')
  const errors = useMemo(() => countBySeverity(lint(project)).error, [project])
  const text = useMemo(() => compile(project, target), [project, target])

  const pick = (id: TargetId) => {
    setTarget(id)
    try {
      localStorage.setItem(KEY, id)
    } catch {
      /* 무시 */
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* 복사 권한이 없으면 아래 텍스트를 직접 선택해 복사 */
    }
  }

  const submit = async () => {
    setSent('busy')
    try {
      await submitToClass({ title: project.name || '노드 기획', textContent: text })
      markClean()
      setSent('done')
    } catch (e) {
      setSent(e instanceof Error ? e.message : '제출하지 못했어요')
    }
  }

  const download = () => {
    const ext = target === 'markdown' ? 'md' : 'txt'
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name || '기획'}-${target}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-3.5">
        <b className="text-[15px]">AI에게 줄 지시문</b>
        <p className="mt-1 text-xs text-mute">쓸 도구를 고르면 그 도구에 맞게 지시문이 만들어져요.</p>
        <div className="mt-2.5 flex flex-col gap-1.5" role="radiogroup" aria-label="지시문 대상 도구">
          {TARGETS.map((t) => {
            const on = t.id === target
            return (
              <button
                key={t.id}
                role="radio"
                aria-checked={on}
                onClick={() => pick(t.id)}
                className={`rounded-lg border px-2.5 py-1.5 text-left text-[13px] ${
                  on ? 'border-accent bg-accent-bg' : 'border-line2 bg-white hover:bg-canvas'
                }`}
              >
                <span className={on ? 'font-medium' : ''}>{t.label}</span>
                <span className="mt-0.5 block text-[11.5px] leading-snug text-sub">{t.when}</span>
                {on && (
                  <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-[11.5px] leading-snug text-sub">
                    {t.traits.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                )}
              </button>
            )
          })}
        </div>
        {errors > 0 && (
          <p role="alert" className="mt-2.5 rounded-lg bg-danger-bg px-2.5 py-1.5 text-xs text-danger">
            점검에서 오류 {errors}개가 나왔어요. 그래도 만들 수는 있지만, 먼저 "점검" 탭에서 고치면 AI가 덜 헷갈려요.
          </p>
        )}
        <div className="mt-2.5 flex gap-2">
          <button onClick={copy} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">
            {copied ? '복사됨 ✓' : '복사하기'}
          </button>
          <button onClick={download} className="rounded-lg border border-line2 px-3 py-1.5 text-xs font-medium hover:bg-canvas">
            파일로 저장
          </button>
        </div>
        {inClass() && (
          <div className="mt-2.5">
            <button
              onClick={submit}
              disabled={sent === 'busy'}
              className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {sent === 'busy' ? '제출하는 중…' : sent === 'done' ? '제출했어요 ✓ (다시 제출하기)' : '📤 수업에 제출하기'}
            </button>
            <p className="mt-1 text-[11.5px] text-mute">지금 보이는 지시문이 선생님 교실로 제출돼요. 작성 중에는 창을 닫지 마세요.</p>
            {sent !== 'idle' && sent !== 'busy' && sent !== 'done' && (
              <p role="alert" className="mt-1 text-xs text-danger">
                {sent}
              </p>
            )}
          </div>
        )}
      </div>
      <pre
        aria-label="지시문 미리보기"
        className="m-4 mt-3 flex-1 select-text overflow-auto whitespace-pre-wrap rounded-lg border border-line bg-canvas p-3 text-[12px] leading-relaxed"
      >
        {text}
      </pre>
    </div>
  )
}
