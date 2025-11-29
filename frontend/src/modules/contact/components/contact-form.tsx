'use client'

import { FormEvent, useState } from "react"

type ContactFormValues = {
  name: string
  email: string
  phone: string
  message: string
}

type ContactFormErrors = Partial<Record<keyof ContactFormValues, string>>

const initialValues: ContactFormValues = {
  name: "",
  email: "",
  phone: "",
  message: "",
}

export function ContactForm() {
  const [values, setValues] = useState<ContactFormValues>(initialValues)
  const [errors, setErrors] = useState<ContactFormErrors>({})
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const validate = (formValues: ContactFormValues): ContactFormErrors => {
    const nextErrors: ContactFormErrors = {}

    if (!formValues.name.trim()) {
      nextErrors.name = "Please enter your name."
    }

    if (!formValues.email.trim()) {
      nextErrors.email = "Email is required."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email.trim())) {
      nextErrors.email = "Enter a valid email address."
    }

    if (!formValues.message.trim()) {
      nextErrors.message = "Let us know how we can help."
    }

    return nextErrors
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    setHasSubmitted(true)

    if (Object.keys(nextErrors).length === 0) {
      setValues(initialValues)
    }
  }

  const fieldClassName = (field: keyof ContactFormValues) => {
    const baseClass =
      "w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ui-border-focus"
    const errorClass = errors[field]
      ? "border-red-300 focus:ring-red-200"
      : "border-ui-border-base focus:border-ui-border-strong"
    return `${baseClass} ${errorClass}`
  }

  return (
    <section
      aria-labelledby="contact-form-title"
      className="space-y-6"
    >
      <div className="space-y-2">
        <h2
          id="contact-form-title"
          className="text-2xl font-semibold text-ui-fg-base"
        >
          Contact Us
        </h2>
        <p className="text-sm text-ui-fg-subtle">
          Send us a quick message and our team will get back to you soon.
        </p>
      </div>

      {hasSubmitted && Object.keys(errors).length === 0 && (
        <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Thanks for reaching out! We’ll get back to you shortly.
        </div>
      )}

      <form
        className="space-y-4 rounded-3xl border border-ui-border-base bg-white p-6 shadow-lg"
        noValidate
        onSubmit={handleSubmit}
      >
        <div>
          <label
            htmlFor="contact-name"
            className="text-sm font-medium text-ui-fg-base"
          >
            Name<span className="text-red-500">*</span>
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            className={fieldClassName("name")}
            value={values.name}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, name: event.target.value }))
            }
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            autoComplete="name"
          />
          {errors.name && (
            <p id="contact-name-error" className="mt-1 text-xs text-red-600">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="contact-email"
            className="text-sm font-medium text-ui-fg-base"
          >
            Email<span className="text-red-500">*</span>
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            className={fieldClassName("email")}
            value={values.email}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, email: event.target.value }))
            }
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            autoComplete="email"
          />
          {errors.email && (
            <p id="contact-email-error" className="mt-1 text-xs text-red-600">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="contact-phone"
            className="text-sm font-medium text-ui-fg-base"
          >
            Phone (optional)
          </label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            className={fieldClassName("phone")}
            value={values.phone}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, phone: event.target.value }))
            }
            autoComplete="tel"
          />
        </div>

        <div>
          <label
            htmlFor="contact-message"
            className="text-sm font-medium text-ui-fg-base"
          >
            Message<span className="text-red-500">*</span>
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows={5}
            className={fieldClassName("message")}
            value={values.message}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, message: event.target.value }))
            }
            aria-invalid={Boolean(errors.message)}
            aria-describedby={
              errors.message ? "contact-message-error" : undefined
            }
          />
          {errors.message && (
            <p id="contact-message-error" className="mt-1 text-xs text-red-600">
              {errors.message}
            </p>
          )}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-bg-interactive sm:w-auto"
          >
            Send
          </button>
        </div>
      </form>
    </section>
  )
}
