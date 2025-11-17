"use client"

import { addToCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import Divider from "@modules/common/components/divider"
import Modal from "@modules/common/components/modal"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import ProductPrice from "../product-price"
import { isEqual } from "lodash"
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  Gift,
  Heart,
  MessageCircleQuestion,
  Minus,
  Plus,
  Share2,
} from "lucide-react"

const GIFT_WRAP_FEE = 50

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  disabled?: boolean
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

export default function ProductActions({ product, disabled }: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [giftWrap, setGiftWrap] = useState(false)
  const [wishlistSaved, setWishlistSaved] = useState(false)
  const [isQuestionOpen, setIsQuestionOpen] = useState(false)
  const [questionStatus, setQuestionStatus] = useState<"idle" | "success">(
    "idle"
  )
  const [questionForm, setQuestionForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  })
  const [shareCopied, setShareCopied] = useState(false)
  const countryCode = useParams().countryCode as string

  // If there is only 1 variant, preselect the options
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    const saved = window.localStorage.getItem(`wishlist-${product.id}`)
    setWishlistSaved(saved === "true")
  }, [product.id])

  // update the options when a variant is selected
  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  useEffect(() => {
    if (!selectedVariant) {
      return
    }
    if (selectedVariant.manage_inventory) {
      const available = Math.max(selectedVariant.inventory_quantity ?? 0, 0)
      if (available > 0 && quantity > available) {
        setQuantity(available)
      } else if (available === 0 && quantity !== 1) {
        setQuantity(1)
      }
    }
  }, [quantity, selectedVariant])

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    router.replace(pathname + "?" + params.toString())
  }, [selectedVariant, isValidVariant, pathname, router, searchParams])

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    // If we don't manage inventory, we can always add to cart
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    // If we allow back orders on the variant, we can add to cart
    if (selectedVariant?.allow_backorder) {
      return true
    }

    // If there is inventory available, we can add to cart
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    // Otherwise, we can't add to cart
    return false
  }, [selectedVariant])

  const maxQuantity = useMemo(() => {
    if (!selectedVariant) {
      return 10
    }
    if (!selectedVariant.manage_inventory || selectedVariant.allow_backorder) {
      return 10
    }
    return Math.max(selectedVariant.inventory_quantity ?? 0, 0)
  }, [selectedVariant])

  const updateQuantity = (direction: "inc" | "dec") => {
    setQuantity((prev) => {
      if (direction === "dec") {
        return Math.max(1, prev - 1)
      }

      const limit = maxQuantity === 0 ? prev : maxQuantity
      return Math.min(limit || prev + 1, prev + 1)
    })
  }

  const toggleWishlist = useCallback(() => {
    if (typeof window === "undefined") {
      return
    }
    const next = !wishlistSaved
    window.localStorage.setItem(`wishlist-${product.id}`, String(next))
    setWishlistSaved(next)
  }, [product.id, wishlistSaved])

  // add the selected variant to the cart
  const handleAddToCart = async (mode: "add" | "buy" = "add") => {
    if (!selectedVariant?.id) return null

    setIsAdding(true)

    try {
      await addToCart({
        variantId: selectedVariant.id,
        quantity,
        countryCode,
        metadata: giftWrap
          ? {
              gift_wrap: true,
              gift_wrap_fee: GIFT_WRAP_FEE,
            }
          : undefined,
      })

      if (mode === "buy") {
        router.push(`/${countryCode}/checkout`)
      }
    } finally {
      setIsAdding(false)
    }
  }

  const handleQuestionSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setQuestionStatus("success")
    setTimeout(() => {
      setIsQuestionOpen(false)
      setQuestionStatus("idle")
      setQuestionForm({ name: "", phone: "", email: "", message: "" })
    }, 1500)
  }

  const handleShare = async () => {
    if (typeof window === "undefined") {
      return
    }
    const url = window.location.href
    const shareNavigator = navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>
    }
    if (shareNavigator.share) {
      await shareNavigator.share({
        title: product.title,
        url,
      })
      return
    }

    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    } catch (error) {
      console.error("Unable to copy share link", error)
    }
  }

  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-ui-border-base bg-white p-6 shadow-sm">
      {product.collection && (
        <LocalizedClientLink
          href={`/collections/${product.collection.handle}`}
          className="self-start text-sm text-ui-fg-muted underline-offset-4 transition hover:text-ui-fg-base hover:underline"
        >
          {product.collection.title}
        </LocalizedClientLink>
      )}

      <div>
        <h1 className="text-3xl font-semibold text-ui-fg-base">
          {product.title}
        </h1>
        <p className="mt-3 text-sm text-ui-fg-subtle">
          {product.description || "A modern collectible designed for daily joy."}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <ProductPrice product={product} variant={selectedVariant} />
        <p className="text-sm text-ui-fg-muted">Inclusive of taxes. Duties calculated at checkout.</p>
      </div>

      {(product.variants?.length ?? 0) > 1 && (
        <div className="flex flex-col gap-y-4">
          {(product.options || []).map((option) => {
            return (
              <div key={option.id}>
                <OptionSelect
                  option={option}
                  current={options[option.id]}
                  updateOption={setOptionValue}
                  title={option.title ?? ""}
                  data-testid="product-options"
                  disabled={!!disabled || isAdding}
                />
              </div>
            )
          })}
          <Divider />
        </div>
      )}

      <div className="space-y-3">
        <p className="text-sm font-medium text-ui-fg-base">Gift Wrap</p>
        <label className="flex items-center justify-between gap-3 rounded-2xl border border-ui-border-base px-4 py-3 text-sm">
          <div>
            <p className="font-medium text-ui-fg-base">Wrap it for gifting</p>
            <p className="text-xs text-ui-fg-muted">Add a handwritten note + premium wrap</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-ui-fg-interactive">+ ₹{GIFT_WRAP_FEE}</span>
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-ui-border-base text-ui-fg-interactive focus:ring-ui-fg-interactive"
              checked={giftWrap}
              onChange={(event) => setGiftWrap(event.target.checked)}
            />
          </div>
        </label>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-ui-fg-base">Quantity</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => updateQuantity("dec")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ui-border-base text-ui-fg-base transition hover:bg-ui-bg-subtle"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <div className="flex h-12 w-16 items-center justify-center rounded-2xl border border-ui-border-base text-lg font-semibold">
            {quantity}
          </div>
          <button
            type="button"
            onClick={() => updateQuantity("inc")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ui-border-base text-ui-fg-base transition hover:bg-ui-bg-subtle"
            aria-label="Increase quantity"
            disabled={maxQuantity === 0 || (maxQuantity !== 0 && quantity >= maxQuantity)}
          >
            <Plus className="h-4 w-4" />
          </button>
          {maxQuantity !== 0 && (
            <p className="text-xs text-ui-fg-muted">
              {Math.max(maxQuantity - quantity, 0)} pieces left in stock
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          onClick={() => handleAddToCart("add")}
          disabled={
            !inStock ||
            !selectedVariant ||
            !!disabled ||
            isAdding ||
            !isValidVariant
          }
          variant="primary"
          className="w-full"
          isLoading={isAdding}
          data-testid="add-product-button"
        >
          {!selectedVariant && !options
            ? "Select variant"
            : !inStock || !isValidVariant
            ? "Out of stock"
            : "Add to Cart"}
        </Button>
        <Button
          onClick={() => handleAddToCart("buy")}
          disabled={
            !inStock ||
            !selectedVariant ||
            !!disabled ||
            isAdding ||
            !isValidVariant
          }
          variant="secondary"
          className="w-full"
        >
          Buy It Now
        </Button>
      </div>

      <button
        type="button"
        onClick={toggleWishlist}
        className="inline-flex items-center gap-2 text-sm font-semibold text-ui-fg-base"
      >
        <Heart
          className={`h-4 w-4 ${wishlistSaved ? "fill-current text-red-500" : ""}`}
        />
        {wishlistSaved ? "Added to Wishlist" : "Add to Wishlist"}
      </button>

      <div className="space-y-4 rounded-2xl bg-ui-bg-subtle p-4">
        <div className="flex items-center gap-3">
          <Gift className="h-5 w-5 text-ui-fg-interactive" />
          <span className="text-sm text-ui-fg-base">
            Use code <strong>PLAYJOY</strong> for complimentary gift wrap.
          </span>
        </div>
        <Divider />
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => setIsQuestionOpen(true)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-ui-fg-base"
          >
            <MessageCircleQuestion className="h-4 w-4" />
            Ask a question
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 text-sm font-semibold text-ui-fg-base"
          >
            <Share2 className="h-4 w-4" />
            {shareCopied ? "Link copied" : "Share"}
          </button>
        </div>
      </div>

      <Modal
        isOpen={isQuestionOpen}
        close={() => setIsQuestionOpen(false)}
        size="large"
      >
        <Modal.Title>Ask a question</Modal.Title>
        <Modal.Description>
          Fill in the form and our support will get back to you shortly.
        </Modal.Description>
        <Modal.Body>
          <form className="w-full space-y-4" onSubmit={handleQuestionSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                label="Your name"
                value={questionForm.name}
                onChange={(value) =>
                  setQuestionForm((prev) => ({ ...prev, name: value }))
                }
                required
              />
              <InputField
                label="Your phone number"
                value={questionForm.phone}
                onChange={(value) =>
                  setQuestionForm((prev) => ({ ...prev, phone: value }))
                }
              />
            </div>
            <InputField
              label="Your email"
              type="email"
              value={questionForm.email}
              onChange={(value) =>
                setQuestionForm((prev) => ({ ...prev, email: value }))
              }
              required
            />
            <div className="space-y-2">
              <label className="text-sm font-medium text-ui-fg-base">
                Your message
              </label>
              <textarea
                required
                value={questionForm.message}
                onChange={(event) =>
                  setQuestionForm((prev) => ({
                    ...prev,
                    message: event.target.value,
                  }))
                }
                className="min-h-[120px] w-full rounded-2xl border border-ui-border-base px-4 py-3 text-sm focus:border-ui-fg-interactive focus:outline-none"
              />
            </div>
            <Modal.Footer>
              <Button type="button" variant="secondary" onClick={() => setIsQuestionOpen(false)}>
                Back
              </Button>
              <Button type="submit">
                {questionStatus === "success" ? "Message sent" : "Send your message"}
              </Button>
            </Modal.Footer>
          </form>
        </Modal.Body>
      </Modal>
    </section>
  )
}

const InputField = ({
  label,
  type = "text",
  value,
  onChange,
  required,
}: {
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-ui-fg-base">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="w-full rounded-2xl border border-ui-border-base px-4 py-3 text-sm focus:border-ui-fg-interactive focus:outline-none"
      />
    </div>
  )
}
