import React, { useState } from 'react'
import { Plus, X, Send, Image, Globe, UserX } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface FloatingPostBubbleProps {
  onPostCreated: () => void
  section: 'public' | 'anonymous'
}

export function FloatingPostBubble({ onPostCreated, section }: FloatingPostBubbleProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      console.log('Creating post for user:', user.id, 'Section:', section)

      if (section === 'anonymous') {
        // Create anonymous post
        const { data: insertData, error: insertError } = await supabase
          .from('anonymous_posts')
          .insert({
            content: content.trim()
          })
          .select()

        console.log('Anonymous post insert result:', insertData, 'Error:', insertError)

        if (insertError) throw insertError
      } else {
        // Create public post - check if user profile exists
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, display_name, full_name')
          .eq('id', user.id)
          .single()

        console.log('User profile:', profile, 'Error:', profileError)

        if (profileError || !profile) {
          console.warn('Profile not found for user:', user.id, profileError)
          throw new Error('Profile not found. Please complete your profile first.')
        }

        const { data: insertData, error: insertError } = await supabase
          .from('posts')
          .insert({
            user_id: user.id,
            content: content.trim()
          })
          .select()

        console.log('Public post insert result:', insertData, 'Error:', insertError)

        if (insertError) throw insertError
      }

      setContent('')
      setIsOpen(false)
      console.log('Post created successfully, triggering refresh')
      onPostCreated()
    } catch (error: any) {
      console.error('Error creating post:', error)
      setError(error.message || 'Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setContent('')
    setError(null)
  }

  const isAnonymous = section === 'anonymous'
  const SectionIcon = isAnonymous ? UserX : Globe

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={handleClose}
        />
      )}

      {/* Floating Bubble */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Popup Form */}
        {isOpen && (
          <div className="absolute bottom-20 right-0 w-96 max-w-[calc(100vw-3rem)] transform transition-all duration-300 ease-out animate-in slide-in-from-bottom-4 fade-in">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <SectionIcon className="w-5 h-5 text-gray-700" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Create {isAnonymous ? 'Anonymous' : 'Public'} Post
                  </h3>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Anonymous Notice */}
              {isAnonymous && (
                <div className="mb-4 p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <UserX className="w-4 h-4 inline mr-1" />
                    Your name will not be visible on this post
                  </p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={isAnonymous ? "Share your thoughts anonymously..." : "What's on your mind?"}
                    className="w-full p-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder-gray-500 text-gray-800 resize-none"
                    rows={4}
                    maxLength={500}
                    autoFocus
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-500">
                      {content.length}/500
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {!isAnonymous && (
                      <button
                        type="button"
                        className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="Add Image (Coming Soon)"
                      >
                        <Image className="w-5 h-5" />
                      </button>
                    )}
                    {isAnonymous && (
                      <span className="text-xs text-gray-500">Text only</span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !content.trim()}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        Posting...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Send className="w-4 h-4 mr-2" />
                        Post {isAnonymous ? 'Anonymously' : ''}
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Floating Action Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full shadow-2xl hover:shadow-3xl transform transition-all duration-300 flex items-center justify-center group ${
            isOpen ? 'rotate-45 scale-110' : 'hover:scale-110'
          }`}
        >
          <Plus className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-45' : 'group-hover:rotate-90'}`} />
        </button>
      </div>
    </>
  )
}
