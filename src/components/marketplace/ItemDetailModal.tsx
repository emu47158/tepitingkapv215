import React from 'react'
import { X, MessageCircle, MapPin, Calendar, Tag, Package } from 'lucide-react'
import { MarketplaceItem, Profile } from '../../lib/supabase'
import { formatDistanceToNow } from 'date-fns'

interface ItemDetailModalProps {
  item: MarketplaceItem
  currentUser: Profile
  onClose: () => void
}

export function ItemDetailModal({ item, currentUser, onClose }: ItemDetailModalProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(price)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleContactSeller = () => {
    // This would typically open a chat modal or redirect to messages
    alert('Contact seller functionality would be implemented here')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Item Details</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Images */}
          {item.images && item.images.length > 0 && (
            <div className="mb-6">
              <div className="grid grid-cols-1 gap-4">
                {item.images.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`${item.title} - Image ${index + 1}`}
                    className="w-full h-64 object-cover rounded-lg border border-gray-200"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Title and Price */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{item.title}</h1>
            <p className="text-3xl font-bold text-blue-600">{formatPrice(item.price)}</p>
          </div>

          {/* Item Details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Tag className="w-4 h-4" />
              <span className="capitalize">{item.category}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="w-4 h-4 bg-gray-400 rounded-full"></span>
              <span className="capitalize">{item.condition.replace('-', ' ')}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
            </div>
            {item.profiles?.location && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{item.profiles.location}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {item.description && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{item.description}</p>
            </div>
          )}

          {/* Seller Info */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Seller Information</h3>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                {item.profiles?.avatar_url ? (
                  <img
                    src={item.profiles.avatar_url}
                    alt={item.profiles.full_name || item.profiles.display_name || 'User'}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(item.profiles?.full_name || item.profiles?.display_name || 'User')
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {item.profiles?.full_name || item.profiles?.display_name || 'Anonymous User'}
                </p>
                {item.profiles?.bio && (
                  <p className="text-sm text-gray-600">{item.profiles.bio}</p>
                )}
              </div>
            </div>

            {/* Contact Button */}
            {item.seller_id !== currentUser.id && (
              <button
                onClick={handleContactSeller}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Contact Seller</span>
              </button>
            )}

            {item.seller_id === currentUser.id && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 text-center">This is your listing</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
