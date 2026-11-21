export const metadata = {
  title: 'Terms of Service | UnReal Systems',
  description: 'Terms governing use of the UnReal Systems platform and eligibility application.',
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-[#0D0D1A]">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="mt-2 text-sm text-neutral-500">Last updated: 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-neutral-700">
        <section>
          <h2 className="text-lg font-semibold text-[#0D0D1A]">Who this applies to</h2>
          <p className="mt-2">
            These terms apply to anyone submitting the UnReal Systems eligibility application and to
            businesses provisioned a UnReal Systems workspace account. UnReal Systems is operated by
            NotRealEngine, LLC.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#0D0D1A]">Applying is not enrollment</h2>
          <p className="mt-2">
            Submitting the eligibility application does not guarantee acceptance into the
            founding-client pilot or any other program. Our team reviews applications and
            contacts eligible applicants directly.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#0D0D1A]">Workspace accounts</h2>
          <p className="mt-2">
            Workspace access is provisioned by UnReal Systems; there is no public self-registration.
            You are responsible for keeping your login credentials confidential and for the
            accuracy of the business data you enter.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#0D0D1A]">Opportunity credit &amp; pricing</h2>
          <p className="mt-2">
            Opportunity credit limits, activation fees, and membership pricing shown in your
            workspace or application are subject to change and will be confirmed with you
            directly before any charge.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#0D0D1A]">No warranty</h2>
          <p className="mt-2">
            The platform is provided as-is. We work to keep it reliable but do not guarantee
            uninterrupted availability.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#0D0D1A]">Contact</h2>
          <p className="mt-2">
            Questions about these terms can be sent through the channel you used to apply, or via
            the contact details provided on our application form.
          </p>
        </section>
      </div>
    </main>
  )
}
