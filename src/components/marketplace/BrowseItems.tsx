import React, { useState, useEffect } from 'react'
import { Search, Filter, Grid, List, Eye, MessageCircle, Package, MapPin, Clock } from 'lucide-react'
import { supabase, MarketplaceItem, Profile, hasValidSupabaseConfig } from '../../lib/supabase'
import { ItemDetailModal } from './ItemDetailModal'
import { ChatModal } from './ChatModal'
import { formatDistanceToNow } from 'date-fns'

interface BrowseItemsProps {
  currentUser: Profile
}

export function BrowseItems({ currentUser }: BrowseItemsProps) {
  const [items, setItems] = useState<MarketplaceItem[]>([])
  const [filteredItems, setFilteredItems] = useState<MarketplaceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCondition, setSelectedCondition] = useState('')
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [chatItem, setChatItem] = useState<MarketplaceItem | null>(null)

  const categories = ['Electronics', 'Clothing', 'Books', 'Furniture', 'Sports', 'Other']
  const conditions = ['New', 'Like New', 'Good', 'Fair', 'Poor']

  useEffect(() => {
    loadItems()
  }, [])

  useEffect(() => {
    filterItems()
  }, [items, searchTerm, selectedCategory, selectedCondition])

  const loadItems = async () => {
    setLoading(true)
    setError(null)
    
    try {
      if (!hasValidSupabaseConfig()) {
        // Demo data when Supabase is not configured
        const demoItems: MarketplaceItem[] = [
          {
            id: 'demo-1',
            seller_id: 'demo-seller-1',
            title: 'MacBook Pro 14" M3',
            description: 'Excellent condition MacBook Pro with M3 chip. Perfect for developers and creative professionals. Includes original charger and box.',
            price: 2500000,
            category: 'Electronics',
            condition: 'Like New',
            images: ['https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg?auto=compress&cs=tinysrgb&w=800'],
            is_sold: false,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            profiles: {
              id: 'demo-seller-1',
              full_name: 'Tech Seller',
              display_name: 'techseller',
              email: 'tech@example.com',
              avatar_url: null,
              bio: 'Selling quality tech items',
              website: null,
              location: 'Seoul',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          },
          {
            id: 'demo-2',
            seller_id: 'demo-seller-2',
            title: 'Vintage Leather Jacket',
            description: 'Authentic vintage leather jacket from the 80s. Great condition with unique character. Size M.',
            price: 150000,
            category: 'Clothing',
            condition: 'Good',
            images: ['https://images.pexels.com/photos/1124465/pexels-photo-1124465.jpeg?auto=compress&cs=tinysrgb&w=800'],
            is_sold: false,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
            updated_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
            profiles: {
              id: 'demo-seller-2',
              full_name: 'Fashion Lover',
              display_name: 'fashionista',
              email: 'fashion@example.com',
              avatar_url: null,
              bio: 'Vintage fashion enthusiast',
              website: null,
              location: 'Busan',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          },
          {
            id: 'demo-3',
            seller_id: 'demo-seller-3',
            title: 'Programming Books Collection',
            description: 'Collection of essential programming books including Clean Code, Design Patterns, and more. Perfect for developers.',
            price: 75000,
            category: 'Books',
            condition: 'Good',
            images: ['https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=800'],
            is_sold: false,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
            updated_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
            profiles: {
              id: 'demo-seller-3',
              full_name: 'Code Master',
              display_name: 'codemaster',
              email: 'code@example.com',
              avatar_url: null,
              bio: 'Software developer and book collector',
              website: null,
              location: 'Incheon',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          },
          {
            id: 'demo-4',
            seller_id: 'demo-seller-4',
            title: 'Gaming Chair - Ergonomic',
            description: 'High-quality gaming chair with lumbar support. Very comfortable for long gaming or work sessions.',
            price: 250000,
            category: 'Furniture',
            condition: 'New',
            images: ['https://images.pexels.com/photos/4050315/pexels-photo-4050315.jpeg?auto=compress&cs=tinysrgb&w=800'],
            is_sold: false,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
            updated_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
            profiles: {
              id: 'demo-seller-4',
              full_name: 'Gamer Pro',
              display_name: 'gamerpro',
              email: 'gamer@example.com',
              avatar_url: null,
              bio: 'Gaming enthusiast',
              website: null,
              location: 'Daegu',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          },
          {
            id: 'demo-5',
            seller_id: 'demo-seller-5',
            title: 'Tennis Racket - Wilson Pro',
            description: 'Professional tennis racket in excellent condition. Perfect weight and balance for competitive play.',
            price: 120000,
            category: 'Sports',
            condition: 'Like New',
            images: ['https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=800'],
            is_sold: false,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
            updated_at: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
            profiles: {
              id: 'demo-seller-5',
              full_name: 'Sports Fan',
              display_name: 'sportsfan',
              email: 'sports@example.com',
              avatar_url: null,
              bio: 'Sports equipment collector',
              website: null,
              location: 'Gwangju',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          }
        ]
        
        setItems(demoItems)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('marketplace_items')
        .select(`
          *,
          profiles!marketplace_items_seller_id_fkey (
            id,
            full_name,
            display_name,
            avatar_url
          )
        `)
        .eq('is_sold', false)
        .order('created_at', { ascending: false })

      if (error) {
        setError(`Failed to load items: ${error.message}`)
        setItems([])
      } else {
        setItems(data || [])
      }
    } catch (err) {
      setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const filterItems = () => {
    let filtered = items

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    if (selectedCondition) {
      filtered = filtered.filter(item => item.condition === selectedCondition)
    }

    setFilteredItems(filtered)
  }

  const handleContactSeller = (item: MarketplaceItem) => {
    setChatItem(item)
    setShowChat(true)
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

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading items...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Items</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadItems}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Conditions</option>
            {conditions.map(condition => (
              <option key={condition} value={condition}>{condition}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Items Display */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Items Found</h3>
          <p className="text-gray-600">
            {items.length === 0 
              ? "No items available at the moment." 
              : "Try adjusting your search or filters."}
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'space-y-4'
        }>
          {filteredItems.map(item => (
            <div
              key={item.id}
              className={`bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${
                viewMode === 'list' ? 'flex' : ''
              }`}
              onClick={() => setSelectedItem(item)}
            >
              <div className={`${viewMode === 'list' ? 'w-48 h-32' : 'aspect-square'} bg-gray-100 relative`}>
                {item.images && item.images.length > 0 ? (
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTQwQzEyMi4wOTEgMTQwIDE0MCAxMjIuMDkxIDE0MCAxMDBDMTQwIDc3LjkwODYgMTIyLjA5MSA2MCAxMDAgNjBDNzcuOTA4NiA2MCA2MCA3Ny45MDg2IDYwIDEwMEM2MCAxMjIuMDkxIDc3LjkwODYgMTQwIDEwMCAxNDBaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iNCIvPgo8L3N2Zz4K'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Eye className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-600">
                  {item.condition}
                </div>
              </div>
              
              <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{item.title}</h3>
                  {viewMode === 'list' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleContactSeller(item)
                      }}
                      className="ml-2 p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                <p className="text-2xl font-bold text-blue-600 mb-2">
                  {formatPrice(item.price)}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                  <span className="bg-gray-100 px-2 py-1 rounded-full">{item.category}</span>
                  <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                </div>
                
                {viewMode === 'list' && (
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.description}</p>
                )}

                {/* Seller Info */}
                <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {getInitials(item.profiles?.display_name || item.profiles?.full_name || 'User')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 truncate">
                      {item.profiles?.display_name || item.profiles?.full_name || 'Anonymous User'}
                    </p>
                    {item.profiles?.location && (
                      <div className="flex items-center text-xs text-gray-500">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span>{item.profiles.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          currentUser={currentUser}
          onClose={() => setSelectedItem(null)}
          onContactSeller={handleContactSeller}
        />
      )}

      {/* Chat Modal */}
      {showChat && chatItem && (
        <ChatModal
          item={chatItem}
          currentUser={currentUser}
          onClose={() => {
            setShowChat(false)
            setChatItem(null)
          }}
        />
      )}
    </div>
  )
}
