import React, { useState } from 'react'
import { X, Image, FileText, AlertCircle, Send } from 'lucide-react'
import { supabase, Profile, hasValidSupabaseConfig } from '../lib/supabase'

interface CreatePostModalProps {
  onClose: () => void
  currentUser: Profile
  isAnonymous?: boolean
}

export function CreatePostModal({ onClose, currentUser, isAnonymous = false }: CreatePostModalProps) {
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    setError(null)
    
    try {
      if (!hasValidSupabaseConfig()) {
        // Demo mode - just show success message
        console.log('CreatePostModal: Demo mode - post would be created:', {
          content: content.trim(),
          imageUrl: imageUrl.trim(),
          isAnonymous,
          userId: currentUser.id
        })
        onClose()
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create post data
      const postData = {
        user_id: user.id,
        content: content.trim(),
        images: imageUrl.trim() ? [imageUrl.trim()] : [],
        visibility: isAnonymous ? 'anonymous' : 'public',
      }

      const { error: postsError } = await supabase
        .from('posts')
        .insert([postData])

      if (postsError) {
        console.error('CreatePostModal: Error creating post:', postsError)
        setError('Failed to create post. Please try again.')
        return
      }

      console.log('CreatePostModal: Post created successfully')
      onClose()
    } catch (err) {
      console.error('CreatePostModal: Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create Post</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {!hasValidSupabaseConfig() && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Demo Mode</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Posts won't be saved. Connect to Supabase to enable full functionality.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What's on your mind?
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={4}
              required
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{content.length}/500 characters</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL (optional)
            </label>
            <div className="relative">
              <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <FileText className="w-4 h-4" />
              <span>Posting as {isAnonymous ? 'Anonymous' : currentUser.display_name || 'User'}</span>
            </div>
            
            <div className="flex items-center space-x-3">
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
                disabled={loading || !content.trim()}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                <Send className="w-4 h-4" />
                <span>{loading ? 'Posting...' : 'Post'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
