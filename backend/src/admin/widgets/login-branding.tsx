import { useEffect } from "react"
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Heading } from "@medusajs/ui"

const LoginBranding = () => {
  useEffect(() => {
    const defaultHeading = document.querySelector(
      "h1:not([data-login-branding])"
    )

    if (defaultHeading) {
      ;(defaultHeading as HTMLElement).style.display = "none"
      // Alternatively, replace text instead of hiding:
      // defaultHeading.textContent = "Welcome to Toycker"
    }
  }, [])

  return (
    <div className="text-center my-6">
      <Heading level="h1" data-login-branding>
        Welcome to Toycker
      </Heading>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "login.before",
})

export default LoginBranding
