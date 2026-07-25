export const metadata = {
  title: 'Privacy Policy | UnReal BS',
  description: 'How UnReal BS collects, uses, and protects your information.',
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-[#0D0D1A]">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-neutral-500">Last updated: 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-neutral-700">
        <section>
          <h2 className="text-lg font-semibold text-[#0D0D1A]">What we collect</h2>
          <p className="mt-2">
            When you submit the eligibility application or contact us, we collect the information
            you provide: business name, owner name, phone number, email address, business type,
            service area, and details about your business needs. We do not collect payment card
            or banking information through this site.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#0D0D1A]">How we use it</h2>
          <p className="mt-2">
            We use this information to evaluate your application, contact you about eligibility,
            and, if you become a client, to operate your UnReal BS workspace. Application data is
            stored in our GoHighLevel CRM and is only accessible to the UnReal BS team.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#0D0D1A]">What we don&apos;t do</h2>
          <p className="mt-2">
            We do not sell your information to third parties. We do not share it outside the
            UnReal BS team except with service providers (such as GoHighLevel, our CRM and
            communications platform) strictly to operate the service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#0D0D1A]">Data for logged-in workspaces</h2>
          <p className="mt-2">
            If you are provisioned a workspace account, business data you enter (such as Udhar
            Khata ledger entries) is stored in our database and is only accessible to your
            account and the UnReal BS team for support purposes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#0D0D1A]">Your choices</h2>
          <p className="mt-2">
            You can ask us to correct or delete your information at any time by contacting us
            using the details below.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#0D0D1A]">Contact</h2>
          <p className="mt-2">
            UnReal BS is operated by NotRealEngine, LLC. For privacy questions or data requests,
            contact the team through the channel you used to apply, or via WhatsApp/email
            provided on our application form.
          </p>
        </section>
      </div>
    </main>
  )
}
