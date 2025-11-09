/**
 * Invite User Modal Component
 *
 * Modal for inviting new users to the system.
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { inviteUser } from '@/app/actions/users'
import { toast } from 'react-hot-toast'

interface InviteUserModalProps {
  isOpen: boolean
  onClose: () => void
}

export function InviteUserModal({ isOpen, onClose }: InviteUserModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'data_entry'>('data_entry')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('role', role)

      const result = await inviteUser(formData)

      if (result.success) {
        toast.success(result.message || 'User invited successfully!')
        setEmail('')
        setRole('data_entry')
        onClose()
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to invite user')
      }
    } catch (error) {
      console.error('Invite error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Invite New User</h2>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="role">Role *</Label>
              <Select
                id="role"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as 'admin' | 'data_entry')
                }
                required
              >
                <option value="data_entry">Data Entry</option>
                <option value="admin">Admin</option>
              </Select>
              <p className="mt-1 text-sm text-gray-500">
                Data Entry users can submit collections. Admins have full access.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </form>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              The user will receive instructions to sign up using magic link
              authentication.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
