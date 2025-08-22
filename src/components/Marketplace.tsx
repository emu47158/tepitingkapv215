import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Grid, List, Package, Heart, MessageCircle } from 'lucide-react'
import { Profile, hasValidSupabaseConfig } from '../lib/supabase'
import { useApiMarketplace } from '../hooks/useApi'
import { CreateListingModal } from './marketplace/CreateListingModal'
import { ItemDetailModal } from './marketplace/ItemDetailModal'
import { formatDistanceToNow } from 'date-fns'

interface MarketplaceProps {
  currentUser: Profile
}

// Demo data for when Supabase is not configured
const demoMarketplaceItems = [
  {
    id: '1',
    seller_id: 'demo-user-123',
    title: 'iPhone 14 Pro - Like New',
    description: 'Barely used iPhone 14 Pro in excellent condition. Comes with original box and charger.',
    price: 800000,
    category: 'electronics',
    condition: 'like-new',
    images: ['https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=800'],
    is_sold: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    profiles: {
      id: 'demo-user-123',
      username: 'techseller',
      full_name: 'Tech Seller',
      avatar_url: null
    }
  },
  {
    id: '2',
    seller_id: 'demo-user-456',
    title: 'Vintage Leather Jacket',
    description: 'Authentic vintage leather jacket from the 80s. Perfect for collectors or fashion enthusiasts.',
    price: 150000,
    category: 'clothing',
    condition: 'good',
    images: ['https://images.pexels.com/photos/1124465/pexels-photo-1124465.jpeg?auto=compress&cs=tinysrgb&w=800'],
    is_sold: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    profiles: {
      id: 'demo-user-456',
      username: 'vintagefinder',
      full_name: 'Vintage Finder',
      avatar_url: null
    }
  }
]

export function Marketplace({ currentUser }: MarketplaceProps) {
  const { items, loading, error, loadItems, createItem, isReady } = useApiMarketplace()
  const [localItems, setLocalItems] = useState(demoMarketplaceItems)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  const categories = [
    'all',
    'electronics',
    'clothing',
    'home',
    'books',
    'sports',
    'automotive',
    'other'
  ]

  useEffect(() => {
    if (hasValidSupabaseConfig() && isReady) {
      loadItems()
    }
  }, [isReady])

  const displayItems = hasValidSupabaseConfig() ? items : localItems
  const isLoading = hasValidSupabaseConfig() ? loading : false

  const filteredItems = displayItems.filter((item: any) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(price)
  }

  const handleItemCreated = async (itemData: any) => {
    if (hasValidSupabaseConfig() && isReady) {
      const newItem = await createItem(itemData)
      if (newItem) {
        setShowCreateModal(false)
      }
    } else {
      // Demo mode
      const newItem = {
        id: Date.now().toString(),
        ...itemData,
        seller_id: currentUser.id,
        is_sold: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profiles: currentUser
      }
      setLocalItems(prev => [newItem, ...prev])
      setShowCreateModal(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm animate-pulse">
                <div className="w-full h-48 bg-gray-300 rounded-t-2xl"></div>
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-5 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SijangKu</h1>
          <p className="text-gray-600">Buy and sell items in your community</p>
        </div>

        {/* Controls */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Sell Item</span>
              </button>
            </div>
          </div>
        </div>

        {/* Items Grid/List */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Be the first to list an item for sale!'
              }
            </p>
            {!searchTerm && selectedCategory === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>List Your First Item</span>
              </button>
            )}
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {filteredItems.map((item: any) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer ${
                  viewMode === 'list' ? 'flex items-center space-x-4 p-4' : ''
                }`}
              >
                {viewMode === 'grid' ? (
                  <>
                    <div className="relative">
                      <div className="w-full h-48 bg-gray-100 rounded-t-2xl overflow-hidden">
                        {item.images && item.images.length > 0 ? (
                          <img
                            src={item.images[0]}
                            alt={item.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package className="w-12 h-12" />
                          </div>
                        )}
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          item.condition === 'new' ? 'bg-green-100 text-green-800' :
                          item.condition === 'like-new' ? 'bg-blue-100 text-blue-800' :
                          item.condition === 'good' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.condition}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{item.title}</h3>
                      <p className="text-2xl font-bold text-blue-600 mb-2">{formatPrice(item.price)}</p>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <span>{item.profiles?.full_name || 'Anonymous'}</span>
                        </div>
                        <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                          <p className="text-xl font-bold text-blue-600 mt-1">{formatPrice(item.price)}</p>
                          <p className="text-gray-600 text-sm mt-1 line-clamp-2">{item.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>{item.profiles?.full_name || 'Anonymous'}</span>
                            <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              item.condition === 'new' ? 'bg-green-100 text-green-800' :
                              item.condition === 'like-new' ? 'bg-blue-100 text-blue-800' :
                              item.condition === 'good' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.condition}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Listing Modal */}
      {showCreateModal && (
        <CreateListingModal
          currentUser={currentUser}
          onClose={() => setShowCreateModal(false)}
          onItemCreated={handleItemCreated}
        />
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          currentUser={currentUser}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  )
}
