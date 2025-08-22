import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function hasValidSupabaseConfig(): boolean {
  return !!(supabaseUrl && supabaseAnonKey && 
    supabaseUrl !== 'undefined' && supabaseAnonKey !== 'undefined' &&
    supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 20)
}

// Types
export interface Profile {
  id: string
  full_name: string | null
  display_name: string | null
  email: string
  avatar_url: string | null
  bio: string | null
  website: string | null
  location: string | null
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  user_id: string
  content: string
  images: string[]
  created_at: string
  updated_at: string
  profiles: Profile
}

export interface Community {
  id: string
  name: string
  description: string
  image_url: string | null
  member_count: number
  is_private: boolean
  created_at: string
  updated_at: string
}

export interface CommunityMembership {
  id: string
  community_id: string
  user_id: string
  role: 'admin' | 'moderator' | 'member'
  joined_at: string
}

export interface MarketplaceItem {
  id: string
  seller_id: string
  title: string
  description: string
  price: number
  category: string
  condition: string
  images: string[]
  is_sold: boolean
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  receiver_id: string
  content: string
  item_id?: string
  created_at: string
  read_at?: string
  profiles?: Profile
  marketplace_items?: MarketplaceItem
}

// Auth functions
export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        display_name: fullName.toLowerCase().replace(/\s+/g, '')
      }
    }
  })
  
  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Profile functions
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }
  
  return data
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating profile:', error)
    return null
  }
  
  return data
}

// Post functions
export async function createPost(content: string, images: string[] = []): Promise<Post | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      content,
      images
    })
    .select(`
      *,
      profiles (*)
    `)
    .single()

  if (error) {
    console.error('Error creating post:', error)
    return null
  }

  return data
}

export async function getPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles (*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching posts:', error)
    return []
  }

  return data || []
}

// Community functions
export async function getCommunities(): Promise<Community[]> {
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .order('member_count', { ascending: false })

  if (error) {
    console.error('Error fetching communities:', error)
    return []
  }

  return data || []
}

export async function joinCommunity(communityId: string): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  const { error } = await supabase
    .from('community_memberships')
    .insert({
      community_id: communityId,
      user_id: user.id,
      role: 'member'
    })

  if (error) {
    console.error('Error joining community:', error)
    return false
  }

  return true
}

export async function leaveCommunity(communityId: string): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  const { error } = await supabase
    .from('community_memberships')
    .delete()
    .eq('community_id', communityId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error leaving community:', error)
    return false
  }

  return true
}

export async function getUserCommunities(): Promise<Community[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('community_memberships')
    .select(`
      communities (*)
    `)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error fetching user communities:', error)
    return []
  }

  return data?.map(item => item.communities).filter(Boolean) || []
}

// Marketplace functions
export async function createMarketplaceItem(item: Omit<MarketplaceItem, 'id' | 'created_at' | 'updated_at'>): Promise<MarketplaceItem | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('marketplace_items')
    .insert({
      ...item,
      seller_id: user.id
    })
    .select(`
      *,
      profiles (*)
    `)
    .single()

  if (error) {
    console.error('Error creating marketplace item:', error)
    return null
  }

  return data
}

export async function getMarketplaceItems(): Promise<MarketplaceItem[]> {
  const { data, error } = await supabase
    .from('marketplace_items')
    .select(`
      *,
      profiles (*)
    `)
    .eq('is_sold', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching marketplace items:', error)
    return []
  }

  return data || []
}

export async function getUserMarketplaceItems(userId: string): Promise<MarketplaceItem[]> {
  const { data, error } = await supabase
    .from('marketplace_items')
    .select(`
      *,
      profiles (*)
    `)
    .eq('seller_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user marketplace items:', error)
    return []
  }

  return data || []
}

export async function updateMarketplaceItem(itemId: string, updates: Partial<MarketplaceItem>): Promise<MarketplaceItem | null> {
  const { data, error } = await supabase
    .from('marketplace_items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', itemId)
    .select(`
      *,
      profiles (*)
    `)
    .single()

  if (error) {
    console.error('Error updating marketplace item:', error)
    return null
  }

  return data
}

export async function deleteMarketplaceItem(itemId: string): Promise<boolean> {
  const { error } = await supabase
    .from('marketplace_items')
    .delete()
    .eq('id', itemId)

  if (error) {
    console.error('Error deleting marketplace item:', error)
    return false
  }

  return true
}

// Simplified messaging functions
export async function sendMessageToSeller(data: {
  recipientId: string
  marketplaceItemId: string
  subject: string
  content: string
}): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      console.error('User not authenticated')
      return false
    }

    // Create conversation ID by sorting user IDs
    const conversationId = [user.id, data.recipientId].sort().join('-')
    
    // Combine subject and content
    const fullMessage = `${data.subject}\n\n${data.content}`

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        receiver_id: data.recipientId,
        content: fullMessage,
        item_id: data.marketplaceItemId
      })

    if (error) {
      console.error('Error sending message to seller:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in sendMessageToSeller:', error)
    return false
  }
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        profiles!messages_sender_id_fkey (*)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getMessages:', error)
    return []
  }
}

export async function getUserConversations(): Promise<Message[]> {
  try {
    const user = await getCurrentUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        profiles!messages_sender_id_fkey (*),
        marketplace_items (*)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getUserConversations:', error)
    return []
  }
}

export async function sendMessage(messageData: {
  conversation_id: string
  sender_id: string
  receiver_id: string
  content: string
  item_id?: string
}): Promise<Message | null> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select(`
        *,
        profiles!messages_sender_id_fkey (*)
      `)
      .single()

    if (error) {
      console.error('Error sending message:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in sendMessage:', error)
    return null
  }
}

export async function markMessageAsRead(messageId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId)

    if (error) {
      console.error('Error marking message as read:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in markMessageAsRead:', error)
    return false
  }
}

// File upload function with better error handling and user-specific paths
export async function uploadFile(file: File, bucket: string = 'marketplace-images'): Promise<string | null> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      console.error('User not authenticated')
      return null
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}-${Math.random()}.${fileExt}`

    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return null
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return urlData.publicUrl
  } catch (error) {
    console.error('Upload function error:', error)
    return null
  }
}
