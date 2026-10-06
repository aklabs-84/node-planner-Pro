/** 앱 화면을 따라 볼 순서. 시작 화면에서 출발해 선을 따라 폭 우선으로 걷고, 닿지 않는 화면은 맨 뒤에 붙인다. */
export function tourOrder(screens: { id: string; isStart: boolean; goesTo: { to: string }[] }[]): string[] {
  const byId = new Map(screens.map((s) => [s.id, s]))
  const seen = new Set<string>()
  const order: string[] = []
  const walk = (from: string) => {
    if (seen.has(from)) return
    const queue = [from]
    seen.add(from)
    while (queue.length) {
      const id = queue.shift()!
      order.push(id)
      for (const l of byId.get(id)?.goesTo ?? []) {
        if (byId.has(l.to) && !seen.has(l.to)) {
          seen.add(l.to)
          queue.push(l.to)
        }
      }
    }
  }
  const start = screens.find((s) => s.isStart) ?? screens[0]
  if (start) walk(start.id)
  for (const s of screens) walk(s.id)
  return order
}
