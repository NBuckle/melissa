/**
 * Withdrawals Management Page
 *
 * Admin-only page for creating and viewing withdrawals/distributions.
 * Now includes toggle between List View and CBAJ Table View
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WithdrawalForm } from '@/components/features/withdrawals/withdrawal-form'
import { WithdrawalsList } from '@/components/features/withdrawals/withdrawals-list'
import {
  getDistributionTypes,
  getKitTemplates,
  getRecentWithdrawals,
} from '@/app/actions/withdrawals'
import { getActiveItems } from '@/app/actions/items'
import { getCBAJDeliveries } from '@/app/actions/inventory'
import { format } from 'date-fns'

type ViewMode = 'list' | 'table'

export default function WithdrawalsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [distributionTypes, setDistributionTypes] = useState<any[]>([])
  const [kitTemplates, setKitTemplates] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [selectedParish, setSelectedParish] = useState<string>('St Elizabeth')
  const [expandedSites, setExpandedSites] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [typesRes, templatesRes, itemsRes, withdrawalsRes, deliveriesRes] = await Promise.all([
      getDistributionTypes(),
      getKitTemplates(),
      getActiveItems(),
      getRecentWithdrawals(20),
      getCBAJDeliveries()
    ])

    setDistributionTypes(typesRes.types || [])
    setKitTemplates(templatesRes.templates || [])
    setItems(itemsRes.items || [])
    setWithdrawals(withdrawalsRes.withdrawals || [])
    setDeliveries(deliveriesRes.deliveries || [])
    setLoading(false)
  }

  // Group deliveries by parish
  const deliveriesByParish = deliveries.reduce((acc: any, delivery: any) => {
    const parish = delivery.parish || 'Unknown'
    if (!acc[parish]) {
      acc[parish] = []
    }
    acc[parish].push(delivery)
    return acc
  }, {})

  const availableParishes = Object.keys(deliveriesByParish).sort()

  // Get deliveries for selected parish
  const parishDeliveries = deliveriesByParish[selectedParish] || []

  // Group by site/church within parish
  const deliveriesBySite = parishDeliveries.reduce((acc: any, d: any) => {
    const site = d.church_name
    if (!acc[site]) {
      acc[site] = { items: [], dates: new Set() }
    }
    acc[site].items.push(d)
    acc[site].dates.add(d.delivery_date)
    return acc
  }, {})

  const toggleSite = (site: string) => {
    const newExpanded = new Set(expandedSites)
    if (newExpanded.has(site)) {
      newExpanded.delete(site)
    } else {
      newExpanded.add(site)
    }
    setExpandedSites(newExpanded)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Withdrawals & Distributions
          </h1>
          <p className="text-gray-600 mt-2">
            Record distributions, kit creation, and inventory withdrawals
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-blue-700 hover:bg-blue-800 text-white' : ''}
          >
            List View
          </Button>
          <Button
            variant={viewMode === 'table' ? 'primary' : 'outline'}
            onClick={() => setViewMode('table')}
            className={viewMode === 'table' ? 'bg-blue-700 hover:bg-blue-800 text-white' : ''}
          >
            Table View
          </Button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <>
          {/* Create New Withdrawal Form */}
          <WithdrawalForm
            distributionTypes={distributionTypes}
            kitTemplates={kitTemplates}
            items={items}
          />

          {/* Recent Withdrawals List */}
          <WithdrawalsList withdrawals={withdrawals} />
        </>
      ) : (
        <>
          {/* CBAJ Deliveries Table View */}
          <Card>
            <CardHeader>
              <CardTitle>CBAJ Church Deliveries by Parish</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Parish Tabs */}
              <div className="flex gap-2 mb-6 flex-wrap">
                {availableParishes.map((parish) => (
                  <Button
                    key={parish}
                    variant={selectedParish === parish ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedParish(parish)}
                    className={selectedParish === parish ? 'bg-blue-700 hover:bg-blue-800 text-white font-semibold' : ''}
                  >
                    {parish}
                  </Button>
                ))}
              </div>

              {parishDeliveries.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No deliveries recorded for this parish
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Parish Summary */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{selectedParish}</h3>
                    <p className="text-sm text-gray-600">
                      {Object.keys(deliveriesBySite).length} sites • Click site name to view details
                    </p>
                  </div>

                  {/* Sites List */}
                  {Object.keys(deliveriesBySite).sort().map((site) => {
                    const siteData = deliveriesBySite[site]
                    const isExpanded = expandedSites.has(site)
                    const dates = Array.from(siteData.dates as Set<string>).sort()

                    return (
                      <Card key={site} className="border-l-4 border-l-blue-500">
                        <CardHeader
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => toggleSite(site)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900">{site}</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {siteData.items.length} items • Delivered: {dates.map(d => format(new Date(d), 'MMM d')).join(', ')}
                              </p>
                            </div>
                            <span className="text-gray-500">
                              {isExpanded ? '▲' : '▼'}
                            </span>
                          </div>
                        </CardHeader>
                        {isExpanded && (
                          <CardContent>
                            <table className="min-w-full">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Item
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Date
                                  </th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                    Quantity
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {siteData.items.map((item: any, idx: number) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                      {item.item_type}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                      {format(new Date(item.delivery_date), 'MMM d, yyyy')}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                                      {item.quantity}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </CardContent>
                        )}
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Help Text */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-900">
                <strong>Table View:</strong> Shows CBAJ deliveries to churches organized by date.
                This is a read-only view for reference. To record new withdrawals, switch to List View.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
