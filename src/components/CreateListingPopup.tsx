import React, { useState } from 'react'
import { X, Upload, Package, DollarSign, Tag, FileText } from 'lucide-react'
import { createMarketplaceItem } from '../lib/supabase'

interface CreateListingPopupProps {
  onClose: () => void
  onListingCreated: () => void
}

export function CreateListingPopup({ onClose, onListingCreated }: CreateListingPopupProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Other',
    condition: 'Good',
    images: [] as string[]
  })
  const [imageUrl, setImageUrl] = useState('')
  const [creating, setCreating] = useState(false)

  const categories = [
    'Electronics', 'Clothing', 'Home & Garden', 'Sports', 
    'Books', 'Vehicles', 'Furniture', 'Toys', 'Other'
  ]

  const conditions = [
    { value: 'New', label: 'New' },
    { value: 'Like New', label: 'Like New' },
    { value: 'Good', label: 'Good' },
    { value: 'Fair', label: 'Fair' },
    { value: 'Poor', label: 'Poor' }
  ]

  const handleAddImage = () => {
    if (imageUrl.trim() && formData.images.length < 5) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageUrl.trim()]
      }))
      setImageUrl('')
    }
  }

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.price.trim()) {
      alert('Please fill in title and price')
      return
    }

    const price = parseFloat(formData.price)
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price')
      return
    }

    setCreating(true)
    try {
      const item = await createMarketplaceItem({
        seller_id: '', // This will be set by the function
        title: formData.title.trim(),
        description: formData.description.trim(),
        price,
        category: formData.category,
        condition: formData.condition,
        images: formData.images,
        is_sold: false
      })

      if (item) {
        alert('Item listed successfully!')
        onListingCreated()
        onClose()
      } else {
        alert('Failed to create listing. Please try again.')
      }
    } catch (error) {
      console.error('Error creating listing:', error)
      alert('Failed to create listing. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="backdrop-blur-xl bg-white/90 border border-white/30 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl">
              <Package className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">List New Item</h3>
              <p className="text-sm text-gray-600">Create a listing for trading</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Item Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 bg-white/20 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
              placeholder="What are you selling?"
              maxLength={100}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{formData.title.length}/100 characters</p>
          </div>

          {/* Price and Category Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Price (₩) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                className="w-full px-4 py-3 bg-white/20 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                placeholder="0"
                min="0"
                step="1000"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-3 bg-white/20 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condition
            </label>
            <div className="grid grid-cols-5 gap-2">
              {conditions.map(condition => (
                <button
                  key={condition.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, condition: condition.value }))}
                  className={`py-2 px-3 text-sm rounded-xl transition-all duration-200 ${
                    formData.condition === condition.value
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-blue-700 border border-blue-500/20'
                      : 'bg-white/20 text-gray-700 border border-white/20 hover:bg-white/30'
                  }`}
                >
                  {condition.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 bg-white/20 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none"
              placeholder="Describe your item, its condition, and any important details..."
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{formData.description.length}/500 characters</p>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Upload className="w-4 h-4 inline mr-1" />
              Images (up to 5)
            </label>
            
            {/* Add Image URL */}
            <div className="flex space-x-2 mb-3">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 px-4 py-2 bg-white/20 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-sm"
                placeholder="Paste image URL (e.g., from Pexels, Unsplash)"
              />
              <button
                type="button"
                onClick={handleAddImage}
                disabled={!imageUrl.trim() || formData.images.length >= 5}
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 disabled:bg-gray-200 disabled:text-gray-400 text-blue-700 rounded-xl text-sm font-medium transition-colors disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>

            {/* Image Preview */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {formData.images.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = 'https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=400'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white/20 hover:bg-white/30 text-gray-700 rounded-xl font-medium transition-all duration-200 border border-white/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !formData.title.trim() || !formData.price.trim()}
              className="flex-1 py-3 bg-gradient-to-r from-green-500/20 to-blue-500/20 hover:from-green-500/30 hover:to-blue-500/30 disabled:from-gray-400/10 disabled:to-gray-500/10 text-green-700 disabled:text-gray-400 rounded-xl font-medium transition-all duration-200 hover:scale-[1.02] shadow-lg backdrop-blur-sm border border-green-500/20 disabled:cursor-not-allowed"
            >
              {creating ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                'Create Listing'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
