import React, { useState } from 'react'
import { Trash2, Edit3, Save, X, Plus } from 'lucide-react'
import { Recipient } from '@bulk-email/shared'

interface RecipientTableProps {
  recipients: Recipient[]
  onUpdate: (recipients: Recipient[]) => void
}

export function RecipientTable({ recipients, onUpdate }: RecipientTableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Recipient>({ email: '' })

  const handleEdit = (index: number) => {
    setEditingIndex(index)
    setEditForm({ ...recipients[index] })
  }

  const handleSave = () => {
    if (editingIndex === null) return

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(editForm.email)) {
      alert('Please enter a valid email address')
      return
    }

    const updated = [...recipients]
    updated[editingIndex] = editForm
    onUpdate(updated)
    setEditingIndex(null)
  }

  const handleCancel = () => {
    setEditingIndex(null)
    setEditForm({ email: '' })
  }

  const handleDelete = (index: number) => {
    const updated = recipients.filter((_, i) => i !== index)
    onUpdate(updated)
  }

  const handleAddNew = () => {
    const newRecipient: Recipient = { email: '' }
    onUpdate([...recipients, newRecipient])
    setEditingIndex(recipients.length)
    setEditForm(newRecipient)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Recipients ({recipients.length})
        </h3>
        <button
          onClick={handleAddNew}
          className="btn-outline text-sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Recipient
        </button>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variables
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recipients.map((recipient, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingIndex === index ? (
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="input w-full"
                        placeholder="email@example.com"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">{recipient.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingIndex === index ? (
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="input w-full"
                        placeholder="Full Name"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">{recipient.name || '-'}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {recipient.variables && Object.keys(recipient.variables).length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(recipient.variables).map(([key, value]) => (
                          <span
                            key={key}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                          >
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingIndex === index ? (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={handleSave}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(index)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {recipients.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No recipients added yet. Use the form above to add email addresses.
        </div>
      )}
    </div>
  )
}
