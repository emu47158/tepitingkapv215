import React, { useState, useEffect } from 'react'
import { X, Search, Send, Package, User, MessageCircle, Clock } from 'lucide-react'
import { supabase, Profile, hasValidSupabaseConfig } from '../lib/supabase'

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  receiver_id: string
  content: string
  item_id?: string
  created_at: string
  read_at?: string
  sender_profile?: Profile
  receiver_profile?: Profile
  marketplace_item?: {
    id: string
    title: string
    price: number
    images: string[]
  }
}

interface Conversation {
  id: string
  other_user: Profile
  last_message: Message
  unread_count: number
  marketplace_item?: {
    id: string
    title: string
    price: number
    images: string[]
  }
}

interface MessagesPopupProps {
  currentUser: Profile
  onClose: () => void
}

export function MessagesPopup({ currentUser, onClose }: MessagesPopupProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    console.log('🔍 MessagesPopup useEffect triggered with currentUser:', currentUser?.id)
    if (currentUser?.id) {
      loadConversations()
    }
  }, [currentUser?.id])

  const formatDistanceToNow = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  const loadConversations = async () => {
    try {
      console.log('🔍 Loading conversations for user:', currentUser.id)
      setLoading(true)
      setError(null)

      if (!hasValidSupabaseConfig()) {
        console.log('🔍 Using demo conversations')
        // Demo conversations when Supabase is not configured
        const demoConversations: Conversation[] = [
          {
            id: 'conv-1',
            other_user: {
              id: 'demo-user-1',
              full_name: 'Tech Seller',
              display_name: 'techseller',
              email: 'tech@example.com',
              avatar_url: null,
              bio: 'Selling quality tech items',
              website: null,
              location: 'Jakarta',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            last_message: {
              id: 'msg-1',
              conversation_id: 'conv-1',
              sender_id: 'demo-user-1',
              receiver_id: currentUser.id,
              content: 'Hi! Is the MacBook Pro still available? I\'m very interested.',
              item_id: 'demo-item-1',
              created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
              read_at: undefined
            },
            unread_count: 2,
            marketplace_item: {
              id: 'demo-item-1',
              title: 'MacBook Pro 14" M3',
              price: 1899.99,
              images: ['https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg?auto=compress&cs=tinysrgb&w=800']
            }
          }
        ]
        
        setConversations(demoConversations)
        console.log('🔍 Demo conversations loaded:', demoConversations.length)
        setLoading(false)
        return
      }

      // Fetch all messages for the current user
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          sender_profile:profiles!messages_sender_id_fkey (
            id,
            full_name,
            display_name,
            avatar_url,
            email
          ),
          receiver_profile:profiles!messages_receiver_id_fkey (
            id,
            full_name,
            display_name,
            avatar_url,
            email
          ),
          marketplace_item:marketplace_items!messages_item_id_fkey (
            id,
            title,
            price,
            images
          )
        `)
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false })

      if (messagesError) {
        console.error('🔍 Error fetching messages:', messagesError)
        setError(`Failed to load conversations: ${messagesError.message}`)
        setConversations([])
      } else {
        console.log('🔍 Raw messages data:', messagesData)
        
        // Group messages into conversations
        const conversationMap = new Map<string, Conversation>()
        
        messagesData?.forEach((message: any) => {
          const otherUserId = message.sender_id === currentUser.id ? message.receiver_id : message.sender_id
          const otherUser = message.sender_id === currentUser.id ? message.receiver_profile : message.sender_profile
          
          console.log('🔍 Processing message:', {
            messageId: message.id,
            otherUserId,
            otherUser: otherUser?.full_name || otherUser?.display_name,
            conversationId: message.conversation_id
          })
          
          if (!conversationMap.has(otherUserId)) {
            conversationMap.set(otherUserId, {
              id: message.conversation_id,
              other_user: otherUser,
              last_message: message,
              unread_count: 0,
              marketplace_item: message.marketplace_item
            })
          }
          
          const conversation = conversationMap.get(otherUserId)!
          if (new Date(message.created_at) > new Date(conversation.last_message.created_at)) {
            conversation.last_message = message
            conversation.marketplace_item = message.marketplace_item
          }
          
          if (!message.read_at && message.receiver_id === currentUser.id) {
            conversation.unread_count++
          }
        })
        
        const conversationsList = Array.from(conversationMap.values())
        console.log('🔍 Processed conversations:', conversationsList.length, conversationsList)
        setConversations(conversationsList)
      }
    } catch (error) {
      console.error('🔍 Error in loadConversations:', error)
      setError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (conversation: Conversation) => {
    try {
      console.log('🔍 Loading messages for conversation:', conversation.id)
      
      if (!hasValidSupabaseConfig()) {
        // Demo messages
        const demoMessages: Message[] = [
          {
            id: 'msg-1',
            conversation_id: conversation.id,
            sender_id: conversation.other_user.id,
            receiver_id: currentUser.id,
            content: 'Hi! Is this item still available? I\'m very interested.',
            item_id: conversation.marketplace_item?.id,
            created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            read_at: new Date().toISOString(),
            sender_profile: conversation.other_user
          },
          {
            id: 'msg-2',
            conversation_id: conversation.id,
            sender_id: currentUser.id,
            receiver_id: conversation.other_user.id,
            content: 'Yes, it\'s still available! Would you like to know more details?',
            item_id: conversation.marketplace_item?.id,
            created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
            read_at: new Date().toISOString(),
            sender_profile: currentUser
          },
          conversation.last_message
        ]
        setMessages(demoMessages)
        return
      }

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender_profile:profiles!messages_sender_id_fkey (
            id,
            full_name,
            display_name,
            avatar_url
          )
        `)
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading messages:', error)
      } else {
        console.log('🔍 Loaded messages for conversation:', data?.length)
        setMessages(data || [])
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      if (!hasValidSupabaseConfig()) {
        // Demo mode - just add to local state
        const demoMessage: Message = {
          id: `msg-${Date.now()}`,
          conversation_id: selectedConversation.id,
          sender_id: currentUser.id,
          receiver_id: selectedConversation.other_user.id,
          content: newMessage.trim(),
          item_id: selectedConversation.marketplace_item?.id,
          created_at: new Date().toISOString(),
          read_at: undefined,
          sender_profile: currentUser
        }
        setMessages(prev => [...prev, demoMessage])
        setNewMessage('')
        return
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: currentUser.id,
          receiver_id: selectedConversation.other_user.id,
          content: newMessage.trim(),
          item_id: selectedConversation.marketplace_item?.id
        })

      if (error) {
        console.error('Error sending message:', error)
      } else {
        setNewMessage('')
        loadMessages(selectedConversation)
        loadConversations()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.other_user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.other_user?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.last_message?.content?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  console.log('🔍 MessagesPopup rendering with:', {
    loading,
    error,
    conversationsCount: conversations.length,
    filteredCount: filteredConversations.length,
    currentUser: currentUser?.id
  })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-purple-500" />
                Messages
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <div className="text-red-500 mb-2 text-sm">{error}</div>
                <button
                  onClick={loadConversations}
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  Try again
                </button>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm">
                  {conversations.length === 0 ? 'No conversations yet' : 'No conversations found'}
                </p>
                {conversations.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    Start by contacting a seller in SijangKu
                  </p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => {
                      setSelectedConversation(conversation)
                      loadMessages(conversation)
                    }}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedConversation?.id === conversation.id ? 'bg-purple-50 border-r-2 border-purple-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {conversation.other_user?.avatar_url ? (
                          <img
                            src={conversation.other_user.avatar_url}
                            alt={conversation.other_user.full_name || conversation.other_user.display_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {conversation.other_user?.full_name || conversation.other_user?.display_name || 'Unknown User'}
                          </h3>
                          <div className="flex items-center space-x-1">
                            {conversation.unread_count > 0 && (
                              <span className="bg-purple-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] text-center">
                                {conversation.unread_count}
                              </span>
                            )}
                            <span className="text-xs text-gray-500 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatDistanceToNow(new Date(conversation.last_message.created_at))}
                            </span>
                          </div>
                        </div>
                        
                        {conversation.marketplace_item && (
                          <div className="flex items-center space-x-2 mb-1">
                            <Package className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-600 truncate">
                              {conversation.marketplace_item.title}
                            </span>
                          </div>
                        )}
                        
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.last_message.sender_id === currentUser.id ? 'You: ' : ''}
                          {conversation.last_message.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {selectedConversation.other_user?.avatar_url ? (
                      <img
                        src={selectedConversation.other_user.avatar_url}
                        alt={selectedConversation.other_user.full_name || selectedConversation.other_user.display_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {selectedConversation.other_user?.full_name || selectedConversation.other_user?.display_name || 'Unknown User'}
                    </h3>
                    {selectedConversation.marketplace_item && (
                      <p className="text-sm text-gray-600 flex items-center">
                        <Package className="w-3 h-3 mr-1" />
                        {selectedConversation.marketplace_item.title} - ${selectedConversation.marketplace_item.price}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        message.sender_id === currentUser.id
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender_id === currentUser.id ? 'text-purple-100' : 'text-gray-500'
                      }`}>
                        {formatDistanceToNow(new Date(message.created_at))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Select a conversation</p>
                <p className="text-sm">Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
