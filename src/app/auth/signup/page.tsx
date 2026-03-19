import Link from 'next/link'

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
        <p className="mt-2 text-sm text-gray-500">
          Choose how you&apos;ll use BrandGraph
        </p>

        <div className="mt-8 grid gap-4">
          <Link
            href="/auth/signup/brand"
            className="rounded-xl border-2 border-gray-200 p-6 text-left transition hover:border-violet-300 hover:bg-violet-50"
          >
            <h2 className="text-lg font-semibold text-gray-900">I&apos;m a Brand</h2>
            <p className="mt-1 text-sm text-gray-500">
              Protect your brand by managing authorized vendors and distributors.
            </p>
          </Link>

          <Link
            href="/auth/signup/vendor"
            className="rounded-xl border-2 border-gray-200 p-6 text-left transition hover:border-violet-300 hover:bg-violet-50"
          >
            <h2 className="text-lg font-semibold text-gray-900">I&apos;m a Vendor</h2>
            <p className="mt-1 text-sm text-gray-500">
              Get verified credentials from brands you&apos;re authorized to sell.
            </p>
          </Link>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-violet-600 hover:text-violet-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
