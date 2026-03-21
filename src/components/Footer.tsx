import Image from 'next/image'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-gray-200 px-5 md:px-8 py-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between flex-wrap gap-4">
        <p className="text-xs text-gray-400 font-light">
          &copy; {new Date().getFullYear()} Mercavi &middot;{' '}
          <Link href="/privacy" className="text-violet-600 no-underline hover:text-violet-500">
            Privacy
          </Link>{' '}
          &middot;{' '}
          <Link href="/terms" className="text-violet-600 no-underline hover:text-violet-500">
            Terms
          </Link>{' '}
          &middot;{' '}
          <Link href="/disclaimer" className="text-violet-600 no-underline hover:text-violet-500">
            Disclaimer
          </Link>
        </p>

        <a
          href="https://m8ven.com/developers?ref=mercavi"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3.5 py-1.5 no-underline transition-colors hover:border-violet-300"
        >
          <Image src="/m8ven-logo.png" alt="M8ven" width={20} height={20} className="rounded shrink-0" />
          <span className="text-[11.5px] text-gray-400">
            Powered by <strong className="font-medium text-gray-600">M8ven</strong>
          </span>
        </a>
      </div>
    </footer>
  )
}
