const path = require('node:path')

const serverCwd = path.resolve(__dirname, '.medusa', 'server')

module.exports = {
  apps: [
    {
      name: 'medusa',
      cwd: serverCwd,
      script: 'npm',
      args: 'run start',
      env: {
        NODE_ENV: 'production',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
    },
  ],
}
