import { parseProject, type ParseResult, type Project } from '../core/schema'

export function projectToJson(p: Project): string {
  return JSON.stringify(p, null, 2)
}

export function parseProjectJson(text: string): ParseResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'JSON 형식이 아니에요. 내보낸 파일이 맞는지 확인해 주세요.' }
  }
  return parseProject(raw)
}

export function downloadProject(p: Project) {
  const blob = new Blob([projectToJson(p)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${p.name.replace(/[\\/:*?"<>|\s]+/g, '-')}.nodeplan.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function pickProjectFile(): Promise<ParseResult | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return resolve(null)
      resolve(parseProjectJson(await file.text()))
    }
    input.click()
  })
}
