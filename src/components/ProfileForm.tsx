import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

interface ProfileFormProps {
  userEmail: string
  onComplete: () => void
}

export function ProfileForm({ userEmail, onComplete }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usernameError, setUsernameError] = useState<string | null>(null)

  const checkUsernameAvailability = async (username: string) => {
    if (!username) {
      setUsernameError(null)
      return
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setUsernameError('Username is already taken')
      } else {
        setUsernameError(null)
      }
    } catch (error: any) {
      console.error('Error checking username:', error)
    }
  }

  const handleUsernameChange = (value: string) => {
    setUsername(value)
    if (value) {
      const timeoutId = setTimeout(() => {
        checkUsernameAvailability(value)
      }, 500)
      return () => clearTimeout(timeoutId)
    } else {
      setUsernameError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (usernameError) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No user found')
      }

      const { error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: userEmail,
          display_name: displayName,
          username: username,
          full_name: fullName,
        })

      if (error) throw error

      onComplete()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Complete Your Profile</h1>
          <p className="text-gray-400">Tell us a bit about yourself</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="text"
                placeholder="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>

            <div>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                  usernameError ? 'border-red-500' : 'border-gray-700 focus:border-blue-500'
                }`}
                required
              />
              {usernameError && (
                <p className="text-red-400 text-sm mt-1">{usernameError}</p>
              )}
            </div>

            <div>
              <input
                type="text"
                placeholder="Full Name (Optional)"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !!usernameError}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Creating Profile...' : 'Complete Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
