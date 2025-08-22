import React, { useState, useEffect } from 'react'
import { Edit, Trash2, Check, Eye } from 'lucide-react'
import { MarketplaceItem, Profile, getUserMarketplaceItems, updateMarketplaceItem, deleteMarketplaceItem } from '../../lib/supabase'
import { EditItemModal } from './EditItemModal'

interface MyItemsProps {
  currentUser: Profile
}

export function MyItems({ currentUser }: MyItemsProps) {
  const [items, setItems] = useState<MarketplaceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<MarketplaceItem | null>(null)

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    setLoading(true)
    const data = await getUserMarketplaceItems(currentUser.id)
    setItems(data)
    setLoading(false)
  }

  const handleMarkAsSold = async (item: MarketplaceItem) => {
    const updated = await updateMarketplaceItem(item.id, { is_sold: true })
    if (updated) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_sold: true } : i))
    }
  }

  const handleMarkAsAvailable = async (item: MarketplaceItem) => {
    const updated = await updateMarketplaceItem(item.id, { is_sold: false })
    if (updated) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_sold: false } : i))
    }
  }

  const handleDelete = async (item: MarketplaceItem) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    
    const success = await deleteMarketplaceItem(item.id)
    if (success) {
      setItems(prev => prev.filter(i => i.id !== item.id))
    }
  }

  const handleItemUpdated = (updatedItem: MarketplaceItem) => {
    setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i))
    setEditingItem(null)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(price)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your items...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">My Items</h3>
        <p className="text-gray-600">Manage your listed items</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No items listed yet</p>
          <p className="text-gray-400 text-sm mt-2">Start selling by listing your first item</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <div
              key={item.id}
              className={`bg-white border rounded-lg p-4 ${
                item.is_sold ? 'border-gray-200 bg-gray-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start space-x-4">
                {/* Image */}
                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
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
                      <Eye className="w-6 h-6" />
                      <span className="sr-only">No image</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className={`font-semibold ${item.is_sold ? 'text-gray-500' : 'text-gray-900'}`}>
                        {item.title}
                        {item.is_sold && (
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Sold
                          </span>
                        )}
                      </h4>
                      <p className={`text-lg font-bold mt-1 ${item.is_sold ? 'text-gray-500' : 'text-blue-600'}`}>
                        {formatPrice(item.price)}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span className="bg-gray-100 px-2 py-1 rounded-full">{item.category}</span>
                        <span className="bg-gray-100 px-2 py-1 rounded-full">{item.condition}</span>
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                      {item.description && (
                        <p className={`mt-2 text-sm ${item.is_sold ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Edit item"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      {item.is_sold ? (
                        <button
                          onClick={() => handleMarkAsAvailable(item)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                          title="Mark as available"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMarkAsSold(item)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                          title="Mark as sold"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onItemUpdated={handleItemUpdated}
        />
      )}
    </div>
  )
}
