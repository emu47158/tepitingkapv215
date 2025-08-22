import React, { useState, useEffect } from 'react'
import { Search, Filter, Package, Star, MapPin, Clock, Eye, Heart } from 'lucide-react'
import { supabase, MarketplaceItem, hasValidSupabaseConfig } from '../lib/supabase'
import { formatDistanceToNow } from 'date-fns'

interface BrowseItemsProps {
  onItemClick: (item: MarketplaceItem) => void
}

export function BrowseItems({ onItemClick }: BrowseItemsProps) {
  const [items, setItems] = useState<MarketplaceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCondition, setSelectedCondition] = useState('')
  const [error, setError] = useState<string | null>(null)

  const categories = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Toys', 'Other']
  const conditions = ['New', 'Like New', 'Good', 'Fair', 'Poor']

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔍 BrowseItems: Loading marketplace items...')

      if (!hasValidSupabaseConfig()) {
        console.log('📝 BrowseItems: Using demo data (Supabase not configured)')
        // Demo data when Supabase is not configured
        const demoItems: MarketplaceItem[] = [
          {
            id: 'demo-1',
            title: 'MacBook Pro 14" M3',
            description: 'Excellent condition MacBook Pro with M3 chip. Perfect for developers and creative professionals.',
            price: 1899.99,
            category: 'Electronics',
            condition: 'Like New',
            images: ['https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg?auto=compress&cs=tinysrgb&w=800'],
            location: 'Jakarta',
            seller_id: 'demo-seller-1',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            is_available: true,
            profiles: {
              id: 'demo-seller-1',
              full_name: 'Tech Seller',
              display_name: 'techseller',
              email: 'tech@example.com',
              avatar_url: null,
              bio: 'Selling quality tech items',
              website: null,
              location: 'Jakarta',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          },
          {
            id: 'demo-2',
            title: 'Vintage Leather Jacket',
            description: 'Authentic vintage leather jacket from the 80s. Great condition with unique character.',
            price: 299.99,
            category: 'Clothing',
            condition: 'Good',
            images: ['https://images.pexels.com/photos/1124465/pexels-photo-1124465.jpeg?auto=compress&cs=tinysrgb&w=800'],
            location: 'Bandung',
            seller_id: 'demo-seller-2',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
            updated_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
            is_available: true,
            profiles: {
              id: 'demo-seller-2',
              full_name: 'Fashion Lover',
              display_name: 'fashionista',
              email: 'fashion@example.com',
              avatar_url: null,
              bio: 'Vintage fashion enthusiast',
              website: null,
              location: 'Bandung',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          },
          {
            id: 'demo-3',
            title: 'Programming Books Collection',
            description: 'Collection of essential programming books including Clean Code, Design Patterns, and more.',
            price: 150.00,
            category: 'Books',
            condition: 'Good',
            images: ['https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=800'],
            location: 'Surabaya',
            seller_id: 'demo-seller-3',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
            updated_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
            is_available: true,
            profiles: {
              id: 'demo-seller-3',
              full_name: 'Code Master',
              display_name: 'codemaster',
              email: 'code@example.com',
              avatar_url: null,
              bio: 'Software developer and book collector',
              website: null,
              location: 'Surabaya',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          }
        ]
        
        setItems(demoItems)
        console.log('✅ BrowseItems: Demo data loaded:', demoItems.length, 'items')
        setLoading(false)
        return
      }

      console.log('🔗 BrowseItems: Fetching from Supabase...')
      const { data, error } = await supabase
        .from('marketplace_items')
        .select(`
          *,
          profiles!marketplace_items_seller_id_fkey (
            id,
            full_name,
            display_name,
            avatar_url,
            location
          )
        `)
        .eq('is_available', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ BrowseItems: Error fetching marketplace items:', error)
        console.error('Error details:', error.message, error.details, error.hint)
        setError(`Failed to load items: ${error.message}`)
        setItems([])
      } else {
        console.log('✅ BrowseItems: Loaded items:', data?.length || 0)
        setItems(data || [])
      }
    } catch (error) {
      console.error('❌ BrowseItems: Unexpected error:', error)
      setError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || item.category === selectedCategory
    const matchesCondition = !selectedCondition || item.condition === selectedCondition
    
    return matchesSearch && matchesCategory && matchesCondition
  })

  console.log('📊 BrowseItems Debug Info:')
  console.log('Total items loaded:', items.length)
  console.log('Filtered items:', filteredItems.length)
  console.log('Search term:', `"${searchTerm}"`)
  console.log('Selected category:', `"${selectedCategory}"`)
  console.log('Selected condition:', `"${selectedCondition}"`)

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-200 h-64 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Debug Info */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Debug Info:</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <div>Total items loaded: {items.length}</div>
          <div>Filtered items: {filteredItems.length}</div>
          <div>Search term: "{searchTerm}"</div>
          <div>Selected category: "{selectedCategory}"</div>
          <div>Selected condition: "{selectedCondition}"</div>
          {error && <div className="text-red-600">Error: {error}</div>}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Conditions</option>
            {conditions.map(condition => (
              <option key={condition} value={condition}>{condition}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Items Grid */}
      {error ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Items</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadItems}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onItemClick(item)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            >
              {/* Item Image */}
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
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
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                
                {/* Condition Badge */}
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 rounded-full">
                    {item.condition}
                  </span>
                </div>
              </div>

              {/* Item Details */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{item.title}</h3>
                <p className="text-2xl font-bold text-blue-600 mb-2">
                  Rp {item.price.toLocaleString('id-ID')}
                </p>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{item.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                  </div>
                </div>

                {/* Seller Info */}
                <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-100">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {item.profiles?.display_name?.charAt(0).toUpperCase() || 
                       item.profiles?.full_name?.charAt(0).toUpperCase() || 'S'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {item.profiles?.display_name || item.profiles?.full_name || 'Seller'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
