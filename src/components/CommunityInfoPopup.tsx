import React, { useState, useEffect } from 'react'
import { X, Info, Users, UserPlus, Crown, Search, Shield, UserMinus } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface CommunityInfoPopupProps {
  communityId: string
  onClose: () => void
  onMemberAdded: () => void
}

interface CommunityInfo {
  id: string
  name: string
  description: string
  created_by: string
  created_at: string
}

interface CommunityMember {
  id: string
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
  profiles: {
    id: string
    username: string
    display_name: string
    full_name: string
  }
}

export function CommunityInfoPopup({ communityId, onClose, onMemberAdded }: CommunityInfoPopupProps) {
  const [community, setCommunity] = useState<CommunityInfo | null>(null)
  const [members, setMembers] = useState<CommunityMember[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'member' | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Add member functionality
  const [showAddMember, setShowAddMember] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isInviting, setIsInviting] = useState(false)

  useEffect(() => {
    fetchCommunityInfo()
    fetchMembers()
    fetchCurrentUserRole()
  }, [communityId])

  const fetchCommunityInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('id, name, description, created_by, created_at')
        .eq('id', communityId)
        .single()

      if (error) throw error
      setCommunity(data)
    } catch (error: any) {
      console.error('Error fetching community info:', error)
      setError(error.message || 'Failed to load community information')
    }
  }

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('community_memberships')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          profiles (
            id,
            username,
            display_name,
            full_name
          )
        `)
        .eq('community_id', communityId)
        .order('role', { ascending: false }) // Admins first
        .order('joined_at', { ascending: true })

      if (error) throw error
      setMembers(data || [])
    } catch (error: any) {
      console.error('Error fetching members:', error)
      setError(error.message || 'Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('community_memberships')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      setCurrentUserRole(data?.role || null)
    } catch (error: any) {
      console.error('Error fetching user role:', error)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a username or name')
      return
    }

    setIsSearching(true)
    setError(null)
    setSuccess(null)

    try {
      // Search for users by username or name
      const { data: profiles, error: searchError } = await supabase
        .from('profiles')
        .select('id, username, display_name, full_name')
        .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
        .limit(10)

      if (searchError) throw searchError

      // Filter out users who are already members
      const existingMemberIds = members.map(m => m.user_id)
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
      const { error: inviteError } = await supabase
        .from('community_memberships')
        .insert([{
          community_id: communityId,
          user_id: userId,
          role: 'member'
        }])

      if (inviteError) throw inviteError

      setSuccess(`Successfully added ${username} to the community!`)
      setSearchResults(prev => prev.filter(user => user.id !== userId))
      
      // Refresh members list
      await fetchMembers()
      onMemberAdded()
      
      // Clear search after successful invite
      setTimeout(() => {
        setSearchTerm('')
        setSearchResults([])
        setShowAddMember(false)
        setSuccess(null)
      }, 1500)
    } catch (error: any) {
      console.error('Error inviting user:', error)
      setError(error.message || 'Failed to add member')
    } finally {
      setIsInviting(false)
    }
  }

  const handleRoleChange = async (membershipId: string, newRole: 'admin' | 'member', username: string) => {
    try {
      setError(null)
      setSuccess(null)

      const { error } = await supabase
        .from('community_memberships')
        .update({ role: newRole })
        .eq('id', membershipId)

      if (error) throw error

      setSuccess(`Successfully updated ${username}'s role to ${newRole}`)
      await fetchMembers()
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error('Error updating role:', error)
      setError(error.message || 'Failed to update role')
    }
  }

  const handleRemoveMember = async (membershipId: string, username: string) => {
    if (!confirm(`Are you sure you want to remove ${username} from this community?`)) {
      return
    }

    try {
      setError(null)
      setSuccess(null)

      const { error } = await supabase
        .from('community_memberships')
        .delete()
        .eq('id', membershipId)

      if (error) throw error

      setSuccess(`Successfully removed ${username} from the community`)
      await fetchMembers()
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error('Error removing member:', error)
      setError(error.message || 'Failed to remove member')
    }
  }

  const getDisplayName = (member: CommunityMember) => {
    const profile = member.profiles
    return profile.display_name || profile.full_name || profile.username || 'Unknown User'
  }

  const getInitials = (member: CommunityMember) => {
    const name = getDisplayName(member)
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isCurrentUserAdmin = currentUserRole === 'admin'

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-start justify-center pt-20 z-50">
        <div className="backdrop-blur-xl bg-white/95 border border-white/30 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-300/50 rounded w-1/3"></div>
            <div className="h-4 bg-gray-300/50 rounded w-2/3"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-300/50 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex items-start justify-center pt-20 z-50">
      <div className="backdrop-blur-xl bg-white/95 border border-white/30 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 animate-in slide-in-from-top-4 fade-in duration-300 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <Info className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Community Information
              </h2>
              <p className="text-sm text-gray-600">
                Manage community settings and members
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Messages */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {/* Community Info */}
          {community && (
            <div className="backdrop-blur-xl bg-white/30 border border-white/20 rounded-xl p-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{community.name}</h3>
              {community.description && (
                <p className="text-gray-600 mb-3">{community.description}</p>
              )}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Created {formatDate(community.created_at)}</span>
                <span className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{members.length} member{members.length !== 1 ? 's' : ''}</span>
                </span>
              </div>
            </div>
          )}

          {/* Admin Controls */}
          {isCurrentUserAdmin && (
            <div className="backdrop-blur-xl bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-800 flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Admin Controls</span>
                </h4>
                <button
                  onClick={() => setShowAddMember(!showAddMember)}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-700 rounded-lg transition-colors text-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Member</span>
                </button>
              </div>

              {/* Add Member Section */}
              {showAddMember && (
                <div className="space-y-3 pt-3 border-t border-blue-500/20">
                  <div className="flex space-x-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search by username or name..."
                        className="w-full pl-9 pr-3 py-2 backdrop-blur-xl bg-white/50 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder-gray-500 text-gray-800 text-sm"
                        disabled={isSearching}
                      />
                    </div>
                    <button
                      onClick={handleSearch}
                      disabled={isSearching || !searchTerm.trim()}
                      className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {isSearching ? (
                        <div className="w-4 h-4 border-2 border-blue-700/30 border-t-blue-700 rounded-full animate-spin"></div>
                      ) : (
                        'Search'
                      )}
                    </button>
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {searchResults.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-2 backdrop-blur-xl bg-white/30 border border-white/20 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                              {(user.display_name || user.full_name || user.username || 'U')
                                .split(' ')
                                .map((word: string) => word.charAt(0))
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 text-sm">
                                {user.display_name || user.full_name || user.username}
                              </p>
                              <p className="text-xs text-gray-600">@{user.username}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleInviteUser(user.id, user.username)}
                            disabled={isInviting}
                            className="flex items-center space-x-1 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Members List */}
          <div>
            <h4 className="font-medium text-gray-800 mb-3 flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Members ({members.length})</span>
            </h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 backdrop-blur-xl bg-white/30 border border-white/20 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {getInitials(member)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-800">
                          {getDisplayName(member)}
                        </p>
                        {member.role === 'admin' && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        @{member.profiles.username} • Joined {formatDate(member.joined_at)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Admin Controls for Members */}
                  {isCurrentUserAdmin && member.user_id !== community?.created_by && (
                    <div className="flex items-center space-x-2">
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as 'admin' | 'member', getDisplayName(member))}
                        className="px-2 py-1 backdrop-blur-xl bg-white/50 border border-white/30 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => handleRemoveMember(member.id, getDisplayName(member))}
                        className="p-1.5 text-red-600 hover:bg-red-500/20 rounded transition-colors"
                        title="Remove member"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  {/* Show role for non-admins or community creator */}
                  {(!isCurrentUserAdmin || member.user_id === community?.created_by) && (
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.role === 'admin' 
                          ? 'bg-yellow-500/20 text-yellow-700' 
                          : 'bg-gray-500/20 text-gray-700'
                      }`}>
                        {member.role}
                        {member.user_id === community?.created_by && ' (Creator)'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
