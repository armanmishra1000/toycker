"use client"

import { useState, useRef } from "react"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import SearchModal from "@modules/layout/components/search-modal"

type SearchProps = {
  className?: string
  placeholder?: string
}

const Search = ({ className = "", placeholder = "Search products..." }: SearchProps) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/store?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  const handleInputClick = () => {
    setIsModalOpen(true)
  }

  return (
    <>
      <form onSubmit={handleSearch} className={`relative flex-1 max-w-xl ${className}`}>
        <div className="relative flex items-center">
          <div className="absolute left-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
            <MagnifyingGlassIcon className="w-5 h-5 text-white" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleInputClick}
            placeholder={placeholder}
            className="w-full py-3 pl-14 pr-4 bg-white rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
            aria-label="Search products"
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
