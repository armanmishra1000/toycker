import fs from "fs"
import path from "path"
import { randomUUID } from "crypto"
import { parse } from "csv-parse"
import { stringify } from "csv-stringify"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

type ShopifyRow = Record<string, string>

type CliOptions = {
  input: string
  output: string
  currency: string
  maxImages: number
  maxTags: number
  tagMapPath: string
  uploadImages: boolean
  imagePrefix: string
  manifestPath: string
  concurrency: number
  verbose: boolean
}

type VariantRecord = {
  sku?: string
  barcode?: string
  price?: string
  weightGrams?: number
  allowBackorder: boolean
  manageInventory: boolean
  optionValues: string[]
  title?: string
}

type ProductRecord = {
  handle: string
  title?: string
  description?: string
  status: "draft" | "published"
  tags: string[]
  optionNames: string[]
  variants: VariantRecord[]
  images: { url: string; position: number }[]
  thumbnail?: string
}

type ImageUploadConfig = {
  bucket: string
  region: string
  endpoint?: string
  accessKeyId: string
  secretKey: string
  publicUrl: string
  prefix: string
}

type UploadManifest = Record<string, string>

type ImageUploaderOptions = {
  manifest: UploadManifest
  manifestPath: string
  verbose: boolean
}

interface ImageUploader {
  upload(sourceUrl: string, handle: string): Promise<string>
  flush?: () => Promise<void>
}

const DEFAULTS = {
  input: path.resolve(process.cwd(), "../products_export_shopify.csv"),
  output: path.resolve(
    process.cwd(),
    "../products_medusa_import_generated.csv"
  ),
  currency: "INR",
  maxImages: 8,
  maxTags: 5,
  tagMapPath: path.resolve(process.cwd(), "../product-tag-map.json"),
  uploadImages: false,
  imagePrefix: process.env.CLOUDFLARE_R2_PREFIX ?? "uploads/",
  manifestPath: path.resolve(process.cwd(), "../image-upload-manifest.json"),
  concurrency: Number(process.env.IMAGE_UPLOAD_CONCURRENCY) || 5,
  verbose: false,
}

async function main() {
  try {
    const options = parseCliOptions(process.argv)
    const tagIdMap = loadTagIdMap(options.tagMapPath)
    const rows = await readShopifyCsv(options.input)

    if (!rows.length) {
      throw new Error("Shopify CSV is empty")
    }

    const products = consolidateProducts(rows)
    const imageUploader = createImageUploader(options)
    await mirrorProductImages(products, imageUploader, options)
    const { records, headers } = buildMedusaRows(products, options, tagIdMap)

    await writeMedusaCsv(options.output, headers, records)

    if (imageUploader?.flush) {
      await imageUploader.flush()
    }

    const variantCount = products.reduce((acc, product) => acc + product.variants.length, 0)
    console.log(
      `Transformed ${products.length} products / ${variantCount} variants → ${options.output}`
    )
  } catch (error) {
    console.error("Failed to transform Shopify CSV:")
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

function parseCliOptions(argv: string[]): CliOptions {
  const opts: CliOptions = { ...DEFAULTS }

  for (const arg of argv.slice(2)) {
    const [key, rawValue] = arg.includes("=") ? arg.split("=", 2) : [arg, undefined]
    switch (key) {
      case "--input":
        opts.input = path.resolve(process.cwd(), rawValue || "")
        break
      case "--output":
        opts.output = path.resolve(process.cwd(), rawValue || "")
        break
      case "--currency":
        opts.currency = (rawValue || DEFAULTS.currency).toUpperCase()
        break
      case "--maxImages":
        opts.maxImages = Math.max(1, Number(rawValue) || DEFAULTS.maxImages)
        break
      case "--maxTags":
        opts.maxTags = Math.max(1, Number(rawValue) || DEFAULTS.maxTags)
        break
      case "--tagMap":
        opts.tagMapPath = path.resolve(process.cwd(), rawValue || "")
        break
      case "--uploadImages":
        opts.uploadImages = true
        break
      case "--no-uploadImages":
        opts.uploadImages = false
        break
      case "--imagePrefix":
        if (rawValue) {
          opts.imagePrefix = rawValue
        }
        break
      case "--manifest":
        if (rawValue) {
          opts.manifestPath = path.resolve(process.cwd(), rawValue)
        }
        break
      case "--concurrency":
        opts.concurrency = Math.max(1, Number(rawValue) || DEFAULTS.concurrency)
        break
      case "--verbose":
        opts.verbose = true
        break
      case "--no-verbose":
        opts.verbose = false
        break
      default:
        break
    }
  }

  return opts
}

function readShopifyCsv(filePath: string): Promise<ShopifyRow[]> {
  return new Promise((resolve, reject) => {
    const rows: ShopifyRow[] = []
    fs.createReadStream(filePath)
      .pipe(
        parse({
          bom: true,
          columns: true,
          skip_empty_lines: true,
          relax_column_count: true,
          trim: true,
        })
      )
      .on("data", (row: ShopifyRow) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", (err) => reject(err))
  })
}

function consolidateProducts(rows: ShopifyRow[]): ProductRecord[] {
  const productMap = new Map<string, ProductRecord>()

  for (const row of rows) {
    const handle = (row["Handle"] || "").trim()
    if (!handle) {
      continue
    }

    const product = ensureProduct(productMap, handle)
    hydrateProduct(product, row)
    collectVariant(product, row)
    collectImage(product, row)
  }

  return Array.from(productMap.values()).sort((a, b) => a.handle.localeCompare(b.handle))
}

function ensureProduct(map: Map<string, ProductRecord>, handle: string): ProductRecord {
  if (!map.has(handle)) {
    map.set(handle, {
      handle,
      status: "draft",
      tags: [],
      optionNames: Array(3).fill(""),
      variants: [],
      images: [],
    })
  }

  return map.get(handle) as ProductRecord
}

function hydrateProduct(product: ProductRecord, row: ShopifyRow) {
  if (!product.title && row["Title"]) {
    product.title = row["Title"].trim()
  }

  if (!product.description && row["Body (HTML)"]) {
    product.description = row["Body (HTML)"].trim()
  }

  if (row["Published"]) {
    product.status = toBoolean(row["Published"]) ? "published" : "draft"
  }

  const newTags = (row["Tags"] || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
  for (const tag of newTags) {
    if (!product.tags.includes(tag)) {
      product.tags.push(tag)
    }
  }

  for (let i = 1; i <= 3; i++) {
    const name = row[`Option${i} Name` as keyof ShopifyRow]
    const value = row[`Option${i} Value` as keyof ShopifyRow]
    if (name && value) {
      product.optionNames[i - 1] = name.trim()
    }
  }
}

function collectVariant(product: ProductRecord, row: ShopifyRow) {
  const hasVariantData = Boolean(
    row["Variant Price"] || row["Variant SKU"] || row["Option1 Value"]
  )

  if (!hasVariantData) {
    return
  }

  const optionValues = [
    row["Option1 Value"],
    row["Option2 Value"],
    row["Option3 Value"],
  ].map((value) => (value || "").trim())

  const key = `${optionValues.join("||")}::${row["Variant SKU"] || ""}`
  const existing = product.variants.find((variant) => variantKey(variant) === key)

  if (existing) {
    return
  }

  product.variants.push({
    sku: row["Variant SKU"]?.trim() || undefined,
    barcode: row["Variant Barcode"]?.trim() || undefined,
    price: row["Variant Price"]?.trim() || undefined,
    weightGrams: parseNumber(row["Variant Grams"]),
    allowBackorder: (row["Variant Inventory Policy"] || "")
      .toLowerCase()
      .includes("continue"),
    manageInventory: Boolean(row["Variant Inventory Tracker"]?.trim()),
    optionValues,
    title: row["Variant Title"]?.trim() || undefined,
  })
}

function collectImage(product: ProductRecord, row: ShopifyRow) {
  const url = row["Image Src"]?.trim()
  if (!url) {
    return
  }

  const position = parseNumber(row["Image Position"]) ?? product.images.length + 1
  const duplicate = product.images.find((image) => image.url === url)
  if (duplicate) {
    return
  }

  product.images.push({ url, position })
  if (!product.thumbnail || position === 1) {
    product.thumbnail = url
  }
}

function variantKey(variant: VariantRecord): string {
  return `${variant.optionValues.join("||")}::${variant.sku || ""}`
}

type ImageReference = {
  sourceUrl: string
  handle: string
  assign: (next: string) => void
}

async function mirrorProductImages(
  products: ProductRecord[],
  uploader: ImageUploader | null | undefined,
  options: CliOptions
) {
  if (!uploader) {
    return
  }

  const references: ImageReference[] = []

  for (const product of products) {
    product.images.forEach((image) => {
      references.push({
        sourceUrl: image.url,
        handle: product.handle,
        assign: (next) => {
          image.url = next
        },
      })
    })

    if (product.thumbnail) {
      references.push({
        sourceUrl: product.thumbnail,
        handle: product.handle,
        assign: (next) => {
          product.thumbnail = next
        },
      })
    }
  }

  await runWithConcurrency(references, options.concurrency, async (reference) => {
    const newUrl = await uploader.upload(reference.sourceUrl, reference.handle)
    reference.assign(newUrl)
  })

  for (const product of products) {
    if (!product.thumbnail && product.images[0]) {
      product.thumbnail = product.images[0].url
    }
  }
}

function createImageUploader(options: CliOptions): ImageUploader | null {
  if (!options.uploadImages) {
    return null
  }

  const bucket = process.env.CLOUDFLARE_R2_BUCKET
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
  const secretKey = process.env.CLOUDFLARE_R2_SECRET_KEY
  const region = process.env.CLOUDFLARE_R2_REGION ?? "auto"
  const endpoint =
    process.env.CLOUDFLARE_R2_ENDPOINT ||
    (process.env.CLOUDFLARE_R2_ACCOUNT_ID
      ? `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : undefined)

  if (!bucket || !publicUrl || !accessKeyId || !secretKey || !endpoint) {
    throw new Error(
      "Missing Cloudflare R2 configuration. Ensure CLOUDFLARE_R2_BUCKET, PUBLIC_URL, ACCESS_KEY_ID, SECRET_KEY, and ENDPOINT are set."
    )
  }

  const prefix = options.imagePrefix || process.env.CLOUDFLARE_R2_PREFIX || "uploads/"
  const manifest = loadUploadManifest(options.manifestPath)

  return new R2ImageUploader(
    {
      bucket,
      publicUrl,
      accessKeyId,
      secretKey,
      region,
      endpoint,
      prefix,
    },
    {
      manifest,
      manifestPath: options.manifestPath,
      verbose: options.verbose,
    }
  )
}

function loadUploadManifest(filePath: string): UploadManifest {
  try {
    if (!fs.existsSync(filePath)) {
      return {}
    }

    const raw = fs.readFileSync(filePath, "utf-8")
    return JSON.parse(raw) as UploadManifest
  } catch (error) {
    console.warn(`Failed to read image manifest at ${filePath}. Starting fresh.`, error)
    return {}
  }
}

async function saveUploadManifest(filePath: string, manifest: UploadManifest) {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
  await fs.promises.writeFile(filePath, JSON.stringify(manifest, null, 2))
}

class R2ImageUploader implements ImageUploader {
  private client: S3Client
  private bucket: string
  private prefix: string
  private publicUrl: string
  private cache = new Map<string, string>()
  private manifest: UploadManifest
  private manifestPath: string
  private dirty = false
  private verbose: boolean

  constructor(private config: ImageUploadConfig, options: ImageUploaderOptions) {
    this.bucket = config.bucket
    this.publicUrl = config.publicUrl.replace(/\/$/, "")
    this.prefix = normalizePrefix(config.prefix)
    this.manifest = options.manifest
    this.manifestPath = options.manifestPath
    this.verbose = options.verbose
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretKey,
      },
    })
  }

  async upload(sourceUrl: string, handle: string): Promise<string> {
    const normalizedUrl = sourceUrl?.trim()
    if (!normalizedUrl) {
      return ""
    }

    if (this.cache.has(normalizedUrl)) {
      return this.cache.get(normalizedUrl) as string
    }

    if (this.manifest[normalizedUrl]) {
      const cachedUrl = this.manifest[normalizedUrl]
      this.cache.set(normalizedUrl, cachedUrl)
      this.log(`Reusing cached upload for ${normalizedUrl}`)
      return cachedUrl
    }

    const { buffer, contentType } = await withRetry(() => this.downloadImage(normalizedUrl))
    const extension = guessExtension(normalizedUrl, contentType)
    const key = this.buildObjectKey(handle, extension)

    await withRetry(() => this.uploadToR2(key, buffer, contentType))

    const publicUrl = `${this.publicUrl}/${key}`
    this.cache.set(normalizedUrl, publicUrl)
    this.manifest[normalizedUrl] = publicUrl
    this.dirty = true
    this.log(`Uploaded ${normalizedUrl} → ${publicUrl}`)
    return publicUrl
  }

  async flush() {
    if (!this.dirty) {
      return
    }
    await saveUploadManifest(this.manifestPath, this.manifest)
    this.log(`Saved manifest (${Object.keys(this.manifest).length} entries)`)
    this.dirty = false
  }

  private async downloadImage(url: string) {
    this.log(`Downloading ${url}`)
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to download image ${url}: ${response.status} ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const contentType = response.headers.get("content-type") || undefined
    return { buffer: Buffer.from(arrayBuffer), contentType }
  }

  private async uploadToR2(key: string, body: Buffer, contentType?: string) {
    this.log(`Uploading to ${key}`)
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    )
  }

  private buildObjectKey(handle: string, extension: string) {
    const slug = sanitizeHandle(handle) || "product"
    return `${this.prefix}${slug}/${randomUUID()}${extension}`
  }

  private log(message: string) {
    if (this.verbose) {
      console.log(`[images] ${message}`)
    }
  }
}

function normalizePrefix(prefix: string) {
  const trimmed = prefix.replace(/^\/+/, "").replace(/\/+$/, "")
  return trimmed ? `${trimmed}/` : ""
}

function guessExtension(url: string, contentType?: string) {
  try {
    const pathname = new URL(url).pathname
    const match = pathname.match(/\.([a-zA-Z0-9]+)$/)
    if (match) {
      return `.${match[1].toLowerCase()}`
    }
  } catch (error) {
    // noop
  }

  if (!contentType) {
    return ".bin"
  }

  if (contentType.includes("png")) return ".png"
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return ".jpg"
  if (contentType.includes("gif")) return ".gif"
  if (contentType.includes("webp")) return ".webp"
  return ".bin"
}

function sanitizeHandle(handle: string) {
  return handle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  iterator: (item: T, index: number) => Promise<void>
) {
  if (!items.length) {
    return
  }

  const max = Math.max(1, limit)
  let index = 0

  const workers = Array.from({ length: Math.min(max, items.length) }, async () => {
    while (true) {
      const currentIndex = index++
      if (currentIndex >= items.length) {
        break
      }

      await iterator(items[currentIndex], currentIndex)
    }
  })

  await Promise.all(workers)
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 3, baseDelay = 400): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt < attempts) {
        await delay(baseDelay * attempt)
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(typeof lastError === "string" ? lastError : "Operation failed")
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function buildMedusaRows(
  products: ProductRecord[],
  options: CliOptions,
  tagIdMap: Record<string, string>
): { headers: string[]; records: Record<string, string>[] } {
  const baseHeaders = [
    "Product Id",
    "Product Handle",
    "Product Title",
    "Product Subtitle",
    "Product Description",
    "Product Status",
    "Product Thumbnail",
    "Product Weight",
    "Product Length",
    "Product Width",
    "Product Height",
    "Product HS Code",
    "Product Origin Country",
    "Product MID Code",
    "Product Material",
    "Shipping Profile Id",
    "Product Sales Channel 1",
    "Product Collection Id",
    "Product Type Id",
  ]

  const tagHeaders = Array.from({ length: options.maxTags }, (_, idx) => `Product Tag ${idx + 1}`)
  const variantHeaders = [
    "Product Discountable",
    "Product External Id",
    "Variant Id",
    "Variant Title",
    "Variant SKU",
    "Variant Barcode",
    "Variant Allow Backorder",
    "Variant Manage Inventory",
    "Variant Weight",
    "Variant Length",
    "Variant Width",
    "Variant Height",
    "Variant HS Code",
    "Variant Origin Country",
    "Variant MID Code",
    "Variant Material",
  ]

  const priceColumns = buildPriceColumns(options.currency)
  variantHeaders.push(...priceColumns)

  variantHeaders.push(
    "Variant Option 1 Name",
    "Variant Option 1 Value",
    "Variant Option 2 Name",
    "Variant Option 2 Value",
    "Variant Option 3 Name",
    "Variant Option 3 Value"
  )

  const imageHeaders = Array.from(
    { length: options.maxImages },
    (_, idx) => `Product Image ${idx + 1} Url`
  )

  const headers = [...baseHeaders, ...tagHeaders, ...variantHeaders, ...imageHeaders]
  const records: Record<string, string>[] = []

  for (const product of products) {
    const imageUrls = product.images
      .sort((a, b) => a.position - b.position)
      .map((image) => image.url)

    if (!product.variants.length) {
      continue
    }

    for (const variant of product.variants) {
      const record: Record<string, string> = {}
      record["Product Id"] = ""
      record["Product Handle"] = product.handle
      record["Product Title"] = product.title || ""
      record["Product Subtitle"] = ""
      record["Product Description"] = product.description || ""
      record["Product Status"] = product.status
      record["Product Thumbnail"] = product.thumbnail || imageUrls[0] || ""
      record["Product Weight"] = ""
      record["Product Length"] = ""
      record["Product Width"] = ""
      record["Product Height"] = ""
      record["Product HS Code"] = ""
      record["Product Origin Country"] = ""
      record["Product MID Code"] = ""
      record["Product Material"] = ""
      record["Shipping Profile Id"] = ""
      record["Product Sales Channel 1"] = ""
      record["Product Collection Id"] = ""
      record["Product Type Id"] = ""

      tagHeaders.forEach((header, idx) => {
        record[header] = mapTagValue(product.tags[idx], tagIdMap)
      })

      record["Product Discountable"] = "TRUE"
      record["Product External Id"] = ""
      record["Variant Id"] = ""
      record["Variant Title"] = buildVariantTitle(variant, product)
      record["Variant SKU"] = variant.sku || ""
      record["Variant Barcode"] = variant.barcode || ""
      record["Variant Allow Backorder"] = variant.allowBackorder ? "TRUE" : "FALSE"
      record["Variant Manage Inventory"] = variant.manageInventory ? "TRUE" : "FALSE"
      record["Variant Weight"] =
        typeof variant.weightGrams === "number" ? String(variant.weightGrams) : ""
      record["Variant Length"] = ""
      record["Variant Width"] = ""
      record["Variant Height"] = ""
      record["Variant HS Code"] = ""
      record["Variant Origin Country"] = ""
      record["Variant MID Code"] = ""
      record["Variant Material"] = ""

      const prices = buildPriceMap(variant.price, options.currency)
      Object.entries(prices).forEach(([column, value]) => {
        record[column] = value
      })

      for (let i = 0; i < 3; i++) {
        const optionValue = variant.optionValues[i]?.trim() || ""

        if (i === 0) {
          const optionName = product.optionNames[0] || "Title"
          record[`Variant Option 1 Name`] = optionName
          record[`Variant Option 1 Value`] = optionValue || "Default"
          continue
        }

        if (optionValue) {
          const optionName = product.optionNames[i] || `Option ${i + 1}`
          record[`Variant Option ${i + 1} Name`] = optionName
          record[`Variant Option ${i + 1} Value`] = optionValue
        } else {
          record[`Variant Option ${i + 1} Name`] = ""
          record[`Variant Option ${i + 1} Value`] = ""
        }
      }

      imageHeaders.forEach((header, idx) => {
        record[header] = imageUrls[idx] || ""
      })

      records.push(record)
    }
  }

  return { headers, records }
}

function buildPriceColumns(currency: string): string[] {
  const normalizedCurrency = currency.toUpperCase()
  const baseColumn = `Variant Price ${normalizedCurrency}`
  const columns = new Set<string>([baseColumn, "Variant Price India"])
  return Array.from(columns)
}

function buildPriceMap(price: string | undefined, currency: string): Record<string, string> {
  const normalizedCurrency = currency.toUpperCase()
  const value = price || ""
  return {
    [`Variant Price ${normalizedCurrency}`]: value,
    "Variant Price India": value,
  }
}

function loadTagIdMap(filePath: string): Record<string, string> {
  try {
    if (!fs.existsSync(filePath)) {
      return {}
    }

    const raw = fs.readFileSync(filePath, "utf-8")
    const parsed = JSON.parse(raw) as Record<string, string>
    const normalizedEntries = Object.entries(parsed).reduce<Record<string, string>>(
      (acc, [key, value]) => {
        const normalizedKey = key.trim().toLowerCase()
        if (normalizedKey && value) {
          acc[normalizedKey] = value.trim()
        }
        return acc
      },
      {}
    )
    return normalizedEntries
  } catch (error) {
    throw new Error(`Failed to read tag map from ${filePath}: ${error}`)
  }
}

function mapTagValue(tag: string | undefined, tagIdMap: Record<string, string>): string {
  if (!tag) {
    return ""
  }

  const normalized = tag.trim()
  if (!normalized) {
    return ""
  }

  const lookupKey = normalized.toLowerCase()
  return tagIdMap[lookupKey] || normalized
}

function buildVariantTitle(variant: VariantRecord, product: ProductRecord): string {
  const optionPairs = variant.optionValues
    .map((value, idx) => ({ value, name: product.optionNames[idx] }))
    .filter(({ value }) => Boolean(value))

  if (!optionPairs.length) {
    return variant.title || product.title || "Default"
  }

  return optionPairs
    .map(({ name, value }) => (name ? `${name}: ${value}` : value))
    .join(" / ")
}

async function writeMedusaCsv(
  outputPath: string,
  headers: string[],
  records: Record<string, string>[]
) {
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true })

  return new Promise<void>((resolve, reject) => {
    const writable = fs.createWriteStream(outputPath)
    const stringifier = stringify(records, { header: true, columns: headers })
    stringifier.pipe(writable)
    stringifier.on("error", reject)
    writable.on("finish", () => resolve())
    writable.on("error", reject)
  })
}

function toBoolean(value: string): boolean {
  return ["true", "1", "yes"].includes(value.trim().toLowerCase())
}

function parseNumber(value?: string): number | undefined {
  if (!value) {
    return undefined
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

main()
