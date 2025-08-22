import React, { useState, useEffect } from 'react'
import { ArrowLeft, Users, Plus, Search, Filter, MessageCircle } from 'lucide-react'
import { supabase, Profile, CommunityPost, hasValidSupabaseConfig } from '../lib/supabase'
import { CommunityPostCard } from './CommunityPostCard'
import { CreateCommunityPostPopup } from './CreateCommunityPostPopup'
import { MessagesPopup } from './MessagesPopup'

interface Community {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
  member_count?: number
}

interface FullScreenCommunitiesViewProps {
  currentUser: Profile
  onBack: () => void
}

export function FullScreenCommunitiesView({ currentUser, onBack }: FullScreenCommunitiesViewProps) {
  const [communities, setCommunities] = useState<Community[]>([])
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null)
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [showMessages, setShowMessages] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadCommunities()
  }, [])

  useEffect(() => {
    if (selectedCommunity) {
      loadCommunityPosts(selectedCommunity)
    }
  }, [selectedCommunity])

  // Debug effect to track showMessages changes
  useEffect(() => {
    console.log('🔍 showMessages state changed to:', showMessages)
    if (showMessages) {
      console.log('✅ MessagesPopup should be rendering now')
      console.log('📋 Current user for MessagesPopup:', currentUser)
    }
  }, [showMessages])

  const loadCommunities = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!hasValidSupabaseConfig()) {
        // Demo communities
        const demoCommunities = [
          {
            id: 'gmik',
            name: 'GMIK',
            description: 'GMIK Community - Connect with fellow members',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            member_count: 42
          },
          {
            id: 'programmer',
            name: 'Programmer',
            description: 'No Life Pipol - For developers and tech enthusiasts',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            member_count: 128
          },
          {
            id: 'design',
            name: 'Design Hub',
            description: 'Creative minds unite - Share your designs and get feedback',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            member_count: 67
          },
          {
            id: 'photography',
            name: 'Photography',
            description: 'Capture and share beautiful moments',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            member_count: 89
          }
        ]
        setCommunities(demoCommunities)
        setSelectedCommunity('gmik') // Auto-select first community
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading communities:', error)
        setError(`Failed to load communities: ${error.message}`)
      } else {
        setCommunities(data || [])
        if (data && data.length > 0) {
          setSelectedCommunity(data[0].id)
        }
      }
    } catch (error) {
      console.error('Error in loadCommunities:', error)
      setError(`Failed to load communities: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const loadCommunityPosts = async (communityId: string) => {
    try {
      if (!hasValidSupabaseConfig()) {
        // Demo posts for selected community
        const demoPosts = [
          {
            id: `${communityId}-post-1`,
            community_id: communityId,
            user_id: currentUser.id,
            content: `Welcome to ${communities.find(c => c.id === communityId)?.name || 'this community'}! This is a demo post to show how community posts work. You can share images, files, and have full discussions here.`,
            images: ['https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg?auto=compress&cs=tinysrgb&w=800'],
            files: [],
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            profiles: currentUser,
            likes: [],
            comments: [],
            _count: { likes: 3, comments: 1 }
          },
          {
            id: `${communityId}-post-2`,
            community_id: communityId,
            user_id: 'demo-user-2',
            content: `Great to be part of this community! Looking forward to connecting with everyone here. 🚀`,
            images: [],
            files: [],
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            profiles: {
              id: 'demo-user-2',
              full_name: 'Demo Member',
              display_name: 'demomember',
              email: 'member@example.com',
              avatar_url: null,
              bio: null,
              website: null,
              location: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            likes: [],
            comments: [],
            _count: { likes: 7, comments: 2 }
          },
          {
            id: `${communityId}-post-3`,
            community_id: communityId,
            user_id: 'demo-user-3',
            content: `Check out this amazing project I've been working on! Would love to get your feedback and suggestions. 💡`,
            images: ['https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=800'],
            files: [],
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
            updated_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
            profiles: {
              id: 'demo-user-3',
              full_name: 'Creative User',
              display_name: 'creative',
              email: 'creative@example.com',
              avatar_url: null,
              bio: null,
              website: null,
              location: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            likes: [],
            comments: [],
            _count: { likes: 12, comments: 5 }
          }
        ]
        setPosts(demoPosts)
        return
      }

      const { data: postsData, error: postsError } = await supabase
        .from('community_posts')
        .select(`
          *,
          profiles!community_posts_user_id_fkey(
            id,
            display_name,
            full_name,
            avatar_url
          )
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })

      if (postsError) {
        console.error('Posts error:', postsError)
        return
      }

      // Get additional data for each post
      const postsWithCounts = []
      
      for (const post of postsData || []) {
        // Get likes
        const { data: likes } = await supabase
          .from('community_likes')
          .select('id, user_id')
          .eq('post_id', post.id)

        // Get comments
        const { data: comments } = await supabase
          .from('community_comments')
          .select(`
            id,
            content,
            created_at,
            user_id,
            profiles!community_comments_user_id_fkey(
              id,
              display_name,
              full_name,
              avatar_url
            )
          `)
          .eq('post_id', post.id)
          .order('created_at', { ascending: true })

        postsWithCounts.push({
          ...post,
          likes: likes || [],
          comments: comments || [],
          _count: {
            likes: likes?.length || 0,
            comments: comments?.length || 0,
          },
        })
      }

      setPosts(postsWithCounts)
    } catch (error) {
      console.error('Error loading community posts:', error)
    }
  }

  const handleLike = async (postId: string) => {
    if (!hasValidSupabaseConfig()) {
      // Demo mode - just update local state
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            const isLiked = post.likes?.some(l => l.user_id === currentUser.id)
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
        ?.likes?.find(l => l.user_id === currentUser.id)

      if (existingLike) {
        await supabase
          .from('community_likes')
          .delete()
          .eq('id', existingLike.id)
      } else {
        await supabase
          .from('community_likes')
          .insert([{ user_id: currentUser.id, post_id: postId }])
      }

      if (selectedCommunity) {
        loadCommunityPosts(selectedCommunity)
      }
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
        .from('community_comments')
        .insert([{
          user_id: currentUser.id,
          post_id: postId,
          content,
        }])

      if (selectedCommunity) {
        loadCommunityPosts(selectedCommunity)
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const handlePostCreated = () => {
    setShowCreatePost(false)
    if (selectedCommunity) {
      loadCommunityPosts(selectedCommunity)
    }
  }

  const getCommunityInitial = (name: string) => {
    return name.charAt(0).toUpperCase()
  }

  const getCommunityColor = (name: string) => {
    const colors = [
      'from-blue-500 to-purple-500',
      'from-green-500 to-blue-500',
      'from-purple-500 to-pink-500',
      'from-orange-500 to-red-500',
      'from-teal-500 to-green-500',
    ]
    const index = name.length % colors.length
    return colors[index]
  }

  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedCommunityData = communities.find(c => c.id === selectedCommunity)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-80 bg-white border-r border-gray-200 h-screen">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold text-gray-900">Communities</h1>
              </div>
            </div>
            <div className="p-4">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 rounded-lg">
                    <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
          </div>
        </div>
      </div>
    )
  }

  console.log('🔍 Rendering FullScreenCommunitiesView with showMessages:', showMessages)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Communities Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 h-screen overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold text-gray-900">Communities</h1>
              </div>
              <button
                onClick={() => setShowCreatePost(true)}
                className="p-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="p-4 border-b border-gray-200">
            <div className="space-y-2">
              {/* Debug Info */}
              <div className="text-xs text-gray-500 mb-2">
                showMessages: {showMessages.toString()}
              </div>
              
              {/* Messages Button */}
              <button
                onClick={() => {
                  console.log('🔴 Messages button clicked!')
                  console.log('Before setState - showMessages:', showMessages)
                  setShowMessages(true)
                  console.log('After setState call')
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">Messages</span>
              </button>
            </div>
          </div>

          {/* Communities List */}
          <div className="p-4">
            <div className="space-y-2">
              {filteredCommunities.map((community) => (
                <button
                  key={community.id}
                  onClick={() => setSelectedCommunity(community.id)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-left ${
                    selectedCommunity === community.id
                      ? 'bg-purple-100 text-purple-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${getCommunityColor(community.name)} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}>
                    {getCommunityInitial(community.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{community.name}</h3>
                    <p className="text-sm text-gray-600 truncate">{community.description}</p>
                    {community.member_count && (
                      <p className="text-xs text-gray-500">{community.member_count} members</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {selectedCommunityData ? (
            <div className="max-w-2xl mx-auto p-6">
              {/* Community Header */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center space-x-4">
                  <div className={`w-16 h-16 bg-gradient-to-br ${getCommunityColor(selectedCommunityData.name)} rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                    {getCommunityInitial(selectedCommunityData.name)}
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">{selectedCommunityData.name}</h1>
                    <p className="text-gray-600 mt-1">{selectedCommunityData.description}</p>
                    {selectedCommunityData.member_count && (
                      <p className="text-sm text-gray-500 mt-2">{selectedCommunityData.member_count} members</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowCreatePost(true)}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                    >
                      Create Post
                    </button>
                  </div>
                </div>
              </div>

              {/* Posts */}
              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                  <p className="text-gray-600 mb-4">
                    Be the first to share something in {selectedCommunityData.name}!
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
                    <CommunityPostCard
                      key={post.id}
                      post={post}
                      currentUser={currentUser}
                      onLike={handleLike}
                      onComment={handleComment}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Community</h3>
                <p className="text-gray-600">Choose a community from the sidebar to view posts</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Post Popup */}
      {showCreatePost && selectedCommunityData && (
        <CreateCommunityPostPopup
          communityId={selectedCommunityData.id}
          communityName={selectedCommunityData.name}
          onClose={() => setShowCreatePost(false)}
          onPostCreated={handlePostCreated}
        />
      )}

      {/* Messages Popup - Enhanced Debug Version */}
      {console.log('🔍 About to render MessagesPopup. showMessages:', showMessages, 'currentUser:', currentUser)}
      {showMessages ? (
        <div>
          {console.log('✅ MessagesPopup conditional block entered')}
          <MessagesPopup
            currentUser={currentUser}
            onClose={() => {
              console.log('🔴 MessagesPopup onClose called')
              setShowMessages(false)
            }}
          />
        </div>
      ) : (
        console.log('❌ MessagesPopup conditional block NOT entered')
      )}
    </div>
  )
}
