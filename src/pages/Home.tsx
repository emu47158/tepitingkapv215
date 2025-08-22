import React, { useState, useEffect } from 'react'
import { supabase, Profile } from '../lib/supabase'
import { PostForm } from '../components/PostForm'
import { PostFeed } from '../components/PostFeed'
import { CreatePostPopup } from '../components/CreatePostPopup'
import { Plus, Globe, UserX, Users } from 'lucide-react'

export function Home() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'public' | 'anonymous' | string>('public')
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    getCurrentUser()
  }, [])

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setCurrentUser(profile)
      }
    } catch (error) {
      console.error('Error getting current user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePostCreated = () => {
    setRefreshTrigger(prev => prev + 1)
    setShowCreatePost(false)
  }

  const getSectionIcon = (section: string) => {
    if (section === 'public') return Globe
    if (section === 'anonymous') return UserX
    return Users
  }

  const getSectionName = (section: string) => {
    if (section === 'public') return 'Public'
    if (section === 'anonymous') return 'Anonymous'
    return 'Community'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to view posts</p>
        </div>
      </div>
    )
  }

  const SectionIcon = getSectionIcon(activeSection)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-white/20">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <SectionIcon className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">
                {getSectionName(activeSection)}
              </h1>
            </div>
            {/* Only show create button for public section */}
            {activeSection === 'public' && (
              <button
                onClick={() => setShowCreatePost(true)}
                className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full hover:from-blue-600 hover:to-purple-600 transition-all duration-200 hover:scale-105 shadow-lg"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pb-20">
        {/* Post Creation Section - Only show for public */}
        {activeSection === 'public' && (
          <div className="max-w-lg mx-auto px-4 py-6">
            <PostForm 
              onPostCreated={handlePostCreated} 
              communityId={null}
            />
          </div>
        )}

        {/* Post Feed */}
        <PostFeed 
          key={`${activeSection}-${refreshTrigger}`}
          currentUser={currentUser} 
          section={activeSection}
        />
      </div>

      {/* Create Post Popup - Only for public section */}
      {showCreatePost && activeSection === 'public' && (
        <CreatePostPopup
          section={activeSection}
          onPostCreated={handlePostCreated}
          onClose={() => setShowCreatePost(false)}
        />
      )}

      {/* Section Tabs */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-white/20">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveSection('public')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-all duration-200 ${
                activeSection === 'public'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Globe className="w-5 h-5" />
              <span className="font-medium">Public</span>
            </button>
            <button
              onClick={() => setActiveSection('anonymous')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-all duration-200 ${
                activeSection === 'anonymous'
                  ? 'bg-gray-500 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <UserX className="w-5 h-5" />
              <span className="font-medium">Anonymous</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
