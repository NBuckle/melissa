/**
 * Users Management Page (Admin Only)
 *
 * Manage user accounts and roles.
 * (Placeholder - will be implemented in Phase 4)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function UsersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
        <p className="text-gray-600 mt-2">
          Manage user accounts and permissions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon - Phase 4</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            User management will be implemented in Phase 4. Features include:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
            <li>View all users</li>
            <li>Change user roles (Admin/Data Entry)</li>
            <li>Invite new users</li>
            <li>Deactivate user accounts</li>
            <li>View user activity</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
