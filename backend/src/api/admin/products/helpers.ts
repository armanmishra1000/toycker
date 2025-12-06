type PriceRule = {
  attribute?: string | null
  value?: string | null
}

type Price = {
  id: string
  amount: number
  currency_code: string
  min_quantity?: number | null
  max_quantity?: number | null
  created_at: Date
  updated_at: Date
  price_rules?: PriceRule[]
}

type PriceSet = {
  prices?: Price[]
}

type Variant = {
  id: string
  price_set?: PriceSet
  prices?: Price[]
  [key: string]: unknown
}

const isPricingField = (fieldName: string) =>
  fieldName.startsWith("variants.prices") ||
  fieldName.startsWith("*variants.prices") ||
  fieldName.startsWith("prices") ||
  fieldName.startsWith("*prices")

export const remapKeysForProduct = (selectFields: string[]) => {
  const productFields = selectFields.filter((fieldName) => !isPricingField(fieldName))
  const pricingFields = selectFields
    .filter((fieldName) => isPricingField(fieldName))
    .map((fieldName) => fieldName.replace("variants.prices.", "variants.price_set.prices."))

  return [...productFields, ...pricingFields]
}

const buildRules = (price: Price) => {
  const rules: Record<string, string | null | undefined> = {}

  for (const priceRule of price.price_rules ?? []) {
    const ruleAttribute = priceRule.attribute
    if (ruleAttribute) {
      rules[ruleAttribute] = priceRule.value
    }
  }

  return rules
}

const remapVariantResponse = (variant: Variant | undefined) => {
  if (!variant) {
    return variant
  }

  const resp: Variant = {
    ...variant,
    prices: variant.price_set?.prices?.map((price) => ({
      id: price.id,
      amount: price.amount,
      currency_code: price.currency_code,
      min_quantity: price.min_quantity,
      max_quantity: price.max_quantity,
      variant_id: variant.id,
      created_at: price.created_at,
      updated_at: price.updated_at,
      rules: buildRules(price),
    })),
  }

  delete resp.price_set

  return resp
}

export const remapProductResponse = (product: Record<string, unknown>) => {
  if (!product) {
    return product
  }

  const variants = Array.isArray(product.variants)
    ? (product.variants as Variant[]).map(remapVariantResponse)
    : product.variants

  return {
    ...product,
    variants,
  }
}
