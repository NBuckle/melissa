/**
 * Distribution Success Page
 *
 * Confirmation page after successful distribution submission.
 */

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DistributionSuccessPage() {
  return (
    <div className="max-w-2xl mx-auto py-12">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <CardTitle className="text-center text-2xl">
            Distribution Submitted Successfully!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-gray-600">
            The distribution has been recorded and inventory levels have been updated.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/admin/distributions">
              <Button variant="outline">View All Distributions</Button>
            </Link>
            <Link href="/inventory/total">
              <Button variant="outline">Check Inventory</Button>
            </Link>
            <Link href="/admin/distributions">
              <Button>Create Another Distribution</Button>
            </Link>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
            <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
              <li>Inventory has been updated with the distribution</li>
              <li>The master inventory view has been refreshed</li>
              <li>All stock levels are now accurate</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
