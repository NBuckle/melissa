/**
 * Collection Success Page
 *
 * Confirmation page after submitting a collection.
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CollectionSuccessPage({
  searchParams,
}: {
  searchParams: { id?: string }
}) {
  const collectionId = searchParams.id

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="h-12 w-12 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <CardTitle className="text-2xl text-green-600">
                Collection Submitted Successfully!
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-gray-600">
              Your donation collection has been recorded in the system.
            </p>
            {collectionId && (
              <p className="text-sm text-gray-500 mt-2">
                Collection ID: <span className="font-mono">{collectionId}</span>
              </p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Inventory totals have been automatically updated</li>
              <li>• Your submission is now visible in the daily inventory</li>
              <li>• Administrators can view and manage the collection</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/collect" className="flex-1">
              <Button variant="primary" className="w-full">
                Submit Another Collection
              </Button>
            </Link>
            <Link href="/dashboard" className="flex-1">
              <Button variant="outline" className="w-full">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
