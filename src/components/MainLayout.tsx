import React, { useState, useEffect } from 'react'
import { TopNavigation } from './TopNavigation'
import { PostCard } from './PostCard'
import { CreatePostPopup } from './CreatePostPopup'
import { CreateCommunityPostPopup } from './CreateCommunityPostPopup'
import { MarketplacePopup } from './MarketplacePopup'
import { MessagesPopup } from './MessagesPopup'
import { ProfileView } from './ProfileView'
import { FullScreenCommunitiesView } from './FullScreenCommunitiesView'
import { supabase, Post, Profile, hasValidSupabaseConfig } from '../lib/supabase'
import { Home, PlusSquare, Users, MessageCircle, User, Package } from 'lucide-react'

interface MainLayoutProps {
  profile: Profile
  onLogout: () => void
}

export function MainLayout({ profile, onLogout }: MainLayoutProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [showCreateCommunity, setShowCreateCommunity] = useState(false)
  const [showMarketplace, setShowMarketplace] = useState(false)
  const [showMessages, setShowMessages] = useState(false)
  const [currentView, setCurrentView] = useState<'home' | 'profile' | 'communities' | 'community' | 'fullscreen-communities'>('home')
  const [currentSection, setCurrentSection] = useState<'public' | 'anonymous' | string>('public')

  // Enhanced debugging for Messages button
  useEffect(() => {
    console.log('🔍 MAIN LAYOUT STATE CHANGE:', {
      showMessages,
      currentView,
      currentSection,
      timestamp: new Date().toISOString()
    })
  }, [showMessages, currentView, currentSection])

  useEffect(() => {
    loadPosts()
  }, [currentSection])

  const loadPosts = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!hasValidSupabaseConfig()) {
        // Demo posts when Supabase is not configured
        const demoPosts = [
          {
            id: '1',
            user_id: profile.id,
            content: 'Welcome to TepiTingkap! This is a demo post to show how the platform works. You can share your thoughts, images, and connect with others in the community.',
            images: ['https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg?auto=compress&cs=tinysrgb&w=800'],
            is_anonymous: currentSection === 'anonymous',
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            profiles: profile,
            likes: [],
            comments: [],
            _count: { likes: 5, comments: 2 }
          },
          {
            id: '2',
            user_id: 'demo-user-2',
            content: 'Beautiful sunset today! 🌅 Sometimes we need to pause and appreciate the simple moments in life.',
            images: ['https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=800'],
            is_anonymous: currentSection === 'anonymous',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            profiles: {
              id: 'demo-user-2',
              full_name: currentSection === 'anonymous' ? null : 'Nature Lover',
              display_name: currentSection === 'anonymous' ? null : 'naturelover',
              email: 'nature@example.com',
              avatar_url: null,
              bio: null,
              website: null,
              location: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            likes: [],
            comments: [],
            _count: { likes: 12, comments: 4 }
          },
          {
            id: '3',
            user_id: 'demo-user-3',
            content: currentSection === 'anonymous' 
              ? 'Sharing this anonymously - sometimes it\'s easier to express thoughts without revealing identity. What do you think about anonymous social sharing?'
              : 'Just finished reading an amazing book! 📚 "The Power of Now" really changed my perspective on mindfulness and living in the present moment.',
            images: currentSection === 'anonymous' ? [] : ['https://images.pexels.com/photos/1261728/pexels-photo-1261728.jpeg?auto=compress&cs=tinysrgb&w=800'],
            is_anonymous: currentSection === 'anonymous',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
            updated_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
            profiles: {
              id: 'demo-user-3',
              full_name: currentSection === 'anonymous' ? null : 'Book Reader',
              display_name: currentSection === 'anonymous' ? null : 'booklover',
              email: 'books@example.com',
              avatar_url: null,
              bio: null,
              website: null,
              location: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            likes: [],
            comments: [],
            _count: { likes: 8, comments: 6 }
          }
        ]
        setPosts(demoPosts)
        setLoading(false)
        return
      }

      // Updated query with proper relationship handling
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          content,
          images,
          is_anonymous,
          created_at,
          updated_at,
          profiles!posts_user_id_fkey (
            id,
            display_name,
            full_name,
            avatar_url
          )
        `)
        .eq('is_anonymous', currentSection === 'anonymous')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading posts:', error)
        setError(`Failed to load posts: ${error.message}`)
        setLoading(false)
        return
      }

      // Get likes and comments separately to avoid relationship issues
      const postIds = data?.map(post => post.id) || []
      
      let likesData = []
      let commentsData = []
      
      if (postIds.length > 0) {
        const { data: likes } = await supabase
          .from('post_likes')
          .select('id, user_id, post_id')
          .in('post_id', postIds)

        const { data: comments } = await supabase
          .from('post_comments')
          .select(`
            id,
            content,
            created_at,
            user_id,
            post_id,
            profiles!post_comments_user_id_fkey(id, display_name, full_name, avatar_url)
          `)
          .in('post_id', postIds)

        likesData = likes || []
        commentsData = comments || []
      }

      // Combine data manually
      const postsWithCounts = (data || []).map(post => {
        const postLikes = likesData.filter(like => like.post_id === post.id)
        const postComments = commentsData.filter(comment => comment.post_id === post.id)
        
        return {
          ...post,
          likes: postLikes,
          comments: postComments,
          _count: {
            likes: postLikes.length,
            comments: postComments.length,
          },
        }
      })

      setPosts(postsWithCounts)
    } catch (error) {
      console.error('Error in loadPosts:', error)
      setError(`Failed to load posts: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (postId: string) => {
    if (!hasValidSupabaseConfig()) {
      // Demo mode - just update local state
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            const isLiked = post.likes?.some(l => l.user_id === profile.id)
            const newLikesCount = isLiked 
              ? (post._count?.likes || 0) - 1 
              : (post._count?.likes || 0) + 1
            
            return {
              ...post,
              _count: {
                ...post._count,
                likes: newLikesCount
              }
            }
          }
          return post
        })
      )
      return
    }

    try {
      const existingLike = posts
        .find(p => p.id === postId)
        ?.likes?.find(l => l.user_id === profile.id)

      if (existingLike) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('id', existingLike.id)
      } else {
        await supabase
          .from('post_likes')
          .insert([{ user_id: profile.id, post_id: postId }])
      }

      loadPosts()
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleComment = async (postId: string, content: string) => {
    if (!hasValidSupabaseConfig()) {
      alert('Comment added! (Demo mode)')
      return
    }

    try {
      await supabase
        .from('post_comments')
        .insert([{
          user_id: profile.id,
          post_id: postId,
          content,
        }])

      loadPosts()
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const handlePostCreated = () => {
    setShowCreatePost(false)
    loadPosts()
  }

  const handleCommunityPostCreated = () => {
    setShowCreateCommunity(false)
  }

  const handleShowMessages = () => {
    console.log('🔍 MAIN LAYOUT: handleShowMessages called')
    setShowMessages(true)
  }

  // CRITICAL: Enhanced Messages button handler with comprehensive debugging
  const handleMessagesButtonClick = (source: string) => {
    console.log('🔍 MESSAGES BUTTON CLICKED:', {
      source,
      currentShowMessages: showMessages,
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack
    })
    
    // Force state update with callback to verify
    setShowMessages(prev => {
      console.log('🔍 MESSAGES STATE UPDATE:', {
        previousState: prev,
        newState: true,
        source
      })
      return true
    })
    
    // Additional verification after state update
    setTimeout(() => {
      console.log('🔍 MESSAGES STATE VERIFICATION:', {
        showMessages,
        source,
        timestamp: new Date().toISOString()
      })
    }, 100)
  }

  if (currentView === 'profile') {
    return (
      <div className="fixed inset-0 w-full h-full bg-gray-50 overflow-auto">
        <TopNavigation
          profile={profile}
          onLogout={onLogout}
          onShowCreatePost={() => setShowCreatePost(true)}
          onShowCreateCommunity={() => setShowCreateCommunity(true)}
          onShowSijangKu={() => setShowMarketplace(true)}
          onShowMessages={handleShowMessages}
          onShowMarketplace={() => setShowMarketplace(true)}
          onShowCommunities={() => setCurrentView('fullscreen-communities')}
          currentView={currentView}
          onViewChange={setCurrentView}
          currentSection={currentSection}
          onSectionChange={setCurrentSection}
        />
        <div className="pt-16">
          <ProfileView 
            profile={profile} 
            onBack={() => setCurrentView('home')}
          />
        </div>
        
        {showMessages && (
          <MessagesPopup
            currentUser={profile}
            onClose={() => setShowMessages(false)}
          />
        )}
      </div>
    )
  }

  if (currentView === 'fullscreen-communities') {
    return (
      <div className="fixed inset-0 w-full h-full bg-gray-50 overflow-auto">
        <TopNavigation
          profile={profile}
          onLogout={onLogout}
          onShowCreatePost={() => setShowCreatePost(true)}
          onShowCreateCommunity={() => setShowCreateCommunity(true)}
          onShowSijangKu={() => setShowMarketplace(true)}
          onShowMessages={handleShowMessages}
          onShowMarketplace={() => setShowMarketplace(true)}
          onShowCommunities={() => setCurrentView('fullscreen-communities')}
          currentView={currentView}
          onViewChange={setCurrentView}
          currentSection={currentSection}
          onSectionChange={setCurrentSection}
        />
        <div className="pt-16">
          <FullScreenCommunitiesView 
            currentUser={profile}
            onBack={() => setCurrentView('home')}
          />
        </div>
        
        {showMessages && (
          <MessagesPopup
            currentUser={profile}
            onClose={() => setShowMessages(false)}
          />
        )}
      </div>
    )
  }

  console.log('🔍 MAIN LAYOUT RENDERING with showMessages:', showMessages)

  return (
    <div className="fixed inset-0 w-full h-full bg-gray-50 overflow-auto">
      <TopNavigation
        profile={profile}
        onLogout={onLogout}
        onShowCreatePost={() => setShowCreatePost(true)}
        onShowCreateCommunity={() => setShowCreateCommunity(true)}
        onShowSijangKu={() => setShowMarketplace(true)}
        onShowMessages={handleShowMessages}
        onShowMarketplace={() => setShowMarketplace(true)}
        onShowCommunities={() => setCurrentView('fullscreen-communities')}
        currentView={currentView}
        onViewChange={setCurrentView}
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
      />

      <div className="pt-16 lg:pt-32 w-full">
        {/* Mobile Layout - Full Width Centered */}
        <div className="lg:hidden w-full">
          <div className="w-full max-w-2xl mx-auto px-4">
            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-pulse">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-24"></div>
                        <div className="h-3 bg-gray-300 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-300 rounded"></div>
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                <div className="text-red-500 mb-4">{error}</div>
                <button
                  onClick={loadPosts}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-600 mb-4">
                  Be the first to share something in the {currentSection} section!
                </p>
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Create Post
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUser={profile}
                    onLike={handleLike}
                    onComment={handleComment}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Layout - Three Column with Proper Centering */}
        <div className="hidden lg:block w-full">
          <div className="w-full max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Left Sidebar - Fixed Width */}
              <div className="col-span-3">
                <div className="sticky top-32 space-y-2">
                  <button
                    onClick={() => setCurrentView('home')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                      currentView === 'home'
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Home className="w-5 h-5" />
                    <span className="font-medium">Home</span>
                  </button>

                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <PlusSquare className="w-5 h-5" />
                    <span className="font-medium">Create</span>
                  </button>

                  <button
                    onClick={() => setCurrentView('fullscreen-communities')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                      currentView === 'fullscreen-communities'
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Users className="w-5 h-5" />
                    <span className="font-medium">Communities</span>
                  </button>

                  <button
                    onClick={() => handleMessagesButtonClick('main-navigation')}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-medium">Messages</span>
                  </button>

                  <button
                    onClick={() => setCurrentView('profile')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                      currentView === 'profile'
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">Profile</span>
                  </button>

                  <button
                    onClick={() => setShowCreateCommunity(true)}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <PlusSquare className="w-5 h-5" />
                    <span className="font-medium">Create Community</span>
                  </button>

                  <button
                    onClick={() => setShowMarketplace(true)}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <Package className="w-5 h-5" />
                    <span className="font-medium">SijangKu</span>
                  </button>
                </div>
              </div>

              {/* Main Content - Centered */}
              <div className="col-span-6">
                <div className="w-full max-w-2xl mx-auto">
                  {loading ? (
                    <div className="space-y-6">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-pulse">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-300 rounded w-24"></div>
                              <div className="h-3 bg-gray-300 rounded w-16"></div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-300 rounded"></div>
                            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : error ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                      <div className="text-red-500 mb-4">{error}</div>
                      <button
                        onClick={loadPosts}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                      <p className="text-gray-600 mb-4">
                        Be the first to share something in the {currentSection} section!
                      </p>
                      <button
                        onClick={() => setShowCreatePost(true)}
                        className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        Create Post
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {posts.map((post) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          currentUser={profile}
                          onLike={handleLike}
                          onComment={handleComment}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Sidebar - Fixed Width */}
              <div className="col-span-3">
                <div className="sticky top-32">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Trending Topics</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">#TepiTingkap</span>
                        <span className="text-xs text-gray-500">1.2k posts</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">#Community</span>
                        <span className="text-xs text-gray-500">856 posts</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">#SijangKu</span>
                        <span className="text-xs text-gray-500">642 posts</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">#Anonymous</span>
                        <span className="text-xs text-gray-500">423 posts</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popups */}
      {showCreatePost && (
        <CreatePostPopup
          onClose={() => setShowCreatePost(false)}
          onPostCreated={handlePostCreated}
          isAnonymous={currentSection === 'anonymous'}
        />
      )}

      {showCreateCommunity && (
        <CreateCommunityPostPopup
          onClose={() => setShowCreateCommunity(false)}
          onPostCreated={handleCommunityPostCreated}
        />
      )}

      {showMarketplace && (
        <MarketplacePopup
          currentUser={profile}
          onClose={() => setShowMarketplace(false)}
        />
      )}

      {/* CRITICAL: Enhanced MessagesPopup Rendering with Debug Info */}
      {console.log('🔍 ABOUT TO RENDER MESSAGES POPUP - showMessages:', showMessages)}
      {showMessages && (
        <>
          {console.log('🔍 RENDERING MESSAGES POPUP COMPONENT')}
          <MessagesPopup
            currentUser={profile}
            onClose={() => {
              console.log('🔍 MESSAGES POPUP CLOSE CALLED')
              setShowMessages(false)
            }}
          />
        </>
      )}
    </div>
  )
}
