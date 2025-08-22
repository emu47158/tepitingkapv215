import React, { useState, useEffect, useRef } from 'react'
import { X, Send, Package } from 'lucide-react'
import { MarketplaceItem, Profile, Message, getMessages, sendMessage } from '../../lib/supabase'
import { formatDistanceToNow } from 'date-fns'

interface ChatModalProps {
  item: MarketplaceItem
  currentUser: Profile
  onClose: () => void
}

export function ChatModal({ item, currentUser, onClose }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const otherUser = item.profiles
  const conversationId = [currentUser.id, item.seller_id].sort().join('-')

  useEffect(() => {
    loadMessages()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    setLoading(true)
    const data = await getMessages(conversationId)
    setMessages(data)
    setLoading(false)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    const message = await sendMessage({
      conversation_id: conversationId,
      sender_id: currentUser.id,
      receiver_id: item.seller_id,
      content: newMessage.trim(),
      item_id: item.id
    })

    if (message) {
      setMessages(prev => [...prev, message])
      setNewMessage('')
    }
    setSending(false)
  }

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
              {getInitials(otherUser.full_name || otherUser.display_name || 'User')}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                {otherUser.full_name || otherUser.display_name || 'Anonymous User'}
              </h2>
              <p className="text-sm text-gray-500">About: {item.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Item Info */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
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
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{item.title}</h3>
              <p className="text-lg font-bold text-blue-600">{formatPrice(item.price)}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            </div>
          ) : (
            messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender_id === currentUser.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender_id === currentUser.id ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
