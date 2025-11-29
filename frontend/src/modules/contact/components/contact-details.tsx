import { contactInfo } from "@modules/contact/contact.constants"

export function ContactDetails() {
  return (
    <section
      aria-labelledby="contact-details-title"
      className="space-y-6"
    >
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-ui-fg-muted">
          Contact options
        </p>
        <h2
          id="contact-details-title"
          className="text-2xl font-semibold text-ui-fg-base"
        >
          Customer Support
        </h2>
        <p className="text-base text-ui-fg-subtle">
          We’re here to answer questions about products, orders, or anything
          Toycker related.
        </p>
      </div>

      <div className="space-y-4">
        <article className="rounded-2xl border border-ui-border-base bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-ui-fg-base">Customer Support</h3>
          <dl className="mt-3 space-y-2 text-sm text-ui-fg-subtle">
            <div>
              <dt className="sr-only">Phone</dt>
              <dd>
                📞 Phone:{" "}
                <a
                  href={contactInfo.phone.href}
                  className="font-medium text-ui-fg-interactive hover:underline"
                >
                  {contactInfo.phone.display}
                </a>
              </dd>
            </div>
            <div>
              <dt className="sr-only">Email</dt>
              <dd>
                📧 Email:{" "}
                <a
                  href={contactInfo.email.href}
                  className="font-medium text-ui-fg-interactive hover:underline"
                >
                  {contactInfo.email.display}
                </a>
              </dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-ui-border-base bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-ui-fg-base">Business Address</h3>
          <address className="mt-3 whitespace-pre-line text-sm not-italic text-ui-fg-subtle">
            {contactInfo.address}
          </address>
        </article>

        <article className="rounded-2xl border border-ui-border-base bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-ui-fg-base">Business Hours</h3>
          <dl className="mt-3 space-y-1 text-sm text-ui-fg-subtle">
            <div>
              <dt className="sr-only">Weekdays</dt>
              <dd>🕒 {contactInfo.hours.weekdays}</dd>
            </div>
            <div>
              <dt className="sr-only">Sunday</dt>
              <dd>❌ {contactInfo.hours.sunday}</dd>
            </div>
          </dl>
        </article>
      </div>
    </section>
  )
}
