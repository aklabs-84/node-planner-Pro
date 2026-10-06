import { describe, expect, it } from 'vitest'
import { emptyProject, parseProject } from '../src/core/schema'
import { diaryExample } from '../src/examples/diary'
import { parseProjectJson, projectToJson } from '../src/lib/io'

describe('프로젝트 스키마', () => {
  it('예시 프로젝트는 통과한다', () => {
    expect(parseProject(diaryExample).ok).toBe(true)
  })

  it('빈 프로젝트는 통과한다', () => {
    expect(parseProject(emptyProject()).ok).toBe(true)
  })

  it('내보냈다가 다시 가져와도 같다', () => {
    const r = parseProjectJson(projectToJson(diaryExample))
    expect(r.ok && r.project).toEqual(diaryExample)
  })

  it('JSON이 아니면 거부한다', () => {
    const r = parseProjectJson('이건 JSON이 아님')
    expect(r.ok).toBe(false)
  })

  it('버전이 다르면 거부한다', () => {
    expect(parseProject({ ...diaryExample, version: 2 }).ok).toBe(false)
  })

  it('없는 노드를 잇는 선은 거부한다', () => {
    const bad = { ...diaryExample, edges: [{ id: 'x', from: 'home', to: '없음', kind: 'navigate', label: '' }] }
    const r = parseProject(bad)
    expect(r.ok).toBe(false)
  })

  it('노드 id가 겹치면 거부한다', () => {
    const dup = { ...diaryExample, nodes: [...diaryExample.nodes, diaryExample.nodes[0]] }
    expect(parseProject(dup).ok).toBe(false)
  })

  it('알 수 없는 노드 종류는 거부한다', () => {
    const bad = { ...diaryExample, nodes: [{ id: 'a', type: 'robot', x: 0, y: 0, name: 'a', purpose: '' }] }
    expect(parseProject(bad).ok).toBe(false)
  })
})
