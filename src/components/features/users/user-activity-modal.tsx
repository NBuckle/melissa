/**
 * User Activity Modal Component
 *
 * Displays detailed activity for a specific user.
 */

'use client'

import { useEffect, useState } from 'react'
import { getUserActivity } from '@/app/actions/users'
import { format } from 'date-fns'

interface UserActivityModalProps {
  userId: string
  onClose: () => void
}

export function UserActivityModal({ userId, onClose }: UserActivityModalProps) {
  const [loading, setLoading] = useState(true)
  const [activity, setActivity] = useState<any>(null)
  const [days, setDays] = useState(30)

  useEffect(() => {
    loadActivity()
  }, [userId, days])

  const loadActivity = async () => {
    setLoading(true)
    const result = await getUserActivity(userId, days)
    if (result.activity) {
      setActivity(result.activity)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 my-8">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">User Activity</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Date Range Selector */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700">
              Time Period
            </label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="mt-1 block w-48 px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading activity...</p>
            </div>
          ) : activity ? (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600">Collections</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {activity.totalCollections}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600">Items Collected</p>
                  <p className="text-2xl font-bold text-green-900">
                    {activity.totalItemsCollected}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-600">Withdrawals</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {activity.totalWithdrawals}
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-600">Items Withdrawn</p>
                  <p className="text-2xl font-bold text-red-900">
                    {activity.totalItemsWithdrawn}
                  </p>
                </div>
              </div>

              {/* Recent Collections */}
              {activity.recentCollections.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">
                    Recent Collections ({activity.recentCollections.length})
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {activity.recentCollections.map((collection: any) => (
                      <div
                        key={collection.id}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {format(
                              new Date(collection.submission_date),
                              'MMM d, yyyy'
                            )}
                          </p>
                          <p className="text-xs text-gray-600">
                            {collection.collection_items.length} items
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-700">
                            {collection.collection_items
                              .reduce((sum: number, i: any) => sum + Number(i.quantity), 0)
                              .toFixed(0)}{' '}
                            total qty
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Withdrawals */}
              {activity.recentWithdrawals.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">
                    Recent Withdrawals ({activity.recentWithdrawals.length})
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {activity.recentWithdrawals.map((withdrawal: any) => (
                      <div
                        key={withdrawal.id}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {format(
                              new Date(withdrawal.withdrawal_date),
                              'MMM d, yyyy'
                            )}
                          </p>
                          <p className="text-xs text-gray-600">
                            {withdrawal.distribution_type.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-red-700">
                            {withdrawal.withdrawal_items
                              .reduce((sum: number, i: any) => sum + Number(i.quantity), 0)
                              .toFixed(0)}{' '}
                            total qty
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Activity */}
              {activity.totalCollections === 0 &&
                activity.totalWithdrawals === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      No activity in the last {days} days
                    </p>
                  </div>
                )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Failed to load activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
