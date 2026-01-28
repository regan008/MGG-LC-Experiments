import { defineConfig } from 'vite'
import { copyFileSync, mkdirSync, readdirSync } from 'fs'
import { resolve } from 'path'

// Plugin to copy data files to dist
function copyDataPlugin() {
  return {
    name: 'copy-data',
    closeBundle() {
      const srcDir = resolve(__dirname, 'data/processed')
      const destDir = resolve(__dirname, 'dist/data/processed')

      mkdirSync(destDir, { recursive: true })

      const files = readdirSync(srcDir)
      files.forEach(file => {
        if (file.endsWith('.json')) {
          copyFileSync(
            resolve(srcDir, file),
            resolve(destDir, file)
          )
          console.log(`Copied: data/processed/${file}`)
        }
      })
    }
  }
}

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  server: {
    port: 3000,
    open: true
  },
  plugins: [copyDataPlugin()]
})
