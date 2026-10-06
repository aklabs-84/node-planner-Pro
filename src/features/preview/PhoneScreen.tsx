import type { CSSProperties, ReactNode } from 'react'
import { LAYOUTS, themeVars, THEMES, type Design } from '../../core/design'
import type { IrScreen } from '../../core/ir'

export interface PhoneProps {
  screen: IrScreen
  design: Design
  /** 전체 화면 중 이 화면의 순번(1부터)과 개수 */
  index: number
  total: number
  showEmpty: boolean
  setShowEmpty: (v: boolean) => void
  saved: string
  setSaved: (s: string) => void
  go: (id: string) => void
  back: () => void
  canBack: boolean
}

const card: CSSProperties = { background: 'var(--sf)', border: 'var(--bw) solid var(--ln)', borderRadius: 'var(--r)' }
const soft: CSSProperties = { background: 'var(--as)', borderRadius: 'calc(var(--r) - 3px)' }
const accentBtn: CSSProperties = { background: 'var(--ac)', color: 'var(--on)', border: 'var(--bw) solid var(--ln)', borderRadius: 'var(--r)', fontWeight: 500 }
const outlineBtn: CSSProperties = { border: 'var(--bw) solid var(--ln)', borderRadius: 'var(--r)', fontWeight: 500, background: 'transparent' }
const mu: CSSProperties = { color: 'var(--mu)' }
const BAD = '#DC2626'

const linkLabel = (l: { label: string; toName: string }) => (l.label && l.label !== '이동' ? l.label : l.toName)

/** 화면 하나를 선택한 디자인(레이아웃 × 테마)으로 그린다. 기획 내용만 바뀌고, 모양은 디자인이 정한다. */
export function PhoneScreen(p: PhoneProps) {
  const { screen: s, design } = p
  const theme = THEMES[design.theme]
  const root: CSSProperties = {
    ...(themeVars(design.theme) as CSSProperties),
    background: 'var(--bg)',
    color: 'var(--ink)',
    fontFamily: theme.font === 'serif' ? 'Georgia, "Noto Serif KR", serif' : 'inherit',
    border: 'var(--bw) solid var(--ln)',
    borderRadius: 22,
    height: 500,
    fontSize: 12.5,
    lineHeight: 1.45,
  }

  const dead = s.goesTo.length === 0
  const Purpose = () => <p style={s.purpose ? mu : { color: BAD }}>{s.purpose || '⚠ 이 화면의 목적이 비어 있어요'}</p>
  const Reads = () => (s.reads.length ? <p style={{ ...soft, padding: '6px 8px', ...mu }}>📖 불러와서 보여줘요: {s.reads.join(', ')}</p> : null)
  const Conds = () => (
    <>
      {s.conditions.map((c) => (
        <p key={c.name} style={{ background: '#FEF3C7', color: '#92400E', borderRadius: 8, padding: '6px 8px' }}>
          🔒 먼저 확인: {c.name}
          {c.purpose ? ` — ${c.purpose}` : ''}
        </p>
      ))}
      {s.externals.length > 0 && <p style={mu}>🔗 연결된 서비스: {s.externals.join(', ')}</p>}
      {s.roles.length > 0 && <p style={mu}>👤 열 수 있는 사람: {s.roles.join(', ')}</p>}
      {s.notifies.length > 0 && <p style={mu}>🔔 관련 알림: {s.notifies.join(', ')}</p>}
    </>
  )
  const Comps = ({ grid }: { grid?: boolean }) =>
    s.components.length ? (
      <div style={grid ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 } : { display: 'flex', flexDirection: 'column', gap: 8 }}>
        {s.components.map((c) => (
          <div key={c.name} style={{ ...card, padding: grid ? 6 : '8px 10px' }}>
            {grid && <div style={{ ...soft, height: 44, marginBottom: 5 }} />}
            <b style={{ fontWeight: 500 }}>{c.name}</b>
            {c.purpose && <div style={{ ...mu, fontSize: 11 }}>{c.purpose}</div>}
          </div>
        ))}
      </div>
    ) : null
  const ListBox = ({ grid }: { grid?: boolean }) =>
    s.hasList ? (
      <div style={{ ...card, padding: 8 }}>
        <div style={{ ...mu, fontSize: 11, display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span>목록</span>
          <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <input type="checkbox" checked={p.showEmpty} onChange={(e) => p.setShowEmpty(e.target.checked)} />
            비었을 때 보기
          </label>
        </div>
        {p.showEmpty ? (
          <p style={{ textAlign: 'center', padding: '10px 0', color: s.emptyState ? 'var(--mu)' : BAD }}>
            {s.emptyState ? '아직 아무것도 없어요 🙂' : '⚠ 비었을 때 보여줄 안내가 정해져 있지 않아요'}
          </p>
        ) : grid ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ ...soft, height: 40 }} />
            ))}
          </div>
        ) : (
          [1, 2, 3].map((i) => <div key={i} style={{ ...soft, height: 24, marginBottom: 4 }} />)
        )}
      </div>
    ) : null
  const Save = ({ style }: { style?: CSSProperties }) =>
    s.writes.length ? (
      <button onClick={() => p.setSaved(s.writes.join(', '))} style={{ ...outlineBtn, padding: 8, width: '100%', ...style }}>
        💾 저장하기
      </button>
    ) : null
  const Saved = () => (p.saved ? <p role="status" style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--ac)' }}>"{p.saved}"에 저장된다고 가정해요</p> : null)
  const Dead = () =>
    dead ? (
      <p role="alert" style={{ background: '#FEE2E2', color: '#B91C1C', borderRadius: 8, padding: '8px 10px' }}>
        ⚠ 막다른 화면이에요. 여기서 나가는 길이 없어요.
      </p>
    ) : null
  const Links = ({ style, big }: { style?: CSSProperties; big?: boolean }) => (
    <>
      {s.goesTo.map((l, i) => (
        <button key={`${l.to}-${i}`} onClick={() => p.go(l.to)} style={{ ...accentBtn, padding: big ? 14 : 8, fontSize: big ? 15 : 12.5, width: '100%', ...style }}>
          {l.label && l.label !== '이동' ? `${l.label} → ${l.toName}` : `→ ${l.toName}`}
        </button>
      ))}
    </>
  )
  const Title = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
    <span aria-label="현재 화면" style={style}>
      {children}
    </span>
  )
  const Start = () => (s.isStart ? <b style={{ fontWeight: 500, fontSize: 10, background: 'var(--ac)', color: 'var(--on)', borderRadius: 99, padding: '1px 7px' }}>시작</b> : null)
  const Header = ({ accent, left }: { accent?: boolean; left?: ReactNode }) => (
    <div style={{ background: accent ? 'var(--ac)' : 'var(--hd)', color: accent ? 'var(--on)' : 'var(--hc)', padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center', fontWeight: 500, fontSize: 13, borderBottom: 'var(--bw) solid var(--ln)' }}>
      {left}
      <Title style={{ flex: 1 }}>{s.name}</Title>
      <Start />
    </div>
  )
  const body = (children: ReactNode, pad: CSSProperties = {}) => (
    <div style={{ flex: 1, overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 9, ...pad }}>{children}</div>
  )
  const Blocks = ({ grid }: { grid?: boolean }) => (
    <>
      <Purpose />
      <Reads />
      <Comps grid={grid} />
      <ListBox grid={grid} />
      <Conds />
      <Save />
      <Saved />
      <Dead />
    </>
  )

  let content: ReactNode
  switch (design.layout) {
    case 'feed':
      content = (
        <>
          <div style={{ padding: '10px 10px 0' }}>
            <div style={{ ...card, borderRadius: 99, padding: '6px 12px', ...mu }}>🔍 <Title style={{ color: 'var(--ink)', fontWeight: 500 }}>{s.name}</Title> <Start /></div>
          </div>
          {body(<Blocks grid />, { padding: 10 })}
          {s.goesTo.length > 0 && (
            <div style={{ margin: '0 auto 10px', background: 'var(--ink)', color: 'var(--bg)', borderRadius: 99, padding: '7px 10px', display: 'flex', gap: 6, maxWidth: '94%' }}>
              {s.goesTo.map((l, i) => (
                <button key={`${l.to}-${i}`} onClick={() => p.go(l.to)} style={{ padding: '2px 8px', fontSize: 11.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  → {linkLabel(l)}
                </button>
              ))}
            </div>
          )}
        </>
      )
      break
    case 'appbar':
      content = (
        <>
          <Header accent left={<span>☰</span>} />
          {body(
            <>
              <Purpose />
              <Reads />
              <Comps />
              <ListBox />
              <Conds />
              <Save />
              <Saved />
              {s.goesTo.map((l, i) => (
                <button key={`${l.to}-${i}`} onClick={() => p.go(l.to)} style={{ ...card, display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', textAlign: 'left' }}>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--as)', color: 'var(--ac)', display: 'grid', placeItems: 'center' }}>→</span>
                  <span style={{ flex: 1, fontWeight: 500 }}>{linkLabel(l)}</span>
                  <span style={mu}>›</span>
                </button>
              ))}
              <Dead />
            </>,
          )}
        </>
      )
      break
    case 'editorial':
      content = (
        <>
          {body(
            <>
              <div style={mu}><span style={{ fontSize: 10.5, letterSpacing: '.1em' }}>SCREEN {p.index}</span> <Start /></div>
              <Title style={{ fontSize: 26, lineHeight: 1.1, fontWeight: 500, marginBottom: 4 }}>{s.name}</Title>
              <Purpose />
              <Reads />
              {s.components.map((c) => (
                <div key={c.name} style={{ borderTop: 'var(--bw) solid var(--ln)', padding: '8px 0' }}>
                  <b style={{ fontWeight: 500 }}>{c.name}</b>
                  {c.purpose && <div style={{ ...mu, fontSize: 11 }}>{c.purpose}</div>}
                </div>
              ))}
              <ListBox />
              <Conds />
              <Save />
              <Saved />
              {s.goesTo.map((l, i) => (
                <button key={`${l.to}-${i}`} onClick={() => p.go(l.to)} style={{ borderTop: '2px solid var(--ink)', padding: '10px 0', textAlign: 'left', color: 'var(--ac)', fontWeight: 500 }}>
                  {linkLabel(l)} →
                </button>
              ))}
              <Dead />
            </>,
            { padding: '16px 16px 10px' },
          )}
        </>
      )
      break
    case 'dashboard':
      content = (
        <>
          {body(
            <>
              <div>
                <div style={{ ...mu, fontSize: 11 }}>안녕하세요 <Start /></div>
                <Title style={{ fontSize: 16, fontWeight: 500 }}>{s.name}</Title>
              </div>
              <div style={{ ...accentBtn, padding: '10px 12px', fontWeight: 400 }}>
                <div style={{ fontSize: 11, opacity: 0.8 }}>이 화면은</div>
                <div style={{ fontWeight: 500 }}>{s.purpose || '⚠ 목적이 비어 있어요'}</div>
              </div>
              {s.goesTo.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                  {s.goesTo.map((l, i) => (
                    <button key={`${l.to}-${i}`} onClick={() => p.go(l.to)} style={{ ...card, padding: '10px 6px', textAlign: 'center' }}>
                      <div style={{ color: 'var(--ac)', fontSize: 18 }}>→</div>
                      <div style={{ fontSize: 11.5 }}>{linkLabel(l)}</div>
                    </button>
                  ))}
                </div>
              )}
              <Reads />
              <Comps />
              <ListBox />
              <Conds />
              <Save />
              <Saved />
              <Dead />
            </>,
          )}
        </>
      )
      break
    case 'big':
      content = (
        <>
          {s.goesTo.length > 0 && (
            <div style={{ ...card, display: 'flex', margin: 10, padding: 3, borderRadius: 99, gap: 2 }}>
              <span style={{ flex: 1, textAlign: 'center', padding: 7, borderRadius: 99, background: 'var(--ac)', color: 'var(--on)', fontWeight: 500, fontSize: 13 }}>
                <Title>{s.name}</Title>
              </span>
            </div>
          )}
          {s.goesTo.length === 0 && (
            <div style={{ padding: '14px 14px 0', fontSize: 15, fontWeight: 500 }}>
              <Title>{s.name}</Title> <Start />
            </div>
          )}
          {body(
            <>
              <p style={{ ...(s.purpose ? mu : { color: BAD }), fontSize: 14 }}>{s.purpose || '⚠ 이 화면의 목적이 비어 있어요'}</p>
              <Reads />
              {s.components.map((c) => (
                <div key={c.name} style={{ ...card, borderWidth: 2, padding: 12, fontSize: 15, fontWeight: 500 }}>
                  {c.name}
                  {c.purpose && <div style={{ ...mu, fontSize: 12, fontWeight: 400 }}>{c.purpose}</div>}
                </div>
              ))}
              <ListBox />
              <Conds />
              <Save style={{ padding: 12, fontSize: 14 }} />
              <Saved />
              <Dead />
            </>,
            { padding: '4px 10px' },
          )}
          <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Links big />
          </div>
        </>
      )
      break
    case 'chat':
      content = (
        <>
          <Header left={<span onClick={p.back} role="button" aria-label="이전 화면" style={{ cursor: p.canBack ? 'pointer' : 'default' }}>←</span>} />
          {body(
            <>
              <div style={{ ...card, alignSelf: 'flex-start', padding: '8px 10px', maxWidth: '85%', borderRadius: 'var(--r)' }}>
                <p style={s.purpose ? undefined : { color: BAD }}>{s.purpose || '⚠ 이 화면의 목적이 비어 있어요'}</p>
              </div>
              {p.showEmpty !== undefined && <Reads />}
              {s.components.map((c) => (
                <div key={c.name} style={{ ...card, alignSelf: 'flex-start', padding: '8px 10px', maxWidth: '85%' }}>
                  <b style={{ fontWeight: 500 }}>{c.name}</b>
                  {c.purpose && <div style={{ ...mu, fontSize: 11 }}>{c.purpose}</div>}
                </div>
              ))}
              <ListBox />
              <Conds />
              <Save />
              <Saved />
              <div style={{ alignSelf: 'flex-end', display: 'flex', flexDirection: 'column', gap: 6, maxWidth: '90%' }}>
                {s.goesTo.map((l, i) => (
                  <button key={`${l.to}-${i}`} onClick={() => p.go(l.to)} style={{ ...accentBtn, borderRadius: 99, padding: '6px 12px' }}>
                    {linkLabel(l)} →
                  </button>
                ))}
              </div>
              <Dead />
            </>,
          )}
          <div style={{ ...mu, background: 'var(--sf)', padding: '8px 10px', borderTop: 'var(--bw) solid var(--ln)', display: 'flex', gap: 8 }}>
            <span style={{ flex: 1, background: 'var(--bg)', borderRadius: 99, padding: '5px 12px' }}>메시지 입력</span>
            <span style={{ color: 'var(--ac)' }}>➤</span>
          </div>
        </>
      )
      break
    case 'map': {
      const pins = s.components.slice(0, 3)
      const first = s.goesTo[0]
      content = (
        <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'var(--as)', backgroundImage: 'linear-gradient(var(--ln) 1px,transparent 1px),linear-gradient(90deg,var(--ln) 1px,transparent 1px)', backgroundSize: '34px 34px' }} />
          {pins.map((c, i) => (
            <div key={c.name} title={c.name} style={{ position: 'absolute', left: 40 + i * 70, top: 90 + (i % 2) * 50, background: 'var(--ac)', color: 'var(--on)', border: 'var(--bw) solid var(--ln)', borderRadius: 99, padding: '2px 8px', fontSize: 11 }}>
              📍 {c.name}
            </div>
          ))}
          <div style={{ ...card, position: 'absolute', left: 10, right: 10, top: 10, borderRadius: 99, padding: '6px 12px', ...mu }}>
            🔍 <Title style={{ color: 'var(--ink)', fontWeight: 500 }}>{s.name}</Title> <Start />
          </div>
          <div style={{ ...card, position: 'absolute', right: 10, top: 52, width: 32, height: 32, display: 'grid', placeItems: 'center', color: 'var(--ac)' }}>◎</div>
          <div style={{ ...card, position: 'absolute', left: 0, right: 0, bottom: 0, borderRadius: 'calc(var(--r) + 6px) calc(var(--r) + 6px) 0 0', borderBottom: 0, padding: '8px 12px 12px', maxHeight: '62%', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ width: 34, height: 4, borderRadius: 9, background: 'var(--ln)', margin: '0 auto 2px' }} />
            <Purpose />
            <Reads />
            <ListBox />
            <Conds />
            <Save />
            <Saved />
            {s.goesTo.map((l, i) => (
              <button key={`${l.to}-${i}`} onClick={() => p.go(l.to)} style={{ ...(i === 0 ? accentBtn : outlineBtn), padding: 8 }}>
                {linkLabel(l)} →
              </button>
            ))}
            <Dead />
            {first && null}
          </div>
        </div>
      )
      break
    }
    case 'swipe': {
      const first = s.goesTo[0]
      content = (
        <>
          <div style={{ display: 'flex', gap: 4, padding: '12px 14px 0' }}>
            {Array.from({ length: Math.min(p.total, 8) }, (_, i) => (
              <i key={i} style={{ flex: 1, height: 3, borderRadius: 9, background: i < p.index ? 'var(--ac)' : 'var(--ln)' }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px 0', fontSize: 12 }}>
            <Title style={{ fontWeight: 500 }}>{s.name}</Title>
            <span style={mu}>{p.index} / {p.total}</span>
          </div>
          <div style={{ flex: 1, position: 'relative', margin: '10px 20px 0', minHeight: 0 }}>
            <div style={{ ...card, position: 'absolute', inset: '12px 10px 0', opacity: 0.6 }} />
            <div style={{ ...card, position: 'absolute', inset: '0 0 12px', padding: 12, display: 'flex', flexDirection: 'column', gap: 7, overflow: 'auto' }}>
              <div style={{ ...soft, minHeight: 60, display: 'grid', placeItems: 'center', fontSize: 30, color: 'var(--ac)' }}>{s.isStart ? '★' : '◆'}</div>
              <Purpose />
              <Reads />
              <Comps />
              <ListBox />
              <Conds />
              <Save />
              <Saved />
              <Dead />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, padding: '10px 0 8px' }}>
            <button onClick={p.back} disabled={!p.canBack} aria-label="이전 화면" style={{ ...card, width: 44, height: 44, borderRadius: '50%', ...mu, opacity: p.canBack ? 1 : 0.4 }}>✕</button>
            <button onClick={() => first && p.go(first.to)} disabled={!first} aria-label={first ? linkLabel(first) : '다음'} style={{ ...accentBtn, width: 44, height: 44, borderRadius: '50%', opacity: first ? 1 : 0.4 }}>✓</button>
          </div>
          {s.goesTo.length > 1 && (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', paddingBottom: 10 }}>
              {s.goesTo.slice(1).map((l, i) => (
                <button key={`${l.to}-${i}`} onClick={() => p.go(l.to)} style={{ ...outlineBtn, borderRadius: 99, padding: '3px 10px', fontSize: 11.5 }}>
                  {linkLabel(l)} →
                </button>
              ))}
            </div>
          )}
        </>
      )
      break
    }
    default:
      content = (
        <>
          <Header />
          {body(<Blocks />)}
          <div style={{ padding: '0 12px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Links />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', padding: '7px 4px', borderTop: 'var(--bw) solid var(--ln)', background: 'var(--sf)', fontSize: 10.5, ...mu }}>
            <span style={{ color: 'var(--ac)', fontWeight: 500 }}>● {s.name}</span>
            <button onClick={p.back} disabled={!p.canBack} aria-label="이전 화면" style={{ opacity: p.canBack ? 1 : 0.4 }}>← 이전</button>
          </div>
        </>
      )
  }

  return (
    <div data-layout={design.layout} data-theme={design.theme} title={LAYOUTS[design.layout].label} style={{ ...root, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {content}
    </div>
  )
}
