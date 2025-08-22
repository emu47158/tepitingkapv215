import React, { useState, useEffect } from 'react'
import { Users, Plus, ArrowRight, Search, AlertCircle } from 'lucide-react'
import { supabase, Profile, hasValidSupabaseConfig } from '../lib/supabase'

interface Community {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
  member_count?: number
}

interface CommunitiesViewProps {
  currentUser: Profile
  onShowCommunity: (communityId: string) => void
}

export function CommunitiesView({ currentUser, onShowCommunity }: CommunitiesViewProps) {
  const [communities, setCommunities] = useState<Community[]>([])
  const [userCommunities, setUserCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'joined' | 'discover'>('joined')

  useEffect(() => {
    loadCommunities()
  }, [])

  const loadCommunities = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!hasValidSupabaseConfig()) {
        // Demo data for when Supabase is not configured
        const demoCommunities = [
          {
            id: 'gmik',
            name: 'GMIK',
            description: 'GMIK Community - Connect with fellow members',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            member_count: 42
          },
          {
            id: 'programmer',
            name: 'Programmer',
            description: 'No Life Pipol - For developers and tech enthusiasts',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            member_count: 128
          },
          {
            id: 'design',
            name: 'Design Hub',
            description: 'Creative minds unite - Share your designs and get feedback',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            member_count: 67
          }
        ]
        
        // User is member of first two communities
        setUserCommunities(demoCommunities.slice(0, 2))
        setCommunities(demoCommunities)
        setLoading(false)
        return
      }

      // Load all communities
      const { data: allCommunities, error: communitiesError } = await supabase
        .from('communities')
        .select('*')
        .order('created_at', { ascending: false })

      if (communitiesError) {
        console.error('Error loading communities:', communitiesError)
        setError(`Failed to load communities: ${communitiesError.message}`)
        setLoading(false)
        return
      }

      // Load user's community memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('community_memberships')
        .select(`
          community_id,
          communities!inner(
            id,
            name,
            description,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', currentUser.id)

      if (membershipError) {
        console.error('Error loading user communities:', membershipError)
        setError(`Failed to load your communities: ${membershipError.message}`)
        setLoading(false)
        return
      }

      const joinedCommunities = memberships?.map(m => m.communities).filter(Boolean) || []
      
      setCommunities(allCommunities || [])
      setUserCommunities(joinedCommunities)
    } catch (error) {
      console.error('Error loading communities:', error)
      setError(`Failed to load communities: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinCommunity = async (communityId: string) => {
    if (!hasValidSupabaseConfig()) {
      // Demo mode - just show success message
      alert('Joined community! (Demo mode)')
      return
    }

    try {
      const { error } = await supabase
        .from('community_memberships')
        .insert([{
          user_id: currentUser.id,
          community_id: communityId
        }])

      if (error) {
        console.error('Error joining community:', error)
        alert('Failed to join community. Please try again.')
        return
      }

      // Reload communities to update the lists
      loadCommunities()
    } catch (error) {
      console.error('Error joining community:', error)
      alert('Failed to join community. Please try again.')
    }
  }

  const getCommunityInitial = (name: string) => {
    return name.charAt(0).toUpperCase()
  }

  const getCommunityColor = (name: string) => {
    const colors = [
      'from-blue-500 to-purple-500',
      'from-green-500 to-blue-500',
      'from-purple-500 to-pink-500',
      'from-orange-500 to-red-500',
      'from-teal-500 to-green-500',
      'from-indigo-500 to-purple-500',
      'from-pink-500 to-red-500',
      'from-yellow-500 to-orange-500',
    ]
    const index = name.length % colors.length
    return colors[index]
  }

  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const discoverCommunities = filteredCommunities.filter(
    community => !userCommunities.some(uc => uc.id === community.id)
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-white/20">
          <div className="max-w-lg mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-gray-900">Communities</h1>
          </div>
        </div>
        <div className="max-w-lg mx-auto p-4">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="animate-pulse flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-24"></div>
                    <div className="h-3 bg-gray-300 rounded w-32"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-white/20">
          <div className="max-w-lg mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-gray-900">Communities</h1>
          </div>
        </div>
        <div className="max-w-lg mx-auto p-4">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Communities</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadCommunities}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-white/20">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Communities</h1>
          
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search communities..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('joined')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'joined'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Joined ({userCommunities.length})
            </button>
            <button
              onClick={() => setActiveTab('discover')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'discover'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Discover ({discoverCommunities.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto p-4 pb-20">
        {!hasValidSupabaseConfig() && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Demo Mode</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Showing demo communities. Connect to Supabase to see real data.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'joined' ? (
          <div className="space-y-4">
            {userCommunities.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No communities joined</h3>
                <p className="text-gray-600 mb-4">
                  Discover and join communities to connect with others!
                </p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Discover Communities
                </button>
              </div>
            ) : (
              userCommunities.map((community) => (
                <button
                  key={community.id}
                  onClick={() => onShowCommunity(community.id)}
                  className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 bg-gradient-to-br ${getCommunityColor(community.name)} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                      {getCommunityInitial(community.name)}
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-gray-900">{community.name}</h3>
                      {community.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{community.description}</p>
                      )}
                      {community.member_count && (
                        <p className="text-xs text-gray-500 mt-1">{community.member_count} members</p>
                      )}
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {discoverCommunities.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'No communities found' : 'No new communities'}
                </h3>
                <p className="text-gray-600">
                  {searchQuery 
                    ? 'Try adjusting your search terms'
                    : 'You\'ve joined all available communities!'
                  }
                </p>
              </div>
            ) : (
              discoverCommunities.map((community) => (
                <div
                  key={community.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`w-12 h-12 bg-gradient-to-br ${getCommunityColor(community.name)} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                      {getCommunityInitial(community.name)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{community.name}</h3>
                      {community.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{community.description}</p>
                      )}
                      {community.member_count && (
                        <p className="text-xs text-gray-500 mt-1">{community.member_count} members</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onShowCommunity(community.id)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleJoinCommunity(community.id)}
                      className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Join</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
