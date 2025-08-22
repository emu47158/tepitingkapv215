import React from 'react'
import { MainLayout } from './MainLayout'
import { Profile } from '../lib/supabase'

interface SocialFeedProps {
  profile: Profile
  onLogout: () => void
  onProfileClick: () => void
}

export function SocialFeed({ profile, onLogout, onProfileClick }: SocialFeedProps) {
  return (
    <MainLayout 
      profile={profile} 
      onLogout={onLogout}
    />
  )
}
