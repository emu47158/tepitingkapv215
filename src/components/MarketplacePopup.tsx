import React, { useState } from 'react'
import { X, ShoppingBag, Plus, Package } from 'lucide-react'
import { Profile } from '../lib/supabase'
import { BrowseItems } from './marketplace/BrowseItems'
import { SellItems } from './marketplace/SellItems'
import { MyItems } from './marketplace/MyItems'

interface MarketplacePopupProps {
  onClose: () => void
  currentUser: Profile
}

export function MarketplacePopup({ onClose, currentUser }: MarketplacePopupProps) {
  const [activeTab, setActiveTab] = useState<'browse' | 'sell' | 'my-items'>('browse')

  const tabs = [
    { id: 'browse', label: 'Browse', icon: ShoppingBag },
    { id: 'sell', label: 'Sell', icon: Plus },
    { id: 'my-items', label: 'My Items', icon: Package }
  ] as const

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <ShoppingBag className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">SijangKu</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'browse' && (
            <div className="h-full overflow-y-auto">
              <BrowseItems currentUser={currentUser} />
            </div>
          )}
          
          {activeTab === 'sell' && (
            <div className="h-full overflow-y-auto">
              <SellItems currentUser={currentUser} />
            </div>
          )}
          
          {activeTab === 'my-items' && (
            <div className="h-full overflow-y-auto">
              <MyItems currentUser={currentUser} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
