import React, { useState } from 'react'
import { X, Users, Globe, Lock } from 'lucide-react'
import { supabase, Profile, hasValidSupabaseConfig } from '../lib/supabase'

interface CreateCommunityModalProps {
  onClose: () => void
  currentUser: Profile
}

export function CreateCommunityModal({ onClose, currentUser }: CreateCommunityModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    try {
      if (!hasValidSupabaseConfig()) {
        // Demo mode - just close the modal
        console.log('CreateCommunityModal: Demo mode - community would be created:', {
          name: name.trim(),
          description: description.trim(),
          isPrivate,
          createdBy: currentUser.id
        })
        onClose()
        return
      }

      const { data, error: createError } = await supabase
        .from('communities')
        .insert([
          {
            name: name.trim(),
            description: description.trim() || null,
            is_private: isPrivate,
            created_by: currentUser.id,
          },
        ])
        .select()
        .single()

      if (createError) {
        console.error('CreateCommunityModal: Error creating community:', createError)
        setError('Failed to create community. Please try again.')
        return
      }

      console.log('CreateCommunityModal: Community created successfully:', data)
      onClose()
    } catch (err) {
      console.error('CreateCommunityModal: Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create Community</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Community Name *
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter community name"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
                maxLength={100}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{name.length}/100 characters</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your community..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/500 characters</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Privacy Settings
            </label>
            <div className="space-y-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="privacy"
                  checked={!isPrivate}
                  onChange={() => setIsPrivate(false)}
                  className="sr-only"
                />
                <div className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors ${
                  !isPrivate ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <Globe className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Public</p>
                    <p className="text-sm text-gray-600">Anyone can join and see posts</p>
                  </div>
                </div>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="privacy"
                  checked={isPrivate}
                  onChange={() => setIsPrivate(true)}
                  className="sr-only"
                />
                <div className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors ${
                  isPrivate ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <Lock className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Private</p>
                    <p className="text-sm text-gray-600">Only invited members can join</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>{loading ? 'Creating...' : 'Create Community'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
