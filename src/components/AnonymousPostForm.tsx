import React, { useState } from 'react'
import { Send } from 'lucide-react'
import { supabase, hasValidSupabaseConfig } from '../lib/supabase'

interface AnonymousPostFormProps {
  onPostCreated: () => void
}

export function AnonymousPostForm({ onPostCreated }: AnonymousPostFormProps) {
  const [content, setContent] = useState('')
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
        alert('Anonymous post created! (Demo mode)')
        setContent('')
        onPostCreated()
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      console.log('Creating anonymous post...')

      // Create anonymous post in posts table with visibility 'anonymous'
      const { error: insertError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim(),
          images: null, // No images for anonymous posts
          files: null,  // No files for anonymous posts
          visibility: 'anonymous',
          community_id: null
        })

      if (insertError) {
        console.error('Anonymous post creation error:', insertError)
        throw insertError
      }

      console.log('✓ Anonymous post created successfully')
      setContent('')
      onPostCreated()
    } catch (error: any) {
      console.error('Error creating anonymous post:', error)
      setError(error.message || 'Failed to create anonymous post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts anonymously... (text only)"
            className="w-full p-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-transparent placeholder-gray-500 text-gray-800 resize-none"
            rows={4}
            maxLength={500}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-500">
              Anonymous • Text only • No images/files
            </span>
            <span className="text-sm text-gray-500">
              {content.length}/500
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-700 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="px-6 py-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                Posting...
              </div>
            ) : (
              <div className="flex items-center">
                <Send className="w-4 h-4 mr-2" />
                Post Anonymously
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
