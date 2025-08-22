import React, { useState } from 'react'
import { supabase, hasValidSupabaseConfig } from '../lib/supabase'
import { X, Image, FileText, AlertCircle } from 'lucide-react'

interface CreatePostPopupProps {
  onClose: () => void
  onPostCreated: () => void
  currentSection: string
}

export function CreatePostPopup({ onClose, onPostCreated, currentSection }: CreatePostPopupProps) {
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    
    try {
      if (!hasValidSupabaseConfig()) {
        // Demo mode - just show success message
        alert('Post created successfully! (Demo mode - connect to Supabase to save posts)')
        onPostCreated()
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Try to insert into posts table first (social media posts)
      const postData = {
        user_id: user.id,
        content: content.trim(),
        images: imageUrl.trim() ? [imageUrl.trim()] : [],
        files: [],
        visibility: currentSection,
      }

      const { error: postsError } = await supabase
        .from('posts')
        .insert([postData])

      if (postsError) {
        console.log('Posts table insert failed, trying community_posts:', postsError)
        
        // If posts table fails, try community_posts table
        const communityPostData = {
          user_id: user.id,
          content: content.trim(),
          images: imageUrl.trim() ? [imageUrl.trim()] : [],
          files: [],
          community_id: '13e74a09-bec0-4504-b7a0-bc23a3e1e8c8', // Default community ID from your data
        }

        const { error: communityError } = await supabase
          .from('community_posts')
          .insert([communityPostData])

        if (communityError) throw communityError
      }

      onPostCreated()
    } catch (error) {
      console.error('Error creating post:', error)
      alert(`Failed to create post: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
            />
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
              <span>Posting to {currentSection}</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
