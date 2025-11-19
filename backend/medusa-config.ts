import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const workerMode =
  (process.env.MEDUSA_WORKER_MODE as 'worker' | 'shared' | 'server' | undefined) || 'shared'

const databaseDriverOptions =
  process.env.DATABASE_SSL === 'true'
    ? {
        connection: {
          ssl: {
            rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true',
          },
        },
      }
    : {}

module.exports = defineConfig({
  admin: {
    disable: process.env.MEDUSA_ADMIN_DISABLED === 'true',
  },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    databaseDriverOptions,
    redisUrl: process.env.REDIS_URL,
    workerMode,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || 'supersecret',
      cookieSecret: process.env.COOKIE_SECRET || 'supersecret',
    },
  },
})