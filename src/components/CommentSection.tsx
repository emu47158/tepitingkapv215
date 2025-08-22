import React from 'react'
import { Comment } from '../lib/supabase'
import { formatDistanceToNow } from 'date-fns'

interface CommentSectionProps {
  comments: Comment[]
}

export function CommentSection({ comments }: CommentSectionProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 text-sm">No comments yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="flex space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-medium">
              {comment.profiles?.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1">
            <div className="bg-gray-50 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium text-sm text-gray-900">
                  {comment.profiles?.full_name || comment.profiles?.username || 'Anonymous'}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-gray-700">{comment.content}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
