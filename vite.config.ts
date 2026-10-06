import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** 개발 서버에서도 /api/* 를 쓸 수 있게 한다(배포 환경에서는 Vercel이 같은 파일을 실행). */
function apiDev(): Plugin {
  return {
    name: 'npp-api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const m = /^\/api\/([a-z-]+)(?:\?.*)?$/.exec(req.url ?? '')
        if (!m) return next()
        try {
          const mod = await server.ssrLoadModule(`/api/${m[1]}.ts`)
          const chunks: Buffer[] = []
          for await (const c of req) chunks.push(c as Buffer)
          const headers = new Headers()
          for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v)
          const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(chunks)
          const r: Response = await mod.default.fetch(new Request(`http://localhost${req.url}`, { method: req.method, headers, body }))
          res.statusCode = r.status
          r.headers.forEach((v, k) => res.setHeader(k, v))
          res.end(Buffer.from(await r.arrayBuffer()))
        } catch {
          res.statusCode = 404
          res.end()
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), apiDev()],
})
