import React, { useState } from 'react'
import { X, UserPlus, Search, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface AddMemberPopupProps {
  communityId: string
  onMemberAdded: () => void
  onClose: () => void
}

export function AddMemberPopup({ communityId, onMemberAdded, onClose }: AddMemberPopupProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a username or email')
      return
    }

    setIsSearching(true)
    setError(null)
    setSuccess(null)

    try {
      // Search for users by username or email
      const { data: profiles, error: searchError } = await supabase
        .from('profiles')
        .select('id, username, display_name, full_name')
        .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
        .limit(10)

      if (searchError) throw searchError

      // Filter out users who are already members
      const { data: existingMembers, error: memberError } = await supabase
        .from('community_memberships')
        .select('user_id')
        .eq('community_id', communityId)

      if (memberError) throw memberError

      const existingMemberIds = existingMembers?.map(m => m.user_id) || []
      const filteredProfiles = profiles?.filter(p => !existingMemberIds.includes(p.id)) || []

      setSearchResults(filteredProfiles)

      if (filteredProfiles.length === 0) {
        setError('No users found or all matching users are already members')
      }
    } catch (error: any) {
      console.error('Error searching users:', error)
      setError(error.message || 'Failed to search users')
    } finally {
      setIsSearching(false)
    }
  }

  const handleInviteUser = async (userId: string, username: string) => {
    setIsInviting(true)
    setError(null)
    setSuccess(null)

    try {
      // Add user to community
      const { error: inviteError } = await supabase
        .from('community_memberships')
        .insert([{
          community_id: communityId,
          user_id: userId,
          role: 'member'
        }])

      if (inviteError) throw inviteError

      setSuccess(`Successfully added ${username} to the community!`)
      
      // Remove user from search results
      setSearchResults(prev => prev.filter(user => user.id !== userId))
      
      // Close popup after a short delay
      setTimeout(() => {
        onMemberAdded()
      }, 1500)
    } catch (error: any) {
      console.error('Error inviting user:', error)
      setError(error.message || 'Failed to add member')
    } finally {
      setIsInviting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="fixed inset-0 flex items-start justify-center pt-20 z-50">
      <div className="backdrop-blur-xl bg-white/95 border border-white/30 rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-in slide-in-from-top-4 fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <UserPlus className="w-6 h-6 text-orange-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Add Member
              </h2>
              <p className="text-sm text-gray-600">
                Search and invite users to join this community
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Form */}
        <div className="p-6">
          <div className="mb-4">
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search by username or name..."
                  className="w-full pl-10 pr-4 py-3 backdrop-blur-xl bg-white/50 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent placeholder-gray-500 text-gray-800"
                  disabled={isSearching}
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchTerm.trim()}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSearching ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Search'
                )}
              </button>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Search Results</h3>
              {searchResults.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 backdrop-blur-xl bg-white/30 border border-white/20 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {(user.display_name || user.full_name || user.username || 'U')
                        .split(' ')
                        .map((word: string) => word.charAt(0))
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {user.display_name || user.full_name || user.username}
                      </p>
                      <p className="text-sm text-gray-600">@{user.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleInviteUser(user.id, user.username)}
                    disabled={isInviting}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30 text-orange-700 rounded-lg transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span className="text-sm">Add</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {searchResults.length === 0 && searchTerm && !isSearching && !error && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No users found</p>
              <p className="text-sm text-gray-500">Try searching with a different term</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
