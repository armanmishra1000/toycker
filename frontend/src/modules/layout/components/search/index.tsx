"use client"

import { useState, useRef, useEffect } from "react"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import SearchModal from "@modules/layout/components/search-modal"
import { useAnimatedPlaceholder } from "@modules/layout/hooks/useAnimatedPlaceholder"

type SearchProps = {
  className?: string
  placeholder?: string
  enableAnimation?: boolean
  animationPhrases?: string[]
}

const defaultSearchSuggestions = [
  "What are you looking for?",
  "Search for toys...",
  "Find building blocks...",
  "Discover action figures...",
  "Browse educational toys...",
  "Explore outdoor games...",
]

const Search = ({
  className = "",
  placeholder = "Search products...",
  enableAnimation = true,
  animationPhrases = defaultSearchSuggestions,
}: SearchProps) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  const shouldAnimate = enableAnimation && !isFocused && searchQuery === "" && !prefersReducedMotion

  const animatedPlaceholder = useAnimatedPlaceholder({
    phrases: animationPhrases,
    typingSpeed: 70,
    deletingSpeed: 40,
    pauseDuration: 2500,
    enabled: shouldAnimate,
  })

  const displayPlaceholder = shouldAnimate ? animatedPlaceholder : placeholder

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/store?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  const handleInputClick = () => {
    setIsModalOpen(true)
  }

  const handleFocus = () => {
    setIsFocused(true)
    handleInputClick()
  }

  const handleBlur = () => {
    setIsFocused(false)
  }

  return (
    <>
      <form onSubmit={handleSearch} className={`relative flex-1 max-w-xl ${className}`}>
        <div className="relative flex items-center">
          <label htmlFor="search-input" className="sr-only">
            Search for toys and products
          </label>
          <div className="absolute left-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
            <MagnifyingGlassIcon className="w-5 h-5 text-white" />
          </div>
          <input
            ref={inputRef}
            id="search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={displayPlaceholder}
            className="w-full py-3 pl-14 pr-4 bg-white rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
            aria-label="Search for toys and products"
          />
        </div>
      </form>

      <SearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        searchQuery={searchQuery}
      />
    </>
  )
}

export default Search
