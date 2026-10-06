import type { PlanNode, Project } from '../schema.js'
import type { Issue, Rule, Severity } from './types.js'

const nameOf = (n: PlanNode) => n.name.trim() || '(이름 없음)'
const isScreen = (n: PlanNode) => n.type === 'screen'

function issue(id: string, severity: Severity, nodeIds: string[], message: string, hint: string): Issue {
  return { id, severity, nodeIds, message, hint }
}

/** 노드와 선으로 이어진 이웃들(방향 무관) */
function neighborsOf(p: Project, id: string): PlanNode[] {
  const byId = new Map(p.nodes.map((n) => [n.id, n]))
  return p.edges
    .filter((e) => e.from === id || e.to === id)
    .map((e) => byId.get(e.from === id ? e.to : e.from))
    .filter((n): n is PlanNode => !!n)
}

/** 화면 → 화면으로 가는 선만 따라 닿을 수 있는 화면 id */
function reachableFrom(p: Project, startId: string): Set<string> {
  const screens = new Set(p.nodes.filter(isScreen).map((n) => n.id))
  const seen = new Set([startId])
  const queue = [startId]
  while (queue.length) {
    const cur = queue.shift()!
    for (const e of p.edges) {
      if (e.from === cur && screens.has(e.to) && !seen.has(e.to)) (seen.add(e.to), queue.push(e.to))
    }
  }
  return seen
}

/** 아무 내용도 없는 화면: 설명도 없고, 구성요소·데이터 등과 이어진 것도 없고, 목록도 아님 */
const isBlankScreen = (p: Project, n: PlanNode) =>
  isScreen(n) && !n.purpose.trim() && !n.hasList && neighborsOf(p, n.id).every(isScreen)

const L001: Rule = (p) => {
  const screens = p.nodes.filter(isScreen)
  const starts = screens.filter((n) => n.isStart)
  if (screens.length === 0) return [issue('L001', 'error', [], '화면이 하나도 없어요', '화면 노드를 하나 추가하고 시작 화면으로 지정해 보세요.')]
  if (starts.length === 0) return [issue('L001', 'error', [screens[0].id], '시작 화면이 정해지지 않았어요', '앱을 열면 처음 보일 화면을 골라 "시작 화면으로 지정"을 켜 주세요.')]
  if (starts.length > 1)
    return [issue('L001', 'error', starts.map((n) => n.id), `시작 화면이 ${starts.length}개예요 (${starts.map(nameOf).join(', ')})`, '시작 화면은 하나만 둘 수 있어요. 나머지는 지정을 꺼 주세요.')]
  return []
}

const L002: Rule = (p) => {
  const starts = p.nodes.filter((n) => isScreen(n) && n.isStart)
  if (starts.length !== 1) return [] // 시작 화면 문제는 L001에서 알려 준다
  const seen = reachableFrom(p, starts[0].id)
  return p.nodes
    .filter((n) => isScreen(n) && !seen.has(n.id))
    .map((n) => issue('L002', 'error', [n.id], `"${nameOf(n)}" 화면에 도달할 수 없어요`, '시작 화면에서 이 화면으로 이어지는 이동 선이 없어요. 어디서 열리는지 선으로 이어 주세요.'))
}

const L003: Rule = (p) => {
  const screens = p.nodes.filter(isScreen)
  if (screens.length < 2) return []
  const ids = new Set(screens.map((n) => n.id))
  return screens
    .filter((n) => !p.edges.some((e) => e.from === n.id && ids.has(e.to)))
    .map((n) => issue('L003', 'warn', [n.id], `"${nameOf(n)}"은 막다른 화면이에요`, '여기서 다른 화면으로 나가는 길이 없어요. "뒤로" 같은 이동 선을 이어 주세요.'))
}

const L004: Rule = (p) =>
  p.nodes
    .filter((n) => isBlankScreen(p, n))
    .map((n) => issue('L004', 'warn', [n.id], `"${nameOf(n)}" 화면이 비어 있어요`, '이 화면에 들어갈 구성요소나 데이터를 이어 주거나, 목적을 적어 주세요.'))

const L005: Rule = (p) =>
  p.nodes
    .filter((n) => (n.type === 'component' || n.type === 'data') && !neighborsOf(p, n.id).some(isScreen))
    .map((n) => {
      const kind = n.type === 'data' ? '데이터' : '구성요소'
      return issue('L005', 'warn', [n.id], `${kind} "${nameOf(n)}"이(가) 어느 화면에도 연결되지 않았어요`, '어느 화면에서 쓰는지 선으로 이어 주세요. 안 쓰는 노드라면 지워도 돼요.')
    })

const L006: Rule = (p) => {
  const out: Issue[] = []
  for (const d of p.nodes.filter((n) => n.type === 'data')) {
    const writers = p.edges.some((e) => e.to === d.id && e.kind !== 'read' && p.nodes.find((n) => n.id === e.from)?.type === 'screen')
    const readers = p.edges.some((e) => {
      const other = p.nodes.find((n) => n.id === (e.from === d.id ? e.to : e.from))
      return other?.type === 'screen' && (e.from === d.id || e.kind === 'read')
    })
    if (readers && !writers)
      out.push(issue('L006', 'warn', [d.id], `"${nameOf(d)}"은 읽기만 하고 저장하는 곳이 없어요`, '데이터가 어디서 만들어지는지 화면에서 "저장" 선을 이어 주세요.'))
  }
  return out
}

const FORM_WORDS = /입력|폼|form|작성|등록|가입|글쓰기/i

const L007: Rule = (p) => {
  const out: Issue[] = []
  for (const s of p.nodes.filter(isScreen)) {
    const nb = neighborsOf(p, s.id)
    const forms = nb.filter((n) => n.type === 'component' && FORM_WORDS.test(`${n.name} ${n.purpose}`))
    if (forms.length === 0) continue
    const saves = p.edges.some((e) => e.from === s.id && e.kind !== 'read' && p.nodes.find((n) => n.id === e.to)?.type === 'data')
    if (!saves)
      out.push(issue('L007', 'warn', [s.id, ...forms.map((n) => n.id)], `"${nameOf(s)}"에 입력할 곳이 있는데 저장하는 곳이 없어요`, '입력한 내용이 담길 데이터 노드를 만들고 "저장" 선으로 이어 주세요.'))
  }
  return out
}

const L008: Rule = (p) =>
  p.nodes
    .filter((n) => isScreen(n) && n.hasList && !n.emptyState)
    .map((n) => issue('L008', 'suggest', [n.id], `"${nameOf(n)}"이 비었을 때 보여줄 안내가 없어요`, '아직 내용이 없을 때 보일 문구를 정해 두면 AI가 빈 화면을 그냥 두지 않아요. "비었을 때 보여줄 안내가 있어요"를 켜 주세요.'))

const LOGIN = /로그인|login|sign.?in/i

const L009: Rule = (p) => {
  const hasLoginScreen = p.nodes.some((n) => isScreen(n) && LOGIN.test(n.name))
  if (hasLoginScreen) return []
  const needs = p.nodes.filter((n) => n.type !== 'note' && n.type !== 'external' && n.type !== 'role' && LOGIN.test(`${n.name} ${n.purpose}`))
  if (needs.length === 0) return []
  return [issue('L009', 'suggest', needs.map((n) => n.id), '로그인이 필요해 보이는데 로그인 화면이 없어요', '로그인 화면을 추가하고 필요한 화면 앞에 이어 주세요.')]
}

const L010: Rule = (p) => {
  const groups = new Map<string, PlanNode[]>()
  for (const n of p.nodes) {
    if (n.type === 'note' || !n.name.trim()) continue
    const key = `${n.type}:${n.name.trim().toLowerCase()}`
    groups.set(key, [...(groups.get(key) ?? []), n])
  }
  return [...groups.values()]
    .filter((g) => g.length > 1)
    .map((g) => issue('L010', 'suggest', g.map((n) => n.id), `이름이 같은 노드가 ${g.length}개 있어요: "${nameOf(g[0])}"`, 'AI가 같은 것인지 다른 것인지 헷갈려요. 이름을 다르게 지어 주세요.'))
}

const L011: Rule = (p) =>
  p.nodes
    .filter((n) => isScreen(n) && !n.purpose.trim() && !isBlankScreen(p, n))
    .map((n) => issue('L011', 'suggest', [n.id], `"${nameOf(n)}"의 목적이 비어 있어요`, '목적을 적지 않으면 AI가 마음대로 추측해서 만들어요. 한 줄이면 충분해요.'))

const L012: Rule = (p) =>
  p.nodes
    .filter((n) => n.type === 'role' && !neighborsOf(p, n.id).some(isScreen))
    .map((n) => issue('L012', 'warn', [n.id], `역할 "${nameOf(n)}"이(가) 어느 화면과도 이어지지 않았어요`, '이 역할이 쓸 수 있는 화면에 "권한" 선을 이어 주세요. 안 쓰는 역할이라면 지워도 돼요.'))

const L013: Rule = (p) => {
  const out: Issue[] = []
  for (const n of p.nodes.filter((x) => x.type === 'notification')) {
    if (!n.purpose.trim())
      out.push(issue('L013', 'suggest', [n.id], `알림 "${nameOf(n)}"이 언제, 무슨 내용으로 가는지 비어 있어요`, '"매일 저녁 8시에 일기 쓰기 알림"처럼 언제·누구에게·무슨 내용인지 한 줄로 적어 주세요.'))
    if (!neighborsOf(p, n.id).some(isScreen))
      out.push(issue('L013', 'warn', [n.id], `알림 "${nameOf(n)}"이 어느 화면과도 이어지지 않았어요`, '알림을 보내는 계기가 되는 화면에서 이 알림으로, 또는 알림을 누르면 열릴 화면으로 선을 이어 주세요.'))
  }
  return out
}

export const RULES: Rule[] = [L001, L002, L003, L004, L005, L006, L007, L008, L009, L010, L011, L012, L013]
