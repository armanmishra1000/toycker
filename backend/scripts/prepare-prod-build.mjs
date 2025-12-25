import { copyFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const serverDir = path.join(projectRoot, '.medusa', 'server')

if (!existsSync(serverDir)) {
  throw new Error('Medusa build directory (.medusa/server) was not found. Run "pnpm run build" first.')
}

const envSource = path.join(projectRoot, '.env')
const envTarget = path.join(serverDir, '.env.production')

if (!existsSync(envTarget)) {
  if (!existsSync(envSource)) {
    throw new Error('No .env file found to copy into .medusa/server/.env.production.')
  }

  copyFileSync(envSource, envTarget)
  console.log('Copied .env to .medusa/server/.env.production')
} else {
  console.log('.medusa/server/.env.production already exists; leaving it unchanged')
}

const adminIndex = path.join(serverDir, 'public', 'admin', 'index.html')
if (!existsSync(adminIndex)) {
  throw new Error('Admin build artifact (.medusa/server/public/admin/index.html) is missing. Re-run "pnpm run build" or check admin bundler settings.')
}

const nodeModulesDir = path.join(serverDir, 'node_modules')
if (!existsSync(nodeModulesDir)) {
  console.log('Installing production dependencies inside .medusa/server ...')
  const installArgs = ['install', '--prod']
  const installResult = spawnSync('pnpm', installArgs, {
    cwd: serverDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  if (installResult.status !== 0) {
    throw new Error('pnpm install inside .medusa/server failed')
  }
} else {
  console.log('Dependencies already installed inside .medusa/server; skipping pnpm install')
}

console.log('Production build assets prepared successfully.')
