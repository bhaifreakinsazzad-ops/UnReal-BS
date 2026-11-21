export const metadata = {
  title: 'Privacy Policy | UnReal Systems',
  description: 'How UnReal Systems collects, uses, and protects your information.',
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-[#0D0D1A]">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-neutral-500">Last updated: 5 August 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-neutral-700">
        <section>
          <h2 className="text-lg font-semibold text-[#0D0D1A]">What we collect</h2>
          <p className="mt-2">
            When you submit the eligibility application or contact us, we collect the information
            you provide: business name, owner name, phone number, email address, business type,
            service area, and details about your business needs. If you purchase a platform
            product, we also collect buyer contact details, the selected mobile-financial-service
            provider, and the transfer reference needed for manual verification. We never ask for
            a payment PIN, password, OTP, or full payment-card credential.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#0D0D1A]">How we use it</h2>
          <p className="mt-2">
            We use this information to evaluate your application, contact you about eligibility,
            and, if you become a client, to operate your UnReal Systems workspace. Application data is
            stored in our GoHighLevel CRM and is only accessible to the UnReal Systems team.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#0D0D1A]">What we don&apos;t do</h2>
          <p className="mt-2">
            We do not sell your information to third parties. We share only the minimum required
            with service providers used to operate the service, such as GoHighLevel for CRM and,
            after marketing consent, Meta for campaign measurement as described below.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#0D0D1A]">Meta measurement and consent</h2>
          <p className="mt-2">
            Meta Pixel is not loaded until you allow marketing measurement. With consent, we may
            send page, application, checkout, and confirmed-purchase events to Meta. Email and
            phone identifiers are normalized and SHA-256 hashed before server-side transmission.
            Browser and server events share an event ID so Meta can deduplicate them. A submitted
            payment reference is never treated as a purchase; Purchase is sent only after payment
            is confirmed.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#0D0D1A]">Attribution and retention</h2>
          <p className="mt-2">
            We may retain bounded campaign parameters, fbclid, landing page, referrer, consent
            version, and event IDs for attribution and fraud investigation. Attribution records
            are kept only as long as needed for measurement and support, normally no longer than
            13 months, while transaction and audit records may be retained longer where required
            for accounting, disputes, security, or law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#0D0D1A]">Data for logged-in workspaces</h2>
          <p className="mt-2">
            If you are provisioned a workspace account, business data you enter is stored in
            our database and is only accessible to your
            account and the UnReal Systems team for support purposes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#0D0D1A]">Your choices</h2>
          <p className="mt-2">
            Use the Privacy choices control on the site to withdraw marketing consent at any time.
            Withdrawal stops future Meta events but cannot recall events already processed by a
            provider. You can also ask us to correct or delete eligible information by contacting
            us using the details below.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#0D0D1A]">Contact</h2>
          <p className="mt-2">
            UnReal Systems is operated by NotRealEngine, LLC. For privacy questions or data requests,
            contact the team through the channel you used to apply, or via WhatsApp/email
            provided on our application form.
          </p>
        </section>
      </div>
    </main>
  )
}
