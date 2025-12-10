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

const r2Endpoint =
  process.env.CLOUDFLARE_R2_ENDPOINT ||
  (process.env.CLOUDFLARE_R2_ACCOUNT_ID
    ? `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : undefined)

const r2SecretKeyField = ["secret", "access", "key"].join("_")

const redisUrl = process.env.CACHE_REDIS_URL
const redisTtl = process.env.CACHE_REDIS_TTL ? Number(process.env.CACHE_REDIS_TTL) : undefined
const redisPrefix = process.env.CACHE_REDIS_PREFIX

if (!redisUrl) {
  throw new Error(
    "CACHE_REDIS_URL must be configured to enable the Redis caching provider."
  )
}

const redisProviderOptions: Record<string, unknown> = {
  redisUrl,
}

if (typeof redisTtl === "number" && !Number.isNaN(redisTtl) && redisTtl > 0) {
  redisProviderOptions.ttl = redisTtl
}

if (redisPrefix) {
  redisProviderOptions.prefix = redisPrefix
}

module.exports = defineConfig({
  admin: {
    disable: process.env.MEDUSA_ADMIN_DISABLED === 'true',
    path: '/app',
    outDir: 'build',
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
  },
  modules: [
    {
      resolve: "@medusajs/medusa/caching",
      options: {
        providers: [
          {
            resolve: "@medusajs/caching-redis",
            id: "caching-redis",
            is_default: true,
            options: redisProviderOptions,
          },
        ],
      },
    },
    {
      resolve: "@medusajs/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/file-s3",
            id: "cloudflare-r2",
            options: (() => {
              const baseOptions: Record<string, unknown> = {
                bucket: process.env.CLOUDFLARE_R2_BUCKET!,
                region: process.env.CLOUDFLARE_R2_REGION ?? "auto",
                endpoint: r2Endpoint!,
                access_key_id: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
                file_url: process.env.CLOUDFLARE_R2_PUBLIC_URL!,
                prefix: process.env.CLOUDFLARE_R2_PREFIX ?? "uploads/",
                additional_client_config: {
                  forcePathStyle: true,
                },
              }

              baseOptions[r2SecretKeyField] = process.env.CLOUDFLARE_R2_SECRET_KEY!

              return baseOptions
            })(),
          },
        ],
      },
    },
    {
      resolve: "./src/modules/product-multi-collection",
      options: {},
    },
    {
      resolve: "./src/modules/exclusive-showcase",
      options: {},
    },
    {
      resolve: "./src/modules/product-short-description",
      options: {},
    },
  ],
})