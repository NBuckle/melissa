/**
 * Email Verification Page
 *
 * Shows message to user to check their email after requesting magic link.
 */

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
          <p className="mt-4 text-gray-600">
            We&apos;ve sent you a magic link to sign in. Click the link in your email
            to continue.
          </p>

          <p className="mt-6 text-sm text-gray-500">
            Didn&apos;t receive the email? Check your spam folder or{' '}
            <a href="/login" className="text-blue-600 hover:underline">
              try again
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
