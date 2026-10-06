import type { Project } from '../core/schema'

/** 점검을 모두 통과하는 예시 */
export const shopExample: Project = {
  version: 1,
  name: '동네 작은 가게',
  goal: '동네 주민이 물건을 보고 장바구니에 담는 앱',
  audience: '동네 주민',
  nodes: [
    { id: 'list', type: 'screen', x: 0, y: 0, name: '상품 목록', purpose: '파는 물건을 보여주고 장바구니에 담게 함', isStart: true, hasList: true, emptyState: true },
    { id: 'cart', type: 'screen', x: 0, y: 0, name: '장바구니', purpose: '담은 물건을 확인하고 결제로 넘어감' },
    { id: 'add', type: 'component', x: 0, y: 0, name: '담기 버튼', purpose: '누르면 물건을 장바구니에 담음' },
    { id: 'db', type: 'data', x: 0, y: 0, name: '장바구니 기록', purpose: '담은 물건 보관', fields: '상품명, 가격, 개수' },
    { id: 'pay', type: 'external', x: 0, y: 0, name: '결제 서비스', purpose: '카드 결제 처리' },
    { id: 'memo', type: 'note', x: 0, y: 0, name: '메모', purpose: '가격은 원 단위로 보여주기' },
  ],
  edges: [
    { id: 'e1', from: 'list', to: 'cart', kind: 'navigate', label: '장바구니 보기' },
    { id: 'e2', from: 'cart', to: 'list', kind: 'navigate', label: '뒤로' },
    { id: 'e3', from: 'add', to: 'list', kind: 'trigger', label: '실행' },
    { id: 'e4', from: 'list', to: 'db', kind: 'save', label: '저장' },
    { id: 'e5', from: 'db', to: 'cart', kind: 'read', label: '읽기' },
    { id: 'e6', from: 'cart', to: 'pay', kind: 'trigger', label: '실행' },
  ],
}
