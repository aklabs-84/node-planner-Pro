import { buildIr, type Ir, type IrScreen } from './ir'
import type { Project } from './schema'

/** 클릭 시뮬레이터가 쓰는 순수 계산. 화면 정보는 지시문과 같은 IR에서 가져온다. */
export interface Sim {
  ir: Ir
  startId: string | null
  byId: Map<string, IrScreen>
}

export function buildSim(project: Project): Sim {
  const ir = buildIr(project)
  const startId = (ir.screens.find((s) => s.isStart) ?? ir.screens[0])?.id ?? null
  return { ir, startId, byId: new Map(ir.screens.map((s) => [s.id, s])) }
}

/** 아직 가 보지 않은 화면 */
export const unvisited = (sim: Sim, visited: Set<string>): IrScreen[] => sim.ir.screens.filter((s) => !visited.has(s.id))

/** 시작 화면에서 이동 선만 따라가서 닿을 수 있는 화면 id */
export function reachableFromStart(sim: Sim): Set<string> {
  const seen = new Set<string>()
  const stack = sim.startId ? [sim.startId] : []
  while (stack.length) {
    const id = stack.pop()!
    if (seen.has(id)) continue
    seen.add(id)
    for (const l of sim.byId.get(id)?.goesTo ?? []) stack.push(l.to)
  }
  return seen
}
