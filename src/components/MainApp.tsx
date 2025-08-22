import React, { useState } from 'react'
import { Profile } from '../lib/supabase'
import { MainLayout } from './MainLayout'

interface MainAppProps {
  user: any
  profile: Profile
}

export function MainApp({ user, profile }: MainAppProps) {
  const handleLogout = () => {
    // Handle logout logic here
    window.location.reload()
  }

  return (
    <MainLayout 
      profile={profile} 
      onLogout={handleLogout}
    />
  )
}
