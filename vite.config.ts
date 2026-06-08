import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { promises as fs } from 'node:fs'
import path from 'node:path'

// Mini API: GET/PUT /api/data — read/write local data.json (seed on first run)
function dataApiPlugin(): Plugin {
  const root = process.cwd()
  const dataPath = path.join(root, 'data.json')
  const seedPath = path.join(root, 'data.seed.json')

  const ensure = async () => {
    try {
      await fs.access(dataPath)
    } catch {
      const seed = await fs.readFile(seedPath, 'utf8')
      await fs.writeFile(dataPath, seed, 'utf8')
    }
  }

  return {
    name: 'app-data-api',
    configureServer(server) {
      server.middlewares.use('/api/data', async (req, res) => {
        try {
          await ensure()
          if (req.method === 'GET') {
            const body = await fs.readFile(dataPath, 'utf8')
            res.setHeader('content-type', 'application/json; charset=utf-8')
            res.end(body)
            return
          }
          if (req.method === 'PUT' || req.method === 'POST') {
            const chunks: Buffer[] = []
            for await (const c of req) chunks.push(c as Buffer)
            const raw = Buffer.concat(chunks).toString('utf8')
            // validate JSON
            JSON.parse(raw)
            await fs.writeFile(dataPath, raw, 'utf8')
            res.statusCode = 204
            res.end()
            return
          }
          res.statusCode = 405
          res.end('Method Not Allowed')
        } catch (err) {
          res.statusCode = 500
          res.end(String((err as Error).message))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), dataApiPlugin()],
})
