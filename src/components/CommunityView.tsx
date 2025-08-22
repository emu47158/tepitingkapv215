import React, { useState, useEffect } from 'react'
import { ArrowLeft, Users, Plus, Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react'
import { supabase, Profile, CommunityPost, hasValidSupabaseConfig } from '../lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { CreateCommunityPostPopup } from './CreateCommunityPostPopup'

interface Community {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
  member_count?: number
}

interface CommunityViewProps {
  communityId: string
  currentUser: Profile
  onBack: () => void
}

export function CommunityView({ communityId, currentUser, onBack }: CommunityViewProps) {
  const [community, setCommunity] = useState<Community | null>(null)
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreatePost, setShowCreatePost] = useState(false)

  useEffect(() => {
    loadCommunityData()
  }, [communityId])

  const loadCommunityData = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!hasValidSupabaseConfig()) {
        // Demo data for when Supabase is not configured
        const demoCommunities = {
          'gmik': { 
            id: 'gmik', 
            name: 'GMIK', 
            description: 'GMIK Community - Connect with fellow members',
            member_count: 42
          },
          'programmer': { 
            id: 'programmer', 
            name: 'Programmer', 
            description: 'No Life Pipol - For developers and tech enthusiasts',
            member_count: 128
          },
          'design': { 
            id: 'design', 
            name: 'Design Hub', 
            description: 'Creative minds unite - Share your designs and get feedback',
            member_count: 67
          }
        }
        
        const demoCommunity = demoCommunities[communityId as keyof typeof demoCommunities]
        if (demoCommunity) {
          setCommunity({
            ...demoCommunity,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          
          // Demo posts for this community
          setPosts([
            {
              id: `${communityId}-post-1`,
              community_id: communityId,
              user_id: currentUser.id,
              content: `Welcome to ${demoCommunity.name}! This is a demo post to show how community posts work. You can share images, files, and have full discussions here.`,
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
            }
          ])
        } else {
          setError('Community not found')
        }
        setLoading(false)
        return
      }

      // Load community info
      const { data: communityData, error: communityError } = await supabase
        .from('communities')
        .select('*')
        .eq('id', communityId)
        .single()

      if (communityError) {
        console.error('Community error:', communityError)
        setError(`Failed to load community: ${communityError.message}`)
        setLoading(false)
        return
      }

      setCommunity(communityData)

      // Load community posts
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
        setError(`Failed to load posts: ${postsError.message}`)
        setLoading(false)
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
      console.error('Error loading community data:', error)
      setError(`Failed to load community: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

      loadCommunityData()
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleCreatePost = () => {
    setShowCreatePost(true)
  }

  const handlePostCreated = () => {
    setShowCreatePost(false)
    loadCommunityData()
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

  const getUserAvatar = (profile: any) => {
    if (profile?.avatar_url) {
      return profile.avatar_url
    }
    return null
  }

  const getUserDisplayName = (profile: any) => {
    return profile?.display_name || profile?.full_name || 'Anonymous'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-white/20">
          <div className="max-w-lg mx-auto px-4 py-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="animate-pulse flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <div className="h-5 bg-gray-300 rounded w-24"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-lg mx-auto p-4">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="animate-pulse">
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
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !community) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-white/20">
          <div className="max-w-lg mx-auto px-4 py-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Community</h1>
            </div>
          </div>
        </div>
        <div className="max-w-lg mx-auto p-4">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Community</h3>
            <p className="text-red-600 mb-4">{error || 'Community not found'}</p>
            <button
              onClick={loadCommunityData}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-white/20">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className={`w-8 h-8 bg-gradient-to-br ${getCommunityColor(community.name)} rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                {getCommunityInitial(community.name)}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{community.name}</h1>
                {community.member_count && (
                  <p className="text-sm text-gray-600">{community.member_count} members</p>
                )}
              </div>
            </div>
            <button
              onClick={handleCreatePost}
              className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full hover:from-blue-600 hover:to-purple-600 transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          {community.description && (
            <div className="mt-3 px-11">
              <p className="text-sm text-gray-600">{community.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto p-4 pb-20">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-600 mb-4">
              Be the first to share something in {community.name}!
            </p>
            <button
              onClick={handleCreatePost}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Create Post
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Post Header */}
                <div className="p-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getUserAvatar(post.profiles) ? (
                        <img
                          src={getUserAvatar(post.profiles)}
                          alt={getUserDisplayName(post.profiles)}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {getUserDisplayName(post.profiles).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">{getUserDisplayName(post.profiles)}</p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Post Content */}
                <div className="px-4 pb-3">
                  <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
                </div>

                {/* Post Images */}
                {post.images && post.images.length > 0 && (
                  <div className="px-4 pb-3">
                    <div className="grid grid-cols-1 gap-2">
                      {post.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Post image ${index + 1}`}
                          className="w-full rounded-lg object-cover max-h-96"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Post Actions */}
                <div className="px-4 py-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <button
                        onClick={() => handleLike(post.id)}
                        className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors"
                      >
                        <Heart className="w-5 h-5" />
                        <span className="text-sm">{post._count?.likes || 0}</span>
                      </button>
                      <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm">{post._count?.comments || 0}</span>
                      </button>
                    </div>
                    <button className="text-gray-600 hover:text-gray-900 transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Post Popup */}
      {showCreatePost && community && (
        <CreateCommunityPostPopup
          communityId={communityId}
          communityName={community.name}
          onClose={() => setShowCreatePost(false)}
          onPostCreated={handlePostCreated}
        />
      )}
    </div>
  )
}
