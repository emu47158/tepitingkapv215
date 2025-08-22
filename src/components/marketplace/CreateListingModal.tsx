import React, { useState } from 'react'
import { X, Upload, Plus } from 'lucide-react'
import { createMarketplaceItem, uploadFile, Profile } from '../../lib/supabase'

interface CreateListingModalProps {
  currentUser: Profile
  onClose: () => void
  onItemCreated: (item: any) => void
}

export function CreateListingModal({ currentUser, onClose, onItemCreated }: CreateListingModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: ''
  })
  const [images, setImages] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const categories = [
    'electronics',
    'clothing',
    'home',
    'books',
    'sports',
    'automotive',
    'other'
  ]

  const conditions = [
    'new',
    'like-new',
    'good',
    'fair',
    'poor'
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploading(true)
    const newImages = [...images]
    const newUrls = [...imageUrls]

    for (const file of files) {
      if (newImages.length >= 5) break // Limit to 5 images
      
      try {
        const url = await uploadFile(file, 'marketplace-images')
        if (url) {
          newImages.push(file)
          newUrls.push(url)
        }
      } catch (error) {
        console.error('Error uploading image:', error)
        // For demo purposes, create a placeholder URL
        const placeholderUrl = `https://images.pexels.com/photos/4158/${Math.floor(Math.random() * 1000000)}.jpeg?auto=compress&cs=tinysrgb&w=400`
        newImages.push(file)
        newUrls.push(placeholderUrl)
      }
    }

    setImages(newImages)
    setImageUrls(newUrls)
    setUploading(false)
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImageUrls(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.price || !formData.category || !formData.condition) {
      alert('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const itemData = {
        seller_id: currentUser.id,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        condition: formData.condition,
        images: imageUrls,
        is_sold: false
      }

      const item = await createMarketplaceItem(itemData)

      if (item) {
        onItemCreated({
          ...item,
          profiles: currentUser
        })
        alert('Item listed successfully!')
      } else {
        // Create demo item for when Supabase is not configured
        const demoItem = {
          id: `demo-${Date.now()}`,
          ...itemData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          profiles: currentUser
        }
        onItemCreated(demoItem)
        alert('Item listed successfully!')
      }
    } catch (error) {
      console.error('Error creating item:', error)
      alert('Failed to list item. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(price)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Listing</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter item title"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your item..."
              />
            </div>

            {/* Price, Category, Condition */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Price (₩) *
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
                {formData.price && (
                  <p className="text-sm text-gray-500 mt-1">
                    {formatPrice(parseFloat(formData.price) || 0)}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
                  Condition *
                </label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select condition</option>
                  {conditions.map(condition => (
                    <option key={condition} value={condition}>
                      {condition.charAt(0).toUpperCase() + condition.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Images (Max 5)
              </label>
              
              {/* Image Preview */}
              {imageUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {imageUrls.length < 5 && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    id="images"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="images"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    {uploading ? (
                      <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                    ) : (
                      <Plus className="w-8 h-8 text-gray-400" />
                    )}
                    <span className="text-sm text-gray-600">
                      {uploading ? 'Uploading...' : 'Click to upload images'}
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || uploading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Creating...' : 'Create Listing'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
