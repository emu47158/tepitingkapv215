import React, { useState } from 'react'
import { X, Send, MessageCircle, User, Package } from 'lucide-react'
import { MarketplaceItem } from '../lib/supabase'
import { sendMessageToSeller } from '../lib/supabase'

interface ContactSellerPopupProps {
  item: MarketplaceItem
  onClose: () => void
  onMessageSent: () => void
}

export function ContactSellerPopup({ item, onClose, onMessageSent }: ContactSellerPopupProps) {
  const [message, setMessage] = useState('')
  const [subject, setSubject] = useState(`Interested in: ${item.title}`)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(price)
  }

  const handleSendMessage = async () => {
    if (!message.trim() || !subject.trim()) {
      setError('Please fill in both subject and message')
      return
    }

    setSending(true)
    setError(null)
    
    try {
      console.log('Sending message to seller:', {
        recipientId: item.seller_id,
        marketplaceItemId: item.id,
        subject: subject.trim(),
        content: message.trim()
      })

      const success = await sendMessageToSeller({
        recipientId: item.seller_id,
        marketplaceItemId: item.id,
        subject: subject.trim(),
        content: message.trim()
      })

      if (success) {
        console.log('Message sent successfully')
        onMessageSent()
        onClose()
      } else {
        setError('Failed to send message. Please try again.')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setError('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="backdrop-blur-xl bg-white/90 border border-white/30 rounded-3xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-xl">
              <MessageCircle className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Contact Seller</h3>
              <p className="text-sm text-gray-600">Send a message about this item</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Item Summary */}
          <div className="flex items-center space-x-4 p-4 bg-white/20 rounded-2xl border border-white/20">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
              {item.images && item.images.length > 0 ? (
                <img
                  src={item.images[0]}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Package className="w-6 h-6" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-800 truncate">{item.title}</h4>
              <p className="text-lg font-bold text-green-600">{formatPrice(item.price)}</p>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{item.profiles?.display_name || item.profiles?.full_name || 'Anonymous User'}</span>
              </div>
            </div>
          </div>

          {/* Message Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 bg-white/20 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                placeholder="What would you like to ask about?"
                disabled={sending}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 bg-white/20 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none"
                placeholder="Hi! I'm interested in your item. Is it still available? Can you tell me more about its condition?"
                disabled={sending}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-gray-500">
                  Be specific about your questions or offer
                </p>
                <span className="text-sm text-gray-500">
                  {message.length}/1000
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              disabled={sending}
              className="flex-1 py-3 bg-white/20 hover:bg-white/30 disabled:bg-white/10 text-gray-700 disabled:text-gray-400 rounded-xl font-medium transition-all duration-200 border border-white/20 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSendMessage}
              disabled={sending || !message.trim() || !subject.trim()}
              className="flex-1 py-3 bg-gradient-to-r from-blue-500/20 to-purple-600/20 hover:from-blue-500/30 hover:to-purple-600/30 disabled:from-gray-400/10 disabled:to-gray-500/10 text-blue-700 disabled:text-gray-400 rounded-xl font-medium transition-all duration-200 hover:scale-[1.02] shadow-lg backdrop-blur-sm border border-blue-500/20 disabled:cursor-not-allowed"
            >
              {sending ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Send className="w-5 h-5" />
                  <span>Send Message</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
