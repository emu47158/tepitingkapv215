import React, { useState, useEffect } from 'react'
import { Users, Plus, ArrowRight } from 'lucide-react'
import { supabase, Profile, hasValidSupabaseConfig } from '../lib/supabase'

interface Community {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
}

interface CommunitiesListProps {
  currentUser: Profile
  onCommunitySelect: (communityId: string) => void
  onCreateCommunity: () => void
}

export function CommunitiesList({ currentUser, onCommunitySelect, onCreateCommunity }: CommunitiesListProps) {
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadUserCommunities()
  }, [])

  const loadUserCommunities = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!hasValidSupabaseConfig()) {
        // Demo data for when Supabase is not configured
        setCommunities([
          {
            id: 'gmik',
            name: 'GMIK',
            description: 'GMIK Community',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'programmer',
            name: 'Programmer',
            description: 'No Life Pipol',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        setLoading(false)
        return
      }

      // Get user's community memberships
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
        setError(`Failed to load communities: ${membershipError.message}`)
        setLoading(false)
        return
      }

      const userCommunities = memberships?.map(m => m.communities).filter(Boolean) || []
      setCommunities(userCommunities)
    } catch (error) {
      console.error('Error loading communities:', error)
      setError(`Failed to load communities: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
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
    ]
    const index = name.length % colors.length
    return colors[index]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-white/20">
          <div className="max-w-lg mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-gray-900">Your Communities</h1>
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
            <h1 className="text-xl font-bold text-gray-900">Your Communities</h1>
          </div>
        </div>
        <div className="max-w-lg mx-auto p-4">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Communities</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadUserCommunities}
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
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Your Communities</h1>
            <button
              onClick={onCreateCommunity}
              className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full hover:from-blue-600 hover:to-purple-600 transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto p-4 pb-20">
        {communities.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No communities yet</h3>
            <p className="text-gray-600 mb-4">
              Join or create a community to start connecting with others!
            </p>
            <button
              onClick={onCreateCommunity}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Create Community
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {communities.map((community) => (
              <button
                key={community.id}
                onClick={() => onCommunitySelect(community.id)}
                className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 bg-gradient-to-br ${getCommunityColor(community.name)} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                    {getCommunityInitial(community.name)}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-900">{community.name}</h3>
                    {community.description && (
                      <p className="text-sm text-gray-600">{community.description}</p>
                    )}
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            ))}

            {/* Create New Community Button */}
            <button
              onClick={onCreateCommunity}
              className="w-full bg-white rounded-xl shadow-sm border border-gray-200 border-dashed p-4 hover:shadow-md transition-all duration-200 hover:scale-[1.02] text-blue-600 hover:text-blue-700"
            >
              <div className="flex items-center justify-center space-x-3">
                <Plus className="w-6 h-6" />
                <span className="font-medium">Create New Community</span>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
