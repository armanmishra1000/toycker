import { PhoneIcon, EnvelopeIcon, MapPinIcon } from "@heroicons/react/24/outline"

import { ContactForm } from "@modules/contact/components/contact-form"
import { contactInfo } from "@modules/contact/contact.constants"

type ContactPageProps = {
  countryCode: string
}

const ContactPage = (_props: ContactPageProps) => {
  const mapEmbedUrl =
    "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d11031.267338139518!2d72.8773366!3d21.2295626!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be04f919d897d79%3A0x40c662da63c0f822!2sToycker%20Toy%20-%20Online%20%26%20Offline%20Toy%20Store!5e1!3m2!1sen!2sin!4v1764409082059!5m2!1sen!2si"

  return (
    <div className="bg-ui-bg-base py-16">
      <div className="content-container space-y-10">
        <section className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-ui-fg-muted">
            Contact
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-ui-fg-base sm:text-5xl">
            Contact Us – Toycker.com
          </h1>
          <p className="max-w-2xl text-base text-ui-fg-subtle">
            Have a question about a toy, an order, or anything else? Reach out
            using the details and form below and we’ll get back to you as soon
            as we can.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="flex flex-col items-start justify-between rounded-3xl border border-ui-border-base bg-white px-5 py-4 text-sm shadow-sm">
              <div className="space-y-1">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-ui-fg-interactive mb-4">
                  <PhoneIcon className="h-6 w-6 text-primary" aria-hidden="true" />
                </span>
                <p className="text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">
                  Phone number
                </p>
                <a
                  href={contactInfo.phone.href}
                  className="text-base font-medium text-ui-fg-base hover:text-ui-fg-interactive hover:underline"
                >
                  {contactInfo.phone.display}
                </a>
              </div>
            </div>

            <div className="flex flex-col items-start justify-between rounded-3xl border border-ui-border-base bg-white px-5 py-4 text-sm shadow-sm">
              <div className="space-y-1">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-ui-fg-interactive mb-4">
                  <EnvelopeIcon className="h-6 w-6 text-primary" aria-hidden="true" />
                </span>
                <p className="text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">
                  Email
                </p>
                <a
                  href={contactInfo.email.href}
                  className="text-base font-medium text-ui-fg-base hover:text-ui-fg-interactive hover:underline"
                >
                  {contactInfo.email.display}
                </a>
              </div>
            </div>

            <div className="flex flex-col items-start justify-between rounded-3xl border border-ui-border-base bg-white px-5 py-4 text-sm shadow-sm">
              <div className="space-y-1">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-ui-fg-interactive mb-4">
                  <MapPinIcon className="h-6 w-6 text-primary" aria-hidden="true" />
                </span>
                <p className="text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">
                  Address
                </p>
                <p className="whitespace-pre-line text-base font-medium text-ui-fg-base">
                  {contactInfo.address}
                </p>
              </div>
            </div>
          </div>
        </section>
        

        <section className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="space-y-4">
            <iframe
              src={mapEmbedUrl}
              title="Toycker store location map"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-80 w-full rounded-3xl border border-ui-border-base shadow-sm sm:h-[26rem]"
            />

            <div className="inline-flex items-center gap-2 rounded-full border border-ui-border-base bg-white/80 px-4 py-1.5 text-xs font-medium text-ui-fg-muted shadow-sm">
              <span className="inline-block h-2 w-2 rounded-full bg-primary" />
              <span>
                {contactInfo.hours.weekdays} · {contactInfo.hours.sunday}
              </span>
            </div>
          </div>

          <div className="lg:pl-4">
            <ContactForm />
          </div>
        </section>
        
        <section className="rounded-3xl border border-dashed border-ui-border-base bg-white/80 p-5 shadow-xs sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ui-fg-muted">
                Support topics
              </p>
              <h2 className="mt-1 text-lg font-semibold text-ui-fg-base">
                How can we help you?
              </h2>
              <p className="mt-1 text-sm text-ui-fg-subtle">
                Choose the option that best matches your question.
              </p>
            </div>

            <p className="text-xs text-ui-fg-muted">
              Most messages are answered within one business day.
            </p>
          </div>

          <ul className="mt-4 grid gap-2 text-sm text-ui-fg-base sm:grid-cols-2">
            <li className="inline-flex items-center gap-2 rounded-2xl bg-ui-bg-subtle px-3 py-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Product inquiries</span>
            </li>
            <li className="inline-flex items-center gap-2 rounded-2xl bg-ui-bg-subtle px-3 py-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Order tracking</span>
            </li>
            <li className="inline-flex items-center gap-2 rounded-2xl bg-ui-bg-subtle px-3 py-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Return &amp; refund requests</span>
            </li>
            <li className="inline-flex items-center gap-2 rounded-2xl bg-ui-bg-subtle px-3 py-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Bulk purchase queries</span>
            </li>
            <li className="inline-flex items-center gap-2 rounded-2xl bg-ui-bg-subtle px-3 py-2 sm:col-span-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              <span>General feedback</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}

export default ContactPage
