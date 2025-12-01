import { Spinner, Trash } from "@medusajs/icons"
import { clx } from "@medusajs/ui"
import { ReactNode, useState } from "react"
import { useCartSidebar } from "@modules/layout/context/cart-sidebar-context"

const DeleteButton = ({
  id,
  children,
  className,
}: {
  id: string
  children?: ReactNode
  className?: string
}) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const { removeLineItem } = useCartSidebar()

  const handleDelete = async (lineItemId: string) => {
    setIsDeleting(true)

    try {
      await removeLineItem(lineItemId)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div
      className={clx(
        "flex items-center justify-between text-small-regular",
        className
      )}
    >
      <button
        className="flex gap-x-1 text-ui-fg-subtle hover:text-ui-fg-base cursor-pointer"
        onClick={() => handleDelete(id)}
      >
        {isDeleting ? <Spinner className="animate-spin" /> : <Trash />}
        <span>{children}</span>
      </button>
    </div>
  )
}

export default DeleteButton
