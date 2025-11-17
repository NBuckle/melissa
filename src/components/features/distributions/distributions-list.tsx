/**
 * Distributions List Component
 *
 * Displays a list of recent distributions with expandable details.
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

interface WithdrawalItemData {
  quantity: number
  item: {
    name: string
    unit_type: string
  }
}

interface Withdrawal {
  id: string
  withdrawal_date: string
  withdrawal_timestamp: string
  recipient: string | null
  reason: string | null
  notes: string | null
  kits_created: number | null
  profile: {
    full_name: string | null
    email: string
  }
  distribution_type: {
    name: string
    requires_recipient: boolean
  }
  kit_template: {
    name: string
    description: string | null
  } | null
  withdrawal_items: WithdrawalItemData[]
}

interface DistributionsListProps {
  withdrawals: Withdrawal[]
}

export function DistributionsList({ withdrawals }: DistributionsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (withdrawals.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-gray-500">
            No distributions recorded yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const getTotalQuantity = (withdrawal: Withdrawal) => {
    return withdrawal.withdrawal_items.reduce(
      (sum, item) => sum + item.quantity,
      0
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Distributions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {withdrawals.map((withdrawal) => {
            const isExpanded = expandedId === withdrawal.id
            const totalQty = getTotalQuantity(withdrawal)

            return (
              <div
                key={withdrawal.id}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Summary Row */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                  onClick={() => toggleExpand(withdrawal.id)}
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-medium">
                        {format(
                          new Date(withdrawal.withdrawal_date),
                          'MMM d, yyyy'
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Type</p>
                      <Badge variant="default">
                        {withdrawal.distribution_type.name}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Recipient</p>
                      <p className="font-medium">
                        {withdrawal.recipient || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Items / Qty</p>
                      <p className="font-medium">
                        {withdrawal.withdrawal_items.length} items / {totalQty.toFixed(0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">By</p>
                      <p className="font-medium text-sm">
                        {withdrawal.profile.full_name || withdrawal.profile.email}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4">
                    <svg
                      className={`w-5 h-5 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                    {/* Kit Info */}
                    {withdrawal.kit_template && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Kit Template
                        </p>
                        <p className="text-sm text-gray-600">
                          {withdrawal.kit_template.name}
                          {withdrawal.kits_created && (
                            <span className="ml-2">
                              ({withdrawal.kits_created} kits created)
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    {/* Items Table */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Items Distributed
                      </p>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-white">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Item
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Unit
                              </th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                Quantity
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {withdrawal.withdrawal_items.map((item, idx) => (
                              <tr key={idx}>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {item.item.name}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-600">
                                  {item.item.unit_type}
                                </td>
                                <td className="px-4 py-2 text-sm text-right font-medium text-red-700">
                                  {item.quantity.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Reason & Notes */}
                    {(withdrawal.reason || withdrawal.notes) && (
                      <div className="space-y-2">
                        {withdrawal.reason && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              Reason
                            </p>
                            <p className="text-sm text-gray-600">
                              {withdrawal.reason}
                            </p>
                          </div>
                        )}
                        {withdrawal.notes && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              Notes
                            </p>
                            <p className="text-sm text-gray-600">
                              {withdrawal.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Timestamp */}
                    <div>
                      <p className="text-xs text-gray-500">
                        Submitted at{' '}
                        {format(
                          new Date(withdrawal.withdrawal_timestamp),
                          'MMM d, yyyy h:mm a'
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
