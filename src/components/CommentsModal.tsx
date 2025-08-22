import React, { useState, useEffect } from 'react'
import { X, Send, Heart, MoreHorizontal } from 'lucide-react'
import { supabase, Post, Profile } from '../lib/supabase'
import { formatDistanceToNow } from 'date-fns'

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  post_id: string
  profiles: Profile
}

interface CommentsModalProps {
  post: Post & {
    profiles: Profile
    post_likes: { user_id: string }[]
    comments: { id: string }[]
  }
  currentUser: Profile
  onClose: () => void
  onUpdate: () => void
}

export function CommentsModal({ post, currentUser, onClose, onUpdate }: CommentsModalProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [commentLikes, setCommentLikes] = useState<Record<string, { user_id: string; isLiked: boolean; count: number }>>({})
  const [likingComments, setLikingComments] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchComments()
  }, [post.id])

  const fetchComments = async () => {
    try {
      console.log('🔍 Fetching comments for post:', post.id)
      
      // Fetch comments
      const { data: comments, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (
            id,
            full_name,
            display_name,
            avatar_url,
            email
          )
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('❌ Error fetching comments:', error)
        throw error
      }
      
      console.log('✅ Comments fetched:', comments)
      setComments(comments || [])
      
      // Fetch likes for each comment
      if (comments && comments.length > 0) {
        await fetchCommentLikes(comments.map(c => c.id))
      }
    } catch (error) {
      console.error('❌ Error fetching comments:', error)
      setComments([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCommentLikes = async (commentIds: string[]) => {
    try {
      console.log('🔍 Fetching likes for comment IDs:', commentIds)
      
      const { data: likes, error } = await supabase
        .from('likes')
        .select('comment_id, user_id')
        .in('comment_id', commentIds)
        .not('comment_id', 'is', null)

      if (error) {
        console.error('❌ Error fetching comment likes:', error)
        return
      }

      console.log('✅ Comment likes fetched:', likes)

      // Process likes data
      const likesMap: Record<string, { user_id: string; isLiked: boolean; count: number }> = {}
      
      // Initialize all comments with zero likes
      commentIds.forEach(commentId => {
        likesMap[commentId] = {
          user_id: currentUser.id,
          isLiked: false,
          count: 0
        }
      })

      // Process actual likes
      if (likes) {
        likes.forEach(like => {
          if (like.comment_id) {
            if (!likesMap[like.comment_id]) {
              likesMap[like.comment_id] = {
                user_id: currentUser.id,
                isLiked: false,
                count: 0
              }
            }
            
            likesMap[like.comment_id].count++
            
            if (like.user_id === currentUser.id) {
              likesMap[like.comment_id].isLiked = true
            }
          }
        })
      }

      console.log('📊 Processed comment likes map:', likesMap)
      setCommentLikes(likesMap)
    } catch (error) {
      console.error('❌ Error processing comment likes:', error)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || isSubmitting) return

    try {
      setIsSubmitting(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      console.log('💬 Submitting comment:', newComment.trim())

      const { data: insertedComment, error } = await supabase
        .from('comments')
        .insert({
          content: newComment.trim(),
          post_id: post.id,
          user_id: user.id
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error inserting comment:', error)
        throw error
      }

      console.log('✅ Comment inserted:', insertedComment)
      setNewComment('')
      
      // Wait a moment then refetch
      setTimeout(() => {
        fetchComments()
      }, 500)
      
      onUpdate()
    } catch (error) {
      console.error('❌ Error posting comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLikeComment = async (commentId: string) => {
    if (likingComments.has(commentId)) return
    
    try {
      setLikingComments(prev => new Set([...prev, commentId]))
      
      const currentLikeData = commentLikes[commentId]
      const isCurrentlyLiked = currentLikeData?.isLiked || false
      
      console.log('❤️ Toggling like for comment:', commentId)
      console.log('👤 Current user ID:', currentUser.id)
      console.log('📊 Currently liked:', isCurrentlyLiked)
      
      if (isCurrentlyLiked) {
        // Unlike - remove from likes table
        console.log('👎 Removing like from likes table...')
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', currentUser.id)
        
        if (error) {
          console.error('❌ Error removing comment like:', error)
          throw error
        }
        console.log('✅ Comment like removed successfully')
        
        // Update local state
        setCommentLikes(prev => ({
          ...prev,
          [commentId]: {
            ...prev[commentId],
            isLiked: false,
            count: Math.max(0, (prev[commentId]?.count || 0) - 1)
          }
        }))
      } else {
        // Like - add to likes table
        console.log('👍 Adding like to likes table...')
        const { data, error } = await supabase
          .from('likes')
          .insert({
            comment_id: commentId,
            user_id: currentUser.id,
            post_id: null // Explicitly set post_id to null for comment likes
          })
          .select()

        if (error) {
          console.error('❌ Error adding comment like:', error)
          console.error('Error details:', error.message, error.details, error.hint)
          throw error
        }
        console.log('✅ Comment like added successfully:', data)
        
        // Update local state
        setCommentLikes(prev => ({
          ...prev,
          [commentId]: {
            ...prev[commentId],
            isLiked: true,
            count: (prev[commentId]?.count || 0) + 1
          }
        }))
      }
    } catch (error) {
      console.error('❌ Error toggling comment like:', error)
    } finally {
      setLikingComments(prev => {
        const newSet = new Set(prev)
        newSet.delete(commentId)
        return newSet
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Comments ({comments.length})
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Post Preview */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              {post.profiles.avatar_url ? (
                <img 
                  src={post.profiles.avatar_url} 
                  alt={post.profiles.display_name || post.profiles.full_name || 'User'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-xs">
                  {(post.profiles.display_name || post.profiles.full_name || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm text-gray-900">
                  {post.profiles.display_name || post.profiles.full_name || 'Anonymous User'}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-gray-700 mt-1 line-clamp-2">{post.content}</p>
            </div>
          </div>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <span className="ml-2 text-gray-500">Loading comments...</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => {
                const likeData = commentLikes[comment.id] || { isLiked: false, count: 0 }
                const isLiked = likeData.isLiked
                const likesCount = likeData.count
                const isLiking = likingComments.has(comment.id)

                return (
                  <div key={comment.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      {comment.profiles?.avatar_url ? (
                        <img 
                          src={comment.profiles.avatar_url} 
                          alt={comment.profiles.display_name || comment.profiles.full_name || 'User'}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold text-xs">
                          {(comment.profiles?.display_name || comment.profiles?.full_name || 'U').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-50 rounded-2xl px-3 py-2">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm text-gray-900">
                            {comment.profiles?.display_name || comment.profiles?.full_name || 'Anonymous User'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 ml-3">
                        <button
                          onClick={() => handleLikeComment(comment.id)}
                          disabled={isLiking}
                          className={`flex items-center space-x-1 text-xs transition-colors ${
                            isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                          } ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''} ${isLiking ? 'animate-pulse' : ''}`} />
                          {likesCount > 0 && <span>{likesCount}</span>}
                        </button>
                        <button className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Comment Input */}
        <div className="p-4 border-t border-gray-200">
          <form onSubmit={handleSubmitComment} className="flex items-end space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              {currentUser.avatar_url ? (
                <img 
                  src={currentUser.avatar_url} 
                  alt={currentUser.display_name || currentUser.full_name || 'You'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-xs">
                  {(currentUser.display_name || currentUser.full_name || 'Y').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full px-4 py-2 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={1}
                style={{ minHeight: '40px', maxHeight: '120px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = Math.min(target.scrollHeight, 120) + 'px'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="p-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
