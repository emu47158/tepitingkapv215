import React, { useState } from 'react'
import { Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Post, Profile } from '../lib/supabase'

interface AnonymousPostCardProps {
  post: Post
  currentUser: Profile
  onLike: (postId: string) => void
  onComment: (postId: string, content: string) => void
}

export function AnonymousPostCard({ post, currentUser, onLike, onComment }: AnonymousPostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  const isLiked = post.likes?.some(like => like.user_id === currentUser.id) || false
  const likesCount = post._count?.likes || 0
  const commentsCount = post._count?.comments || 0

  const handleLike = () => {
    onLike(post.id)
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim() || isSubmittingComment) return

    setIsSubmittingComment(true)
    try {
      await onComment(post.id, commentText.trim())
      setCommentText('')
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header - Anonymous */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">?</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Anonymous</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{formatDistanceToNow(new Date(post.created_at))} ago</span>
                <span>•</span>
                <span className="text-gray-600 font-medium">Anonymous Post</span>
              </div>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <MoreHorizontal className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Content - Text Only */}
      <div className="px-4 pb-4">
        <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-colors ${
                isLiked 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{likesCount}</span>
            </button>
            
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{commentsCount}</span>
            </button>
            
            <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors">
              <Share className="w-5 h-5" />
              <span className="text-sm font-medium">Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-100">
          {/* Comment Form - Also Anonymous */}
          <form onSubmit={handleComment} className="p-4 border-b border-gray-100">
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-xs">?</span>
              </div>
              <div className="flex-1">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Comment anonymously..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none"
                  rows={2}
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!commentText.trim() || isSubmittingComment}
                    className="px-4 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmittingComment ? 'Posting...' : 'Comment'}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Comments List - All Anonymous */}
          <div className="max-h-96 overflow-y-auto">
            {post.comments && post.comments.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="p-4">
                    <div className="flex space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-xs">?</span>
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg px-3 py-2">
                          <h4 className="font-semibold text-sm text-gray-900">Anonymous</h4>
                          <p className="text-gray-800 text-sm mt-1">{comment.content}</p>
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>{formatDistanceToNow(new Date(comment.created_at))} ago</span>
                          <button className="hover:text-gray-700 transition-colors">Like</button>
                          <button className="hover:text-gray-700 transition-colors">Reply</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                <p className="text-sm">No comments yet. Be the first to comment anonymously!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
