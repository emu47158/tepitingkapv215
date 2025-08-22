import React, { useState } from 'react'
import { Menu, X, Home, PlusSquare, Users, MessageCircle, User, Package, LogOut, Globe, UserX } from 'lucide-react'
import { Profile } from '../lib/supabase'

interface TopNavigationProps {
  profile: Profile
  onLogout: () => void
  onShowCreatePost: () => void
  onShowCreateCommunity: () => void
  onShowSijangKu: () => void
  onShowMessages: () => void
  onShowMarketplace: () => void
  onShowCommunities: () => void
  currentView: 'home' | 'profile' | 'communities' | 'community' | 'fullscreen-communities'
  onViewChange: (view: 'home' | 'profile' | 'communities' | 'community' | 'fullscreen-communities') => void
  currentSection: 'public' | 'anonymous' | string
  onSectionChange: (section: 'public' | 'anonymous' | string) => void
}

export function TopNavigation({
  profile,
  onLogout,
  onShowCreatePost,
  onShowCreateCommunity,
  onShowSijangKu,
  onShowMessages,
  onShowMarketplace,
  onShowCommunities,
  currentView,
  onViewChange,
  currentSection,
  onSectionChange
}: TopNavigationProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const getInitials = () => {
    const name = profile.display_name || profile.full_name || 'User'
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      {/* Mobile Navigation */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            TepiTingkap
          </h1>
          
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Section Tabs - Mobile */}
        <div className="flex border-t border-gray-200">
          <button
            onClick={() => onSectionChange('public')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 transition-colors ${
              currentSection === 'public'
                ? 'bg-purple-100 text-purple-700 border-b-2 border-purple-500'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">Public</span>
          </button>
          <button
            onClick={() => onSectionChange('anonymous')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 transition-colors ${
              currentSection === 'anonymous'
                ? 'bg-gray-100 text-gray-700 border-b-2 border-gray-500'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <UserX className="w-4 h-4" />
            <span className="text-sm font-medium">Anonymous</span>
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="bg-white border-t border-gray-200">
            <div className="px-4 py-2 space-y-1">
              <button
                onClick={() => {
                  onViewChange('home')
                  setShowMobileMenu(false)
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  currentView === 'home'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Home className="w-5 h-5" />
                <span className="font-medium">Home</span>
              </button>

              <button
                onClick={() => {
                  onShowCreatePost()
                  setShowMobileMenu(false)
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <PlusSquare className="w-5 h-5" />
                <span className="font-medium">Create</span>
              </button>

              <button
                onClick={() => {
                  onShowCommunities()
                  setShowMobileMenu(false)
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  currentView === 'fullscreen-communities'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="font-medium">Communities</span>
              </button>

              <button
                onClick={() => {
                  onShowMessages()
                  setShowMobileMenu(false)
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">Messages</span>
              </button>

              <button
                onClick={() => {
                  onViewChange('profile')
                  setShowMobileMenu(false)
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  currentView === 'profile'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="font-medium">Profile</span>
              </button>

              <button
                onClick={() => {
                  onShowCreateCommunity()
                  setShowMobileMenu(false)
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <PlusSquare className="w-5 h-5" />
                <span className="font-medium">Create Community</span>
              </button>

              <button
                onClick={() => {
                  onShowMarketplace()
                  setShowMobileMenu(false)
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Package className="w-5 h-5" />
                <span className="font-medium">SijangKu</span>
              </button>

              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex items-center space-x-3 px-4 py-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                    {getInitials()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {profile.display_name || profile.full_name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{profile.email}</p>
                  </div>
                </div>
                
                <button
                  onClick={onLogout}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Navigation */}
      <div className="hidden lg:block fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              TepiTingkap
            </h1>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => onSectionChange('public')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                    currentSection === 'public'
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span className="font-medium">Public</span>
                </button>
                <button
                  onClick={() => onSectionChange('anonymous')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                    currentSection === 'anonymous'
                      ? 'bg-white text-gray-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <UserX className="w-4 h-4" />
                  <span className="font-medium">Anonymous</span>
                </button>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                  {getInitials()}
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {profile.display_name || profile.full_name || 'User'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
