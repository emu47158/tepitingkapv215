import React, { useState, useEffect } from 'react'
import { Camera, Edit3, MapPin, Globe, Calendar, Package, Grid, List } from 'lucide-react'
import { Profile as ProfileType, updateProfile, getUserMarketplaceItems, MarketplaceItem } from '../lib/supabase'
import { formatDistanceToNow } from 'date-fns'

interface ProfileProps {
  user: any
  profile: ProfileType
}

export function Profile({ user, profile }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState(profile)
  const [userItems, setUserItems] = useState<MarketplaceItem[]>([])
  const [loading, setLoading] = useState(false)
  const [itemsLoading, setItemsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'listings' | 'activity'>('listings')

  useEffect(() => {
    loadUserItems()
  }, [profile.id])

  const loadUserItems = async () => {
    setItemsLoading(true)
    const items = await getUserMarketplaceItems(profile.id)
    setUserItems(items)
    setItemsLoading(false)
  }

  const handleSave = async () => {
    setLoading(true)
    const updated = await updateProfile(profile.id, editedProfile)
    if (updated) {
      setIsEditing(false)
      // Note: In a real app, you'd update the parent component's profile state
    }
    setLoading(false)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(price)
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:space-x-8">
            {/* Avatar */}
            <div className="relative mb-6 md:mb-0">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-4xl">
                  {profile.display_name?.charAt(0).toUpperCase() || profile.full_name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <Camera className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editedProfile.full_name || ''}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                    <input
                      type="text"
                      value={editedProfile.display_name || ''}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, display_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      value={editedProfile.bio || ''}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={editedProfile.location || ''}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="City, Country"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                      type="url"
                      value={editedProfile.website || ''}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, website: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false)
                        setEditedProfile(profile)
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">
                        {profile.full_name || 'Anonymous User'}
                      </h1>
                      <p className="text-lg text-gray-600">@{profile.display_name || 'user'}</p>
                    </div>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </button>
                  </div>

                  {profile.bio && (
                    <p className="text-gray-700 mb-4">{profile.bio}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    {profile.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    {profile.website && (
                      <div className="flex items-center space-x-1">
                        <Globe className="w-4 h-4" />
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-700"
                        >
                          Website
                        </a>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('listings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'listings'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4" />
                  <span>Listings ({userItems.length})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'activity'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Activity
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'listings' ? (
              <div>
                {itemsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="w-full h-48 bg-gray-300 rounded-lg mb-4"></div>
                        <div className="h-4 bg-gray-300 rounded mb-2"></div>
                        <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : userItems.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No listings yet</h3>
                    <p className="text-gray-500">Start selling items to see them here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userItems.map((item) => (
                      <div key={item.id} className="group cursor-pointer">
                        <div className="relative">
                          <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                            {item.images && item.images.length > 0 ? (
                              <img
                                src={item.images[0]}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Package className="w-12 h-12" />
                              </div>
                            )}
                          </div>
                          <div className="absolute top-3 right-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              item.is_sold 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {item.is_sold ? 'Sold' : 'Available'}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4">
                          <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-xl font-bold text-blue-600 mt-1">{formatPrice(item.price)}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
                <p className="text-gray-500">User activity will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
