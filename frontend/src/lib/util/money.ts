import { isEmpty } from "./isEmpty"

type ConvertToLocaleParams = {
  amount: number
  currency_code: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

export const convertToLocale = ({
  amount,
  currency_code,
  minimumFractionDigits,
  maximumFractionDigits,
  locale,
}: ConvertToLocaleParams) => {
  const normalizedCurrency = currency_code && !isEmpty(currency_code)
    ? currency_code.toUpperCase()
    : ""

  const normalizedLocale = (() => {
    const hasLocale = locale && !isEmpty(locale)
    if (hasLocale) return locale as string
    if (normalizedCurrency === "INR") return "en-IN"
    return "en-US"
  })()

  if (!currency_code || isEmpty(currency_code)) {
    return amount.toString()
  }

  const format = () =>
    new Intl.NumberFormat(normalizedLocale, {
      style: "currency",
      currency: normalizedCurrency,
      currencyDisplay: "symbol",
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(amount)

  // Primary formatting
  let formatted = format()

  // If INR still renders without the symbol (font/locale issues), try narrowSymbol, then manual prefix
  if (normalizedCurrency === "INR" && !formatted.includes("₹")) {
    formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(amount)

    if (!formatted.includes("₹")) {
      const localized = new Intl.NumberFormat("en-IN", {
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(amount)
      formatted = `₹${localized}`
    }
  }

  return formatted
}
