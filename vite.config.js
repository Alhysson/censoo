import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// Middleware plugin to serve /data/ from project root
function serveDataFolder() {
  return {
    name: 'serve-data-folder',
    configureServer(server) {
      server.middlewares.use('/data', (req, res, next) => {
        const filePath = path.join(process.cwd(), 'data', req.url)
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath)
          res.setHeader('Content-Type', 'application/json')
          res.end(content)
        } else {
          next()
        }
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), serveDataFolder()],
})
