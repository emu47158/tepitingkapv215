import React from 'react'
import { Home, Users, ShoppingBag, User, MessageCircle, Sparkles, LogOut } from 'lucide-react'
import { signOut, Profile } from '../lib/supabase'

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  onMessagesClick: () => void
  profile: Profile
}

export function Sidebar({ activeTab, setActiveTab, onMessagesClick, profile }: SidebarProps) {
  const menuItems = [
    { id: 'feed', label: 'Feed', icon: Home },
    { id: 'communities', label: 'Communities', icon: Users },
    { id: 'marketplace', label: 'SijangKu', icon: ShoppingBag },
    { id: 'profile', label: 'Profile', icon: User },
  ]

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              TepiTingkap
            </h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            )
          })}
          
          {/* Messages Button */}
          <li>
            <button
              onClick={onMessagesClick}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">Messages</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* User Profile & Sign Out */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {profile.display_name?.charAt(0).toUpperCase() || profile.full_name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {profile.display_name || profile.full_name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">{profile.email}</p>
          </div>
        </div>
        
        <button
          onClick={handleSignOut}
          className="w-full flex items-center space-x-3 px-4 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </div>
  )
}
