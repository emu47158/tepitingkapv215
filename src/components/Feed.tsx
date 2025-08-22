import React, { useState, useEffect } from 'react'
import { Plus, Heart, MessageCircle, Share, Image, X } from 'lucide-react'
import { Profile, Post, createPost, getPosts, uploadFile } from '../lib/supabase'
import { formatDistanceToNow } from 'date-fns'

interface FeedProps {
  currentUser: Profile
}

export function Feed({ currentUser }: FeedProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [newPostContent, setNewPostContent] = useState('')
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    setLoading(true)
    const data = await getPosts()
    setPosts(data)
    setLoading(false)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedImages(prev => [...prev, ...files].slice(0, 4)) // Max 4 images
  }

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && selectedImages.length === 0) return

    setUploading(true)
    try {
      // Upload images if any
      const imageUrls: string[] = []
      for (const image of selectedImages) {
        const url = await uploadFile(image)
        if (url) imageUrls.push(url)
      }

      // Create post
      const post = await createPost(newPostContent, imageUrls)
      if (post) {
        setPosts(prev => [post, ...prev])
        setNewPostContent('')
        setSelectedImages([])
        setShowCreatePost(false)
      }
    } catch (error) {
      console.error('Error creating post:', error)
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full">
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-24"></div>
                  <div className="h-3 bg-gray-300 rounded w-16"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-full"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Create Post Button */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
        <button
          onClick={() => setShowCreatePost(true)}
          className="w-full flex items-center space-x-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {currentUser.display_name?.charAt(0).toUpperCase() || currentUser.full_name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <span className="text-gray-500">What's on your mind?</span>
        </button>
      </div>

      {/* Posts */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-500 mb-4">Be the first to share something with the community!</p>
            <button
              onClick={() => setShowCreatePost(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Post</span>
            </button>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white rounded-2xl p-6 shadow-sm">
              {/* Post Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {post.profiles.display_name?.charAt(0).toUpperCase() || post.profiles.full_name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {post.profiles.display_name || post.profiles.full_name || 'Anonymous User'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* Post Content */}
              <div className="mb-4">
                <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
              </div>

              {/* Post Images */}
              {post.images && post.images.length > 0 && (
                <div className={`mb-4 grid gap-2 ${
                  post.images.length === 1 ? 'grid-cols-1' :
                  post.images.length === 2 ? 'grid-cols-2' :
                  'grid-cols-2'
                }`}>
                  {post.images.slice(0, 4).map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Post image ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      {index === 3 && post.images.length > 4 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">
                            +{post.images.length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center space-x-6 pt-4 border-t border-gray-100">
                <button className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors">
                  <Heart className="w-5 h-5" />
                  <span className="text-sm">Like</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm">Comment</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors">
                  <Share className="w-5 h-5" />
                  <span className="text-sm">Share</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create Post</h3>
              <button
                onClick={() => {
                  setShowCreatePost(false)
                  setNewPostContent('')
                  setSelectedImages([])
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-start space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {currentUser.display_name?.charAt(0).toUpperCase() || currentUser.full_name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {currentUser.display_name || currentUser.full_name || 'You'}
                  </h4>
                </div>
              </div>

              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={4}
              />

              {/* Selected Images */}
              {selectedImages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {selectedImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Selected ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 cursor-pointer transition-colors">
                    <Image className="w-5 h-5" />
                    <span className="text-sm">Photos</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                <button
                  onClick={handleCreatePost}
                  disabled={(!newPostContent.trim() && selectedImages.length === 0) || uploading}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
