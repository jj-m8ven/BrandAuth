import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-gray-900">BrandGraph</span>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="max-w-2xl text-5xl font-bold tracking-tight text-gray-900">
          Know who&apos;s authorized to sell your brand
        </h1>
        <p className="mt-6 max-w-lg text-lg text-gray-500">
          BrandGraph gives brands a simple way to authorize vendors, issue verifiable
          credentials, and let anyone check authorization status in real time.
        </p>
        <div className="mt-10 flex gap-4">
          <Link
            href="/auth/signup/brand"
            className="rounded-lg bg-violet-600 px-6 py-3 text-sm font-medium text-white hover:bg-violet-700"
          >
            I&apos;m a Brand
          </Link>
          <Link
            href="/auth/signup/vendor"
            className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            I&apos;m a Vendor
          </Link>
        </div>

        {/* Feature grid */}
        <div className="mx-auto mt-24 grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="text-left">
            <h3 className="text-sm font-semibold text-gray-900">Authorize vendors</h3>
            <p className="mt-1 text-sm text-gray-500">
              Define tiers, set channel restrictions, and issue credentials to your authorized sellers.
            </p>
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-gray-900">Verify in real time</h3>
            <p className="mt-1 text-sm text-gray-500">
              Anyone can check if a vendor is authorized — shareable verification links for marketplaces and email signatures.
            </p>
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-gray-900">Powered by M8ven</h3>
            <p className="mt-1 text-sm text-gray-500">
              Built on M8ven&apos;s trust infrastructure — passport scores, compliance data, and verified profiles.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-400">
        BrandGraph &mdash; a product built on M8ven
      </footer>
    </div>
  )
}
