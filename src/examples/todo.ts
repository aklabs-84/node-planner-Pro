import type { Project } from '../core/schema'

/** 일부러 빠진 부분이 있는 예시: 점검 탭에서 무엇이 걸리는지 연습해 보세요 */
export const todoExample: Project = {
  version: 1,
  name: '할 일 앱',
  goal: '오늘 할 일을 적고 체크하는 앱',
  audience: '혼자 공부하는 학생',
  nodes: [
    { id: 'main', type: 'screen', x: 0, y: 0, name: '오늘 할 일', purpose: '할 일 목록을 보여주고 체크함', isStart: true, hasList: true, emptyState: false },
    { id: 'add', type: 'screen', x: 0, y: 0, name: '할 일 추가', purpose: '새 할 일을 입력' },
    { id: 'input', type: 'component', x: 0, y: 0, name: '입력창', purpose: '할 일 내용을 적는 칸' },
    { id: 'login', type: 'logic', x: 0, y: 0, name: '로그인 확인', purpose: '로그인한 사람만 목록을 보여줌' },
    { id: 'done', type: 'screen', x: 0, y: 0, name: '완료한 일', purpose: '' },
  ],
  edges: [
    { id: 'e1', from: 'main', to: 'add', kind: 'navigate', label: '추가' },
    { id: 'e2', from: 'input', to: 'add', kind: 'trigger', label: '실행' },
    { id: 'e3', from: 'login', to: 'main', kind: 'branch', label: '분기' },
    { id: 'e4', from: 'done', to: 'main', kind: 'navigate', label: '뒤로' },
  ],
}
