import React, { useState } from 'react'
import { Profile } from '../lib/supabase'
import { supabase, hasValidSupabaseConfig } from '../lib/supabase'
import { Edit3, Mail, Calendar, User, MapPin, Globe } from 'lucide-react'

interface ProfileViewProps {
  profile: Profile
}

export function ProfileView({ profile }: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    display_name: profile.display_name || '',
    full_name: profile.full_name || '',
    bio: profile.bio || '',
    website: profile.website || '',
    location: profile.location || '',
  })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!hasValidSupabaseConfig()) {
      // For demo mode, just update local state
      setIsEditing(false)
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: editForm.display_name,
          full_name: editForm.full_name,
          bio: editForm.bio,
          website: editForm.website,
          location: editForm.location,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (error) throw error

      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = () => {
    const name = profile.display_name || profile.full_name || profile.email || 'User'
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Cover Photo */}
        <div className="h-32 bg-gradient-to-r from-purple-500 to-pink-500"></div>
        
        <div className="px-6 pb-6">
          <div className="flex items-start justify-between -mt-16 mb-6">
            <div className="flex items-end space-x-4">
              {/* Profile Picture */}
              <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg">
                <div className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {getInitials()}
                  </span>
                </div>
              </div>
              
              <div className="pb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile.display_name || profile.full_name || 'User'}
                </h1>
                <p className="text-gray-600">@{profile.display_name?.toLowerCase().replace(/\s+/g, '') || 'user'}</p>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="mt-4 flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
            </button>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editForm.display_name}
                  onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Your display name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://your-website.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Your location"
                />
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {profile.bio && (
                <p className="text-gray-700">{profile.bio}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>{profile.email}</span>
                </div>
                {profile.location && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center space-x-2">
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
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Joined {new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long'
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Activity Section */}
      <div className="mt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="text-center py-8">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No recent activity to show</p>
            <p className="text-sm text-gray-500 mt-2">Your posts and interactions will appear here</p>
          </div>
        </div>
      </div>
    </div>
  )
}
