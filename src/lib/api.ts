// API client for REST endpoints
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  setToken(token: string | null) {
    this.token = token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)
      throw error
    }
  }

  // Posts API
  async getPosts(params: {
    section?: string
    page?: number
    limit?: number
  } = {}) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })
    
    return this.request(`/posts?${searchParams}`)
  }

  async createPost(data: {
    content: string
    images?: string[]
    visibility?: 'public' | 'anonymous'
    community_id?: string
  }) {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async likePost(postId: string) {
    return this.request(`/posts/${postId}/like`, {
      method: 'POST',
    })
  }

  async addComment(postId: string, content: string) {
    return this.request(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
  }

  // Marketplace API
  async getMarketplaceItems(params: {
    category?: string
    condition?: string
    minPrice?: number
    maxPrice?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
  } = {}) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })
    
    return this.request(`/marketplace?${searchParams}`)
  }

  async getMarketplaceItem(itemId: string) {
    return this.request(`/marketplace/${itemId}`)
  }

  async createMarketplaceItem(data: {
    title: string
    description: string
    price: number
    category: string
    condition: string
    images?: string[]
  }) {
    return this.request('/marketplace', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateMarketplaceItem(itemId: string, data: Partial<{
    title: string
    description: string
    price: number
    category: string
    condition: string
    images: string[]
    is_sold: boolean
  }>) {
    return this.request(`/marketplace/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteMarketplaceItem(itemId: string) {
    return this.request(`/marketplace/${itemId}`, {
      method: 'DELETE',
    })
  }

  async getUserMarketplaceItems(userId: string) {
    return this.request(`/marketplace/user/${userId}`)
  }

  // Profiles API
  async getProfile(userId: string) {
    return this.request(`/profiles/${userId}`)
  }

  async updateProfile(userId: string, data: {
    full_name?: string
    username?: string
    bio?: string
    website?: string
    location?: string
    avatar_url?: string
  }) {
    return this.request(`/profiles/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async getProfileStats(userId: string) {
    return this.request(`/profiles/${userId}/stats`)
  }

  // Communities API
  async getCommunities() {
    return this.request('/communities')
  }

  async getUserCommunities(userId: string) {
    return this.request(`/communities/user/${userId}`)
  }

  async joinCommunity(communityId: string) {
    return this.request(`/communities/${communityId}/join`, {
      method: 'POST',
    })
  }

  async leaveCommunity(communityId: string) {
    return this.request(`/communities/${communityId}/leave`, {
      method: 'POST',
    })
  }

  // Messages API
  async getConversations() {
    return this.request('/messages/conversations')
  }

  async getMessages(conversationId: string) {
    return this.request(`/messages/conversation/${conversationId}`)
  }

  async sendMessage(data: {
    receiver_id: string
    content: string
    item_id?: string
  }) {
    return this.request('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async markMessageAsRead(messageId: string) {
    return this.request(`/messages/${messageId}/read`, {
      method: 'PUT',
    })
  }

  // Upload API
  async uploadImage(file: File): Promise<{ url: string; fileName: string }> {
    const formData = new FormData()
    formData.append('image', file)

    return this.request('/upload/image', {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    })
  }

  async uploadImages(files: File[]): Promise<{ files: Array<{ url: string; fileName: string }> }> {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('images', file)
    })

    return this.request('/upload/images', {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
