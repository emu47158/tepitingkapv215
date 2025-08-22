import React, { useState, useEffect } from 'react'
import { hasValidSupabaseConfig } from '../lib/supabase'
import { useApiPosts } from '../hooks/useApi'
import { PostCard } from './PostCard'
import { AnonymousPostCard } from './AnonymousPostCard'
import { PostForm } from './PostForm'
import { AnonymousPostForm } from './AnonymousPostForm'

interface PostFeedProps {
  currentUser: any
  section: string
}

// Demo posts for when Supabase is not configured
const demoPostsData = [
  {
    id: '1',
    user_id: 'demo-user-123',
    content: 'Welcome to our social platform! 🎉 This is a demo post to show how the feed works. Feel free to interact with it!',
    images: ['https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg?auto=compress&cs=tinysrgb&w=800'],
    files: [],
    visibility: 'public',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    profiles: {
      id: 'demo-user-123',
      username: 'demouser',
      full_name: 'Demo User',
      email: 'demo@example.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    likes: [],
    comments: [],
    _count: { likes: 5, comments: 2 }
  }
]

const demoAnonymousPostsData = [
  {
    id: '2',
    user_id: 'demo-user-456',
    content: 'This is an anonymous post. You can share your thoughts freely without revealing your identity. Perfect for sensitive topics or when you want complete privacy.',
    images: null,
    files: null,
    visibility: 'anonymous',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    profiles: null,
    likes: [],
    comments: [],
    _count: { likes: 3, comments: 1 }
  }
]

export function PostFeed({ currentUser, section }: PostFeedProps) {
  const { posts, loading, error, loadPosts, createPost, likePost, addComment, isReady } = useApiPosts()
  const [localPosts, setLocalPosts] = useState<any[]>([])

  useEffect(() => {
    if (hasValidSupabaseConfig() && isReady) {
      // Use REST API
      loadPosts({ section: section || 'public' })
    } else {
      // Use demo data
      if (section === 'public' || !section) {
        setLocalPosts(demoPostsData)
      } else if (section === 'anonymous') {
        setLocalPosts(demoAnonymousPostsData)
      } else {
        setLocalPosts([])
      }
    }
  }, [section, isReady])

  const handleLike = async (postId: string) => {
    if (hasValidSupabaseConfig() && isReady) {
      await likePost(postId)
    } else {
      // Demo mode - just update local state
      setLocalPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            const isLiked = post.likes?.some((l: any) => l.user_id === currentUser.id)
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
    }
  }

  const handleComment = async (postId: string, content: string) => {
    if (hasValidSupabaseConfig() && isReady) {
      await addComment(postId, content)
    } else {
      // Demo mode
      alert('Comment added! (Demo mode)')
    }
  }

  const handlePostCreated = async (postData: any) => {
    if (hasValidSupabaseConfig() && isReady) {
      await createPost(postData)
    } else {
      // Demo mode - add to local state
      const newPost = {
        id: Date.now().toString(),
        ...postData,
        user_id: currentUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profiles: section === 'anonymous' ? null : currentUser,
        likes: [],
        comments: [],
        _count: { likes: 0, comments: 0 }
      }
      setLocalPosts(prev => [newPost, ...prev])
    }
  }

  const displayPosts = hasValidSupabaseConfig() ? posts : localPosts
  const isLoading = hasValidSupabaseConfig() ? loading : false

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
    )
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Posts</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => loadPosts({ section: section || 'public' })}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="space-y-6">
        {/* Post Creation Form */}
        {(section === 'public' || !section) && (
          <PostForm onPostCreated={handlePostCreated} />
        )}
        
        {section === 'anonymous' && (
          <AnonymousPostForm onPostCreated={handlePostCreated} />
        )}

        {/* Posts Feed */}
        {displayPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">
                {section === 'anonymous' ? '🤐' : '📝'}
              </span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {section === 'anonymous' ? 'No anonymous posts yet' : 'No public posts yet'}
            </h3>
            <p className="text-gray-600">
              {section === 'anonymous' 
                ? 'Share your thoughts anonymously - no usernames, just pure content!'
                : 'Be the first to share something with the community!'
              }
            </p>
          </div>
        ) : (
          displayPosts.map((post) => (
            section === 'anonymous' ? (
              <AnonymousPostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                onLike={handleLike}
                onComment={handleComment}
              />
            ) : (
              <PostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                onLike={handleLike}
                onComment={handleComment}
              />
            )
          ))
        )}
      </div>
    </div>
  )
}
