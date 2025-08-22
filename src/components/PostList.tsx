import React, { useState, useEffect } from 'react'
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { supabase, Post, AnonymousPost, CommunityPost, likePost, unlikePost, getPostLikes, checkUserLikedPost, getPostComments } from '../lib/supabase'
import { CommentSection } from './CommentSection'

interface PostListProps {
  refreshTrigger: number
  section: 'public' | 'anonymous' | string
}

type CombinedPost = (Post | AnonymousPost | CommunityPost) & {
  is_anonymous?: boolean
  is_community?: boolean
  profiles?: any
  communities?: any
  like_count?: number
  user_liked?: boolean
  comment_count?: number
  images?: string[]
  files?: string[]
}

export function PostList({ refreshTrigger, section }: PostListProps) {
  const [posts, setPosts] = useState<CombinedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set())
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [imageGalleries, setImageGalleries] = useState<{[postId: string]: number}>({})
  const [fullscreenImage, setFullscreenImage] = useState<{url: string, alt: string} | null>(null)

  const fetchPosts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (section === 'anonymous') {
        const { data: anonymousData, error: anonymousError } = await supabase
          .from('anonymous_posts')
          .select('id, content, created_at, updated_at')
          .order('created_at', { ascending: false })

        if (anonymousError) throw anonymousError

        const anonymousPosts = (anonymousData || []).map(post => ({
          ...post,
          is_anonymous: true,
          is_community: false,
          profiles: null,
          like_count: 0,
          user_liked: false,
          comment_count: 0,
          images: [],
          files: []
        }))

        setPosts(anonymousPosts)
      } else if (section === 'public') {
        const { data: publicData, error: publicError } = await supabase
          .from('posts')
          .select('id, content, created_at, updated_at, user_id, images, files')
          .order('created_at', { ascending: false })

        if (publicError) throw publicError

        const postsWithData = await Promise.all(
          (publicData || []).map(async (post) => {
            try {
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id, display_name, full_name, username')
                .eq('id', post.user_id)
                .single()

              if (profileError) {
                console.warn('Profile fetch error for user:', post.user_id, profileError)
              }

              const likes = await getPostLikes(post.id, false)
              const userLiked = await checkUserLikedPost(post.id, false)
              const comments = await getPostComments(post.id, false)

              return { 
                ...post, 
                profiles: profile || null, 
                is_anonymous: false, 
                is_community: false,
                like_count: likes.length,
                user_liked: userLiked,
                comment_count: comments.length,
                images: post.images || [],
                files: post.files || []
              }
            } catch (err) {
              console.warn('Error fetching data for post:', post.id, err)
              return { 
                ...post, 
                profiles: null, 
                is_anonymous: false, 
                is_community: false,
                like_count: 0,
                user_liked: false,
                comment_count: 0,
                images: post.images || [],
                files: post.files || []
              }
            }
          })
        )

        setPosts(postsWithData)
      } else {
        const { data: communityData, error: communityError } = await supabase
          .from('community_posts')
          .select(`
            id, 
            content, 
            created_at, 
            updated_at, 
            user_id,
            community_id,
            images,
            files,
            communities (
              id,
              name,
              description
            )
          `)
          .eq('community_id', section)
          .order('created_at', { ascending: false })

        if (communityError) throw communityError

        const communityPostsWithData = await Promise.all(
          (communityData || []).map(async (post) => {
            try {
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id, display_name, full_name, username')
                .eq('id', post.user_id)
                .single()

              if (profileError) {
                console.warn('Profile fetch error for user:', post.user_id, profileError)
              }

              const likes = await getPostLikes(post.id, true)
              const userLiked = await checkUserLikedPost(post.id, true)
              const comments = await getPostComments(post.id, true)

              return { 
                ...post, 
                profiles: profile || null, 
                is_anonymous: false, 
                is_community: true,
                like_count: likes.length,
                user_liked: userLiked,
                comment_count: comments.length,
                images: post.images || [],
                files: post.files || []
              }
            } catch (err) {
              console.warn('Error fetching data for community post:', post.id, err)
              return { 
                ...post, 
                profiles: null, 
                is_anonymous: false, 
                is_community: true,
                like_count: 0,
                user_liked: false,
                comment_count: 0,
                images: post.images || [],
                files: post.files || []
              }
            }
          })
        )

        setPosts(communityPostsWithData)
      }
    } catch (error: any) {
      console.error('Error fetching posts:', error)
      setError(error.message || 'Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [refreshTrigger, section])

  const handleLikeToggle = async (postId: string, isCurrentlyLiked: boolean, isCommunityPost: boolean) => {
    if (likingPosts.has(postId)) return

    setLikingPosts(prev => new Set(prev).add(postId))

    try {
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              user_liked: !isCurrentlyLiked,
              like_count: isCurrentlyLiked 
                ? Math.max(0, (post.like_count || 0) - 1)
                : (post.like_count || 0) + 1
            }
          }
          return post
        })
      )

      if (isCurrentlyLiked) {
        await unlikePost(postId, isCommunityPost)
      } else {
        await likePost(postId, isCommunityPost)
      }

      setError(null)
    } catch (error: any) {
      console.error('Error toggling like:', error)
      
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              user_liked: isCurrentlyLiked,
              like_count: isCurrentlyLiked 
                ? (post.like_count || 0) + 1 
                : Math.max(0, (post.like_count || 0) - 1)
            }
          }
          return post
        })
      )

      const errorMessage = error.message?.includes('not authenticated') 
        ? 'Please log in to like posts'
        : 'Failed to update like. Please try again.'
      
      setError(errorMessage)
      setTimeout(() => setError(null), 3000)
    } finally {
      setLikingPosts(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
    }
  }

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(postId)) {
        newSet.delete(postId)
      } else {
        newSet.add(postId)
      }
      return newSet
    })
  }

  const nextImage = (postId: string, totalImages: number) => {
    setImageGalleries(prev => ({
      ...prev,
      [postId]: ((prev[postId] || 0) + 1) % totalImages
    }))
  }

  const prevImage = (postId: string, totalImages: number) => {
    setImageGalleries(prev => ({
      ...prev,
      [postId]: ((prev[postId] || 0) - 1 + totalImages) % totalImages
    }))
  }

  const goToImage = (postId: string, index: number) => {
    setImageGalleries(prev => ({
      ...prev,
      [postId]: index
    }))
  }

  const openFullscreenImage = (imageUrl: string, alt: string) => {
    setFullscreenImage({ url: imageUrl, alt })
  }

  const closeFullscreenImage = () => {
    setFullscreenImage(null)
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`
    return `${Math.floor(diffInSeconds / 604800)}w`
  }

  const getDisplayName = (post: CombinedPost) => {
    if (post.is_anonymous) return 'anonymous'
    
    const profile = post.profiles
    if (!profile) return 'user'
    
    return profile.username || profile.display_name || profile.full_name || 'user'
  }

  const getInitials = (post: CombinedPost) => {
    if (post.is_anonymous) return '?'
    
    const profile = post.profiles
    if (!profile) return 'U'
    
    const name = profile.display_name || profile.full_name || profile.username || 'User'
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
              <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchPosts}
          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No posts yet
        </h3>
        <p className="text-gray-600">
          Be the first to share something!
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {posts.map((post) => (
          <article key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
            {/* Post Header */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                  {getInitials(post)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-900 font-semibold text-sm">
                      {getDisplayName(post)}
                    </span>
                    <span className="text-gray-400 text-sm">•</span>
                    <span className="text-gray-500 text-sm">
                      {formatTimeAgo(post.created_at)}
                    </span>
                  </div>
                  {post.is_community && post.communities && (
                    <span className="text-gray-500 text-xs">
                      {post.communities.name}
                    </span>
                  )}
                </div>
              </div>
              
              {!post.is_anonymous && (
                <button className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-50 transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Post Images - Updated to use 'images' column */}
            {!post.is_anonymous && post.images && post.images.length > 0 && (
              <div className="relative group">
                {post.images.length === 1 ? (
                  <div 
                    className="aspect-square bg-gray-100 cursor-pointer overflow-hidden"
                    onClick={() => openFullscreenImage(post.images![0], `Post by ${getDisplayName(post)}`)}
                  >
                    <img
                      src={post.images[0]}
                      alt={`Post by ${getDisplayName(post)}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="relative aspect-square bg-gray-100 overflow-hidden">
                    <img
                      src={post.images[imageGalleries[post.id] || 0]}
                      alt={`Post by ${getDisplayName(post)} - Image ${(imageGalleries[post.id] || 0) + 1}`}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                      onClick={() => openFullscreenImage(
                        post.images![imageGalleries[post.id] || 0], 
                        `Post by ${getDisplayName(post)} - Image ${(imageGalleries[post.id] || 0) + 1}`
                      )}
                    />
                    
                    {/* Navigation buttons */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        prevImage(post.id, post.images!.length)
                      }}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm z-10 shadow-lg"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        nextImage(post.id, post.images!.length)
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm z-10 shadow-lg"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    
                    {/* Dot indicators */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {post.images.map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            goToImage(post.id, index)
                          }}
                          className={`w-2 h-2 rounded-full transition-all duration-200 shadow-sm ${
                            index === (imageGalleries[post.id] || 0)
                              ? 'bg-white scale-125'
                              : 'bg-white/60 hover:bg-white/80'
                          }`}
                          aria-label={`Go to image ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Post Actions */}
            {!post.is_anonymous && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleLikeToggle(post.id, post.user_liked || false, post.is_community || false)}
                      disabled={likingPosts.has(post.id)}
                      className={`transition-all duration-200 ${
                        post.user_liked 
                          ? 'text-red-500 scale-110' 
                          : 'text-gray-700 hover:text-red-500 hover:scale-110'
                      } ${likingPosts.has(post.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Heart className={`w-6 h-6 ${post.user_liked ? 'fill-current' : ''}`} />
                    </button>
                    
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="text-gray-700 hover:text-gray-900 hover:scale-110 transition-all duration-200"
                    >
                      <MessageCircle className="w-6 h-6" />
                    </button>
                    
                    <button className="text-gray-700 hover:text-gray-900 hover:scale-110 transition-all duration-200">
                      <Send className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <button className="text-gray-700 hover:text-gray-900 hover:scale-110 transition-all duration-200">
                    <Bookmark className="w-6 h-6" />
                  </button>
                </div>

                {/* Like count */}
                {(post.like_count || 0) > 0 && (
                  <p className="text-gray-900 font-semibold text-sm mb-2">
                    {post.like_count} {post.like_count === 1 ? 'like' : 'likes'}
                  </p>
                )}

                {/* Post content */}
                {post.content && (
                  <div className="mb-2">
                    <span className="text-gray-900 font-semibold text-sm mr-2">
                      {getDisplayName(post)}
                    </span>
                    <span className="text-gray-900 text-sm leading-relaxed">
                      {post.content}
                    </span>
                  </div>
                )}

                {/* View comments */}
                {(post.comment_count || 0) > 0 && !expandedComments.has(post.id) && (
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="text-gray-500 text-sm mb-2 hover:text-gray-700 transition-colors"
                  >
                    View all {post.comment_count} comments
                  </button>
                )}
              </div>
            )}

            {/* Anonymous post content */}
            {post.is_anonymous && post.content && (
              <div className="p-4">
                <p className="text-gray-900 text-sm leading-relaxed">
                  {post.content}
                </p>
              </div>
            )}

            {/* Comments Section */}
            {!post.is_anonymous && expandedComments.has(post.id) && (
              <div className="border-t border-gray-100">
                <CommentSection 
                  postId={post.id} 
                  isCommunityPost={post.is_community || false}
                  isExpanded={true}
                  onToggle={() => toggleComments(post.id)}
                />
              </div>
            )}
          </article>
        ))}
      </div>

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={closeFullscreenImage}
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={fullscreenImage.url}
              alt={fullscreenImage.alt}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={closeFullscreenImage}
              className="absolute top-4 right-4 w-10 h-10 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
              aria-label="Close fullscreen view"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
