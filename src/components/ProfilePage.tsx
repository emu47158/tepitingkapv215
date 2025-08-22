import React from 'react'
import { ArrowLeft, User, Mail, AtSign, Calendar } from 'lucide-react'
import { Profile } from '../lib/supabase'

interface ProfilePageProps {
  profile: Profile
  onBack: () => void
}

export function ProfilePage({ profile, onBack }: ProfilePageProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const initials = getInitials(profile.full_name || profile.display_name || 'U')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative">
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/10 border-b border-white/20 shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Feed</span>
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
            {/* Profile Header */}
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg mx-auto mb-4">
                {initials}
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {profile.display_name || profile.full_name}
              </h1>
              {profile.username && (
                <p className="text-gray-600 text-lg">@{profile.username}</p>
              )}
            </div>

            {/* Profile Information */}
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl">
                <Mail className="w-5 h-5 text-gray-500 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-gray-800 font-medium">{profile.email}</p>
                </div>
              </div>

              {profile.full_name && (
                <div className="flex items-center p-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl">
                  <User className="w-5 h-5 text-gray-500 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="text-gray-800 font-medium">{profile.full_name}</p>
                  </div>
                </div>
              )}

              {profile.display_name && (
                <div className="flex items-center p-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl">
                  <User className="w-5 h-5 text-gray-500 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Display Name</p>
                    <p className="text-gray-800 font-medium">{profile.display_name}</p>
                  </div>
                </div>
              )}

              {profile.username && (
                <div className="flex items-center p-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl">
                  <AtSign className="w-5 h-5 text-gray-500 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Username</p>
                    <p className="text-gray-800 font-medium">@{profile.username}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center p-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl">
                <Calendar className="w-5 h-5 text-gray-500 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Member Since</p>
                  <p className="text-gray-800 font-medium">
                    {new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
