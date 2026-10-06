import { autoLayout } from '../core/layout'
import type { Project } from '../core/schema'
import { diaryExample } from './diary'
import { shopExample } from './shop'
import { todoExample } from './todo'

export interface Example {
  id: string
  title: string
  desc: string
  project: Project
}

/** 위치가 비어 있는 예시는 자동 정리로 배치한다. */
const placed = (p: Project): Project => {
  const pos = autoLayout(p)
  return { ...p, nodes: p.nodes.map((n) => ({ ...n, ...(pos[n.id] ?? {}) })) }
}

export const EXAMPLES: Example[] = [
  { id: 'diary', title: '내 일기장 앱', desc: '점검에서 문제 몇 개가 걸려요. 고쳐 보며 연습하기 좋아요.', project: diaryExample },
  { id: 'shop', title: '동네 작은 가게', desc: '점검을 모두 통과하는 완성형 예시예요.', project: placed(shopExample) },
  { id: 'todo', title: '할 일 앱', desc: '입력·로그인·막다른 화면 등 다양한 문제가 들어 있어요.', project: placed(todoExample) },
]
