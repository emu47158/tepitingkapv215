import React, { useState, useEffect } from 'react'
import { Users, Plus, Search, Crown, Shield, User } from 'lucide-react'
import { Profile, Community, getCommunities, joinCommunity, leaveCommunity, getUserCommunities } from '../lib/supabase'

interface CommunitiesProps {
  currentUser: Profile
}

export function Communities({ currentUser }: CommunitiesProps) {
  const [communities, setCommunities] = useState<Community[]>([])
  const [userCommunities, setUserCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'discover' | 'joined'>('discover')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [allCommunities, joinedCommunities] = await Promise.all([
      getCommunities(),
      getUserCommunities()
    ])
    setCommunities(allCommunities)
    setUserCommunities(joinedCommunities)
    setLoading(false)
  }

  const handleJoinCommunity = async (communityId: string) => {
    const success = await joinCommunity(communityId)
    if (success) {
      loadData()
    }
  }

  const handleLeaveCommunity = async (communityId: string) => {
    const success = await leaveCommunity(communityId)
    if (success) {
      loadData()
    }
  }

  const isUserMember = (communityId: string) => {
    return userCommunities.some(c => c.id === communityId)
  }

  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    community.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredUserCommunities = userCommunities.filter(community =>
    community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    community.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
                <div className="w-16 h-16 bg-gray-300 rounded-2xl mb-4"></div>
                <div className="h-6 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded mb-4"></div>
                <div className="h-10 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Communities</h1>
          <p className="text-gray-600">Discover and join amazing communities</p>
        </div>

        {/* Search and Tabs */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search communities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors">
              <Plus className="w-5 h-5" />
              <span>Create Community</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('discover')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'discover'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Discover
            </button>
            <button
              onClick={() => setActiveTab('joined')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'joined'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Joined ({userCommunities.length})
            </button>
          </div>
        </div>

        {/* Communities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === 'discover' ? (
            filteredCommunities.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No communities found</h3>
                <p className="text-gray-500">Try adjusting your search terms</p>
              </div>
            ) : (
              filteredCommunities.map((community) => (
                <div key={community.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                      <span className="text-white font-bold text-xl">
                        {community.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{community.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        <span>{community.member_count.toLocaleString()} members</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{community.description}</p>

                  <button
                    onClick={() => isUserMember(community.id) ? handleLeaveCommunity(community.id) : handleJoinCommunity(community.id)}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                      isUserMember(community.id)
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    {isUserMember(community.id) ? 'Leave' : 'Join'}
                  </button>
                </div>
              ))
            )
          ) : (
            filteredUserCommunities.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No joined communities</h3>
                <p className="text-gray-500 mb-4">Join some communities to see them here</p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Discover Communities</span>
                </button>
              </div>
            ) : (
              filteredUserCommunities.map((community) => (
                <div key={community.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                      <span className="text-white font-bold text-xl">
                        {community.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{community.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        <span>{community.member_count.toLocaleString()} members</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{community.description}</p>

                  <div className="flex space-x-2">
                    <button className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                      View
                    </button>
                    <button
                      onClick={() => handleLeaveCommunity(community.id)}
                      className="py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Leave
                    </button>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  )
}
