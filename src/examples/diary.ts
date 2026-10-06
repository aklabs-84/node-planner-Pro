import type { Project } from '../core/schema'

export const diaryExample: Project = {
  version: 1,
  name: '내 일기장 앱',
  goal: '하루 일기를 쓰고 모아 보는 웹앱',
  audience: '일기를 처음 써 보는 사람',
  nodes: [
    { id: 'home', type: 'screen', x: 60, y: 70, name: '홈', purpose: '앱을 열면 처음 보이는 화면. 쓰기와 목록으로 이동', isStart: true },
    { id: 'write', type: 'screen', x: 400, y: 40, name: '일기 쓰기', purpose: '제목과 내용을 입력해 일기를 저장' },
    { id: 'data', type: 'data', x: 740, y: 40, name: '일기 저장소', purpose: '작성한 일기를 보관', fields: '제목, 내용, 날짜' },
    { id: 'list', type: 'screen', x: 740, y: 300, name: '일기 목록', purpose: '', hasList: true, emptyState: false },
    { id: 'set', type: 'screen', x: 60, y: 330, name: '설정', purpose: '글자 크기 등 앱 설정' },
  ],
  edges: [
    { id: 'e1', from: 'home', to: 'write', kind: 'navigate', label: '이동' },
    { id: 'e2', from: 'home', to: 'list', kind: 'navigate', label: '이동' },
    { id: 'e3', from: 'write', to: 'data', kind: 'save', label: '저장' },
    { id: 'e4', from: 'write', to: 'list', kind: 'navigate', label: '저장 후' },
    { id: 'e5', from: 'data', to: 'list', kind: 'read', label: '읽기' },
    { id: 'e6', from: 'list', to: 'home', kind: 'navigate', label: '뒤로' },
    { id: 'e7', from: 'set', to: 'home', kind: 'navigate', label: '뒤로' },
  ],
}
