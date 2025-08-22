import React, { useState } from 'react'
import { X, Image, Paperclip, Send } from 'lucide-react'
import { supabase, hasValidSupabaseConfig } from '../lib/supabase'

interface CreateCommunityPostPopupProps {
  communityId: string
  communityName: string
  onClose: () => void
  onPostCreated: () => void
}

export function CreateCommunityPostPopup({ 
  communityId, 
  communityName, 
  onClose, 
  onPostCreated 
}: CreateCommunityPostPopupProps) {
  const [content, setContent] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [files, setFiles] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)

    try {
      if (!hasValidSupabaseConfig()) {
        // Demo mode - just show success message
        alert(`Post created in ${communityName}! (Demo mode)`)
        onPostCreated()
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('You must be logged in to create a post')
        return
      }

      const { error } = await supabase
        .from('community_posts')
        .insert([{
          community_id: communityId,
          user_id: user.id,
          content: content.trim(),
          images: images.length > 0 ? images : null,
          files: files.length > 0 ? files : null,
        }])

      if (error) {
        console.error('Error creating community post:', error)
        alert(`Failed to create post: ${error.message}`)
        return
      }

      onPostCreated()
    } catch (error) {
      console.error('Error creating community post:', error)
      alert('Failed to create post. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageAdd = () => {
    const url = prompt('Enter image URL:')
    if (url && url.trim()) {
      setImages(prev => [...prev, url.trim()])
    }
  }

  const handleFileAdd = () => {
    const url = prompt('Enter file URL:')
    if (url && url.trim()) {
      setFiles(prev => [...prev, url.trim()])
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Create Post in {communityName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 p-4 overflow-y-auto">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`What's happening in ${communityName}?`}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={500}
            />

            <div className="text-right text-sm text-gray-500 mt-1">
              {content.length}/500
            </div>

            {/* Images Preview */}
            {images.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Images</h4>
                <div className="space-y-2">
                  {images.map((image, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <img
                        src={image}
                        alt={`Preview ${index + 1}`}
                        className="w-12 h-12 object-cover rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzNkMzMC42Mjc0IDM2IDM2IDMwLjYyNzQgMzYgMjRDMzYgMTcuMzcyNiAzMC42Mjc0IDEyIDI0IDEyQzE3LjM3MjYgMTIgMTIgMTcuMzcyNiAxMiAyNEMxMiAzMC42Mjc0IDE3LjM3MjYgMzYgMjQgMzZaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K'
                        }}
                      />
                      <span className="flex-1 text-sm text-gray-600 mx-3 truncate">{image}</span>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Files Preview */}
            {files.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Files</h4>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                        <Paperclip className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="flex-1 text-sm text-gray-600 mx-3 truncate">{file}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleImageAdd}
                  className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                  title="Add image"
                >
                  <Image className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleFileAdd}
                  className="p-2 text-gray-500 hover:text-green-500 hover:bg-green-50 rounded-full transition-colors"
                  title="Add file"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
              </div>

              <button
                type="submit"
                disabled={!content.trim() || isSubmitting}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Posting...' : 'Post'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
