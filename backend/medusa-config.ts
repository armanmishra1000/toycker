// import { loadEnv, defineConfig } from "@medusajs/framework/utils"

// loadEnv(process.env.NODE_ENV || "development", process.cwd())

// const config = defineConfig({
//   admin: {
//     disable: process.env.MEDUSA_ADMIN_DISABLED === 'true',
//   },
//   projectConfig: {
//     databaseUrl: process.env.DATABASE_URL,
//     redisUrl: process.env.REDIS_URL,
//     workerMode: (process.env.MEDUSA_WORKER_MODE as "worker" | "shared" | "server" | undefined) || "worker",
//     http: {
//       storeCors: process.env.STORE_CORS!,
//       adminCors: process.env.ADMIN_CORS!,
//       authCors: process.env.AUTH_CORS!,
//       jwtSecret: process.env.JWT_SECRET || "supersecret",
//       cookieSecret: process.env.COOKIE_SECRET || "supersecret",
//     }
//   }
// })

// export default config
// module.exports = config


import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  admin: {
    disable: process.env.NODE_ENV === 'production',
  },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  }
})