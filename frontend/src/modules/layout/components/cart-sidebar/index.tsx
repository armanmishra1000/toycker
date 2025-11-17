"use client"

import { Fragment } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { XMarkIcon } from "@heroicons/react/24/outline"
import { Button } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import DeleteButton from "@modules/common/components/delete-button"
import { useBodyScrollLock } from "@modules/layout/hooks/useBodyScrollLock"

type CartSidebarProps = {
  isOpen: boolean
  onClose: () => void
  cart?: HttpTypes.StoreCart | null
}

const CartSidebar = ({ isOpen, onClose, cart }: CartSidebarProps) => {
  useBodyScrollLock({ isLocked: isOpen })

  const totalItems =
    cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0

  const subtotal = cart?.subtotal ?? 0

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 flex justify-end">
          <Transition.Child
            as={Fragment}
            enter="transform transition ease-out duration-200"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div>
                  <Dialog.Title className="text-xl font-semibold">
                    Shopping Bag
                  </Dialog.Title>
                  <p className="text-sm text-gray-500">{totalItems} item{totalItems === 1 ? "" : "s"}</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100"
                  aria-label="Close cart sidebar"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                {cart && cart.items?.length ? (
                  cart.items
                    .sort((a, b) => ((a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1))
                    .map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <LocalizedClientLink
                          href={`/products/${item.product_handle}`}
                          className="w-24 flex-shrink-0"
                          onClick={onClose}
                        >
                          <Thumbnail
                            thumbnail={item.thumbnail}
                            images={item.variant?.product?.images}
                            size="square"
                          />
                        </LocalizedClientLink>

                        <div className="flex flex-col flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col">
                              <LocalizedClientLink
                                href={`/products/${item.product_handle}`}
                                className="text-base font-medium line-clamp-2"
                                onClick={onClose}
                              >
                                {item.title}
                              </LocalizedClientLink>
                              <LineItemOptions variant={item.variant} />
                              <span className="text-sm text-gray-500">
                                Quantity: {item.quantity}
                              </span>
                            </div>
                            <LineItemPrice
                              item={item}
                              style="tight"
                              currencyCode={cart.currency_code}
                            />
                          </div>

                          <div className="mt-3">
                            <DeleteButton id={item.id}>Remove</DeleteButton>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="flex flex-col items-center justify-center text-center gap-3 py-16 text-gray-500">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-base font-semibold text-gray-700">
                      {totalItems}
                    </div>
                    <p>Your shopping bag is empty.</p>
                    <LocalizedClientLink href="/store" onClick={onClose} className="text-primary font-medium">
                      Continue shopping
                    </LocalizedClientLink>
                  </div>
                )}
              </div>

              <div className="border-t px-6 py-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold">Subtotal</span>
                  <span className="text-lg font-semibold" data-testid="cart-sidebar-subtotal">
                    {convertToLocale({
                      amount: subtotal,
                      currency_code: cart?.currency_code ?? "inr",
                    })}
                  </span>
                </div>
                <LocalizedClientLink href="/cart" onClick={onClose} passHref>
                  <Button className="w-full" size="large">
                    View cart
                  </Button>
                </LocalizedClientLink>
                <LocalizedClientLink href="/checkout" onClick={onClose} passHref>
                  <Button className="w-full" size="large" variant="secondary">
                    Checkout
                  </Button>
                </LocalizedClientLink>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}

export default CartSidebar
