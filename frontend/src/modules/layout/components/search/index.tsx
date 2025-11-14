"use client"

import { useState, useRef } from "react"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"

type SearchProps = {
  className?: string
  placeholder?: string
}

const Search = ({ className = "", placeholder = "Search products..." }: SearchProps) => {
  const [searchQuery, setSearchQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/store?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  return (
    <form onSubmit={handleSearch} className={`relative flex-1 max-w-md ${className}`}>
      <div className="relative flex items-center">
        <div className="absolute left-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
          <MagnifyingGlassIcon className="w-5 h-5 text-white" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full py-2 pl-12 pr-4 bg-white/10 border border-white/20 rounded-full text-white placeholder-white/60 focus:outline-none focus:border-white/40 transition-all duration-200"
          aria-label="Search products"
        />
      </div>
    </form>
  )
}

export default Search
