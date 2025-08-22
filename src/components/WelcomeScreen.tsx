import React from 'react'
import { CheckCircle, User, Mail, AtSign, LogOut } from 'lucide-react'
import { Profile, supabase } from '../lib/supabase'

interface WelcomeScreenProps {
  profile: Profile
  onLogout: () => void
}

export function WelcomeScreen({ profile, onLogout }: WelcomeScreenProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut()
    onLogout()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-teal-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-lg">
        {/* Glassmorphism container */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl mb-4 shadow-lg">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Welcome, {profile.display_name || profile.full_name || 'User'}!
            </h1>
            <p className="text-gray-600">
              Your profile is complete and ready to go
            </p>
          </div>

          {/* Profile Information */}
          <div className="space-y-4 mb-8">
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
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleLogout}
              className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
            >
              <div className="flex items-center justify-center">
                <LogOut className="w-5 h-5 mr-2" />
                Sign Out
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Member since {new Date(profile.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
