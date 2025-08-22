import React, { useState } from 'react'
import { Send, Image, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface PostFormProps {
  onPostCreated: () => void
  communityId?: string | null
}

export function PostForm({ onPostCreated, communityId = null }: PostFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedImages, setSelectedImages] = useState<File[]>([])

  console.log('PostForm initialized with communityId:', communityId)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length + selectedImages.length > 4) {
      setError('You can only upload up to 4 images per post')
      return
    }
    
    setSelectedImages(prev => [...prev, ...imageFiles])
    setError(null)
  }

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  const uploadImage = async (file: File): Promise<string> => {
    try {
      console.log('=== IMAGE UPLOAD DEBUG ===')
      console.log('File:', file.name, 'Size:', file.size, 'Type:', file.type)
      
      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.error('Auth error:', authError)
        throw new Error(`Authentication error: ${authError.message}`)
      }
      
      if (!user) {
        console.error('No user found')
        throw new Error('User not authenticated')
      }

      console.log('User authenticated:', user.id)

      // Create file path with user ID folder
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      
      console.log('Upload path:', fileName)

      // Attempt upload
      console.log('Starting upload...')
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('=== UPLOAD ERROR DETAILS ===')
        console.error('Error code:', uploadError.error)
        console.error('Error message:', uploadError.message)
        console.error('Full error:', uploadError)
        
        // Provide specific error messages
        if (uploadError.message?.includes('Bucket not found')) {
          throw new Error('Storage bucket not found. Please contact support.')
        } else if (uploadError.message?.includes('not allowed')) {
          throw new Error('Upload not allowed. Please check permissions.')
        } else if (uploadError.message?.includes('policy')) {
          throw new Error('Storage policy error. Please contact support.')
        } else {
          throw new Error(`Upload failed: ${uploadError.message}`)
        }
      }

      console.log('Upload successful:', uploadData)

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName)

      console.log('Public URL:', urlData.publicUrl)
      console.log('=== UPLOAD COMPLETE ===')
      
      return urlData.publicUrl
    } catch (error) {
      console.error('=== UPLOAD FUNCTION ERROR ===')
      console.error('Error details:', error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && selectedImages.length === 0) return

    setLoading(true)
    setError(null)
    
    try {
      console.log('=== POST CREATION START ===')
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      console.log('Creating post for user:', user.id)
      console.log('Community ID received:', communityId)
      console.log('Community ID type:', typeof communityId)
      console.log('Community ID is null?', communityId === null)
      console.log('Community ID is undefined?', communityId === undefined)

      // Upload images if any
      let imageUrls: string[] = []
      if (selectedImages.length > 0) {
        console.log(`Uploading ${selectedImages.length} images...`)
        
        for (let i = 0; i < selectedImages.length; i++) {
          const image = selectedImages[i]
          console.log(`\n--- Uploading image ${i + 1}/${selectedImages.length} ---`)
          
          try {
            const imageUrl = await uploadImage(image)
            imageUrls.push(imageUrl)
            console.log(`✓ Image ${i + 1} uploaded successfully`)
          } catch (uploadError: any) {
            console.error(`✗ Failed to upload image ${i + 1}:`, uploadError)
            throw new Error(`Failed to upload "${image.name}": ${uploadError.message}`)
          }
        }
      }

      console.log('All images uploaded. Creating post...')

      // CRITICAL: Always use posts table for PostForm component
      // PostForm is only used for regular public posts, never community posts
      console.log('🎯 USING POSTS TABLE (regular post)')
      const { error: insertError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim() || '',
          images: imageUrls,
          visibility: 'public',
          community_id: null  // Always null for regular posts
        })

      if (insertError) {
        console.error('Regular post creation error:', insertError)
        throw insertError
      }

      console.log('✓ Post created successfully in posts table')
      setContent('')
      setSelectedImages([])
      onPostCreated()
    } catch (error: any) {
      console.error('=== POST CREATION ERROR ===')
      console.error('Full error:', error)
      setError(error.message || 'Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full p-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder-gray-500 text-gray-800 resize-none"
            rows={3}
            maxLength={500}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-500">
              {content.length}/500
            </span>
          </div>
        </div>

        {/* Image Preview */}
        {selectedImages.length > 0 && (
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-2">
              {selectedImages.map((file, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-700 text-sm">
            <strong>Error:</strong> {error}
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-semibold">🔍 Show Debug Info</summary>
              <div className="mt-2 text-xs font-mono bg-red-500/10 p-2 rounded border">
                <div>• Check browser console (F12) for detailed logs</div>
                <div>• Look for "=== POST CREATION DEBUG ===" section</div>
                <div>• Note any specific error codes or messages</div>
                <div>• Community ID: {communityId || 'null (regular post)'}</div>
                <div>• Table: posts (always for PostForm)</div>
              </div>
            </details>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <label className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer">
              <Image className="w-5 h-5" />
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                disabled={loading || selectedImages.length >= 4}
              />
            </label>
            {selectedImages.length > 0 && (
              <span className="text-xs text-gray-500">
                {selectedImages.length}/4 images
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || (!content.trim() && selectedImages.length === 0)}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                Posting...
              </div>
            ) : (
              <div className="flex items-center">
                <Send className="w-4 h-4 mr-2" />
                Post
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
