"use client"

import { clx } from "@medusajs/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { useOptionalStorefrontFilters } from "@modules/store/context/storefront-filters"

export function Pagination({
  page,
  totalPages,
  'data-testid': dataTestid
}: {
  page: number
  totalPages: number
  'data-testid'?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const storefrontFilters = useOptionalStorefrontFilters()

  const currentPage = storefrontFilters ? storefrontFilters.filters.page : page
  const pagesCount = storefrontFilters ? storefrontFilters.totalPages : totalPages

  // Helper function to generate an array of numbers within a range
  const arrayRange = (start: number, stop: number) =>
    Array.from({ length: stop - start + 1 }, (_, index) => start + index)

  // Function to handle page changes
  const handlePageChange = (newPage: number) => {
    if (storefrontFilters) {
      storefrontFilters.setPage(newPage)
      return
    }
    const params = new URLSearchParams(searchParams)
    params.set("page", newPage.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  // Function to render a page button
  const renderPageButton = (
    p: number,
    label: string | number,
    isCurrent: boolean
  ) => (
    <button
      key={p}
      className={clx("txt-xlarge-plus text-ui-fg-muted", {
        "text-ui-fg-base hover:text-ui-fg-subtle": isCurrent,
      })}
      disabled={isCurrent}
      onClick={() => handlePageChange(p)}
    >
      {label}
    </button>
  )

  // Function to render ellipsis
  const renderEllipsis = (key: string) => (
    <span
      key={key}
      className="txt-xlarge-plus text-ui-fg-muted items-center cursor-default"
    >
      ...
    </span>
  )

  // Function to render page buttons based on the current page and total pages
  const renderPageButtons = () => {
    const buttons = []

    if (pagesCount <= 7) {
      // Show all pages
      buttons.push(
        ...arrayRange(1, pagesCount).map((p) =>
          renderPageButton(p, p, p === currentPage)
        )
      )
    } else {
      // Handle different cases for displaying pages and ellipses
      if (currentPage <= 4) {
        // Show 1, 2, 3, 4, 5, ..., lastpage
        buttons.push(
          ...arrayRange(1, 5).map((p) => renderPageButton(p, p, p === currentPage))
        )
        buttons.push(renderEllipsis("ellipsis1"))
        buttons.push(
          renderPageButton(pagesCount, pagesCount, pagesCount === currentPage)
        )
      } else if (currentPage >= pagesCount - 3) {
        // Show 1, ..., lastpage - 4, lastpage - 3, lastpage - 2, lastpage - 1, lastpage
        buttons.push(renderPageButton(1, 1, 1 === currentPage))
        buttons.push(renderEllipsis("ellipsis2"))
        buttons.push(
          ...arrayRange(pagesCount - 4, pagesCount).map((p) =>
            renderPageButton(p, p, p === currentPage)
          )
        )
      } else {
        // Show 1, ..., page - 1, page, page + 1, ..., lastpage
        buttons.push(renderPageButton(1, 1, 1 === currentPage))
        buttons.push(renderEllipsis("ellipsis3"))
        buttons.push(
          ...arrayRange(currentPage - 1, currentPage + 1).map((p) =>
            renderPageButton(p, p, p === currentPage)
          )
        )
        buttons.push(renderEllipsis("ellipsis4"))
        buttons.push(
          renderPageButton(pagesCount, pagesCount, pagesCount === currentPage)
        )
      }
    }

    return buttons
  }

  // Render the component
  return (
    <div className="flex justify-center w-full mt-12">
      <div className="flex gap-3 items-end" data-testid={dataTestid}>{renderPageButtons()}</div>
    </div>
  )
}
