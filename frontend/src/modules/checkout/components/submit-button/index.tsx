"use client"

import { Button } from "@medusajs/ui"
import React from "react"
import { useFormStatus } from "react-dom"

export function SubmitButton({
  children,
  variant = "primary",
  className,
  "data-testid": dataTestId,
  pending,
}: {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "transparent" | "danger" | null
  className?: string
  "data-testid"?: string
  pending?: boolean
}) {
  const { pending: formStatusPending } = useFormStatus()

  // Use pending prop if provided, otherwise fall back to useFormStatus
  const isLoading = pending !== undefined ? pending : formStatusPending

  return (
    <Button
      size="large"
      className={className}
      type="submit"
      isLoading={isLoading}
      variant={variant || "primary"}
      data-testid={dataTestId}
    >
      {children}
    </Button>
  )
}
