import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { apiClient } from '../lib/api'

export function useApi() {
  const { user } = useAuth()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const setupApiClient = async () => {
      if (user) {
        // Get the current session token
        const { data: { session } } = await import('../lib/supabase').then(m => m.supabase.auth.getSession())
        if (session?.access_token) {
          apiClient.setToken(session.access_token)
        }
      } else {
        apiClient.setToken(null)
      }
      setIsReady(true)
    }

    setupApiClient()
  }, [user])

  return { apiClient, isReady }
}

// Custom hooks for specific API operations
export function useApiPosts() {
  const { apiClient, isReady } = useApi()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPosts = async (params: { section?: string; page?: number; limit?: number } = {}) => {
    if (!isReady) return

    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.getPosts(params)
      setPosts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  const createPost = async (postData: {
    content: string
    images?: string[]
    visibility?: 'public' | 'anonymous'
    community_id?: string
  }) => {
    if (!isReady) return null

    try {
      const newPost = await apiClient.createPost(postData)
      setPosts(prev => [newPost, ...prev])
      return newPost
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post')
      return null
    }
  }

  const likePost = async (postId: string) => {
    if (!isReady) return

    try {
      await apiClient.likePost(postId)
      // Refresh posts to get updated like status
      loadPosts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to like post')
    }
  }

  const addComment = async (postId: string, content: string) => {
    if (!isReady) return

    try {
      await apiClient.addComment(postId, content)
      // Refresh posts to get updated comments
      loadPosts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment')
    }
  }

  return {
    posts,
    loading,
    error,
    loadPosts,
    createPost,
    likePost,
    addComment,
    isReady
  }
}

export function useApiMarketplace() {
  const { apiClient, isReady } = useApi()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadItems = async (params: {
    category?: string
    condition?: string
    minPrice?: number
    maxPrice?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
  } = {}) => {
    if (!isReady) return

    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.getMarketplaceItems(params)
      setItems(data.items || data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load marketplace items')
    } finally {
      setLoading(false)
    }
  }

  const createItem = async (itemData: {
    title: string
    description: string
    price: number
    category: string
    condition: string
    images?: string[]
  }) => {
    if (!isReady) return null

    try {
      const newItem = await apiClient.createMarketplaceItem(itemData)
      setItems(prev => [newItem, ...prev])
      return newItem
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item')
      return null
    }
  }

  return {
    items,
    loading,
    error,
    loadItems,
    createItem,
    isReady
  }
}
