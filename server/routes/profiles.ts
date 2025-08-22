import express from 'express'
import Joi from 'joi'
import { supabase, cache } from '../index'
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth'

const router = express.Router()

// Validation schema
const updateProfileSchema = Joi.object({
  full_name: Joi.string().min(1).max(100),
  username: Joi.string().alphanum().min(3).max(30),
  bio: Joi.string().max(500).allow(''),
  website: Joi.string().uri().allow(''),
  location: Joi.string().max(100).allow(''),
  avatar_url: Joi.string().uri().allow('')
})

// Get profile by ID
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const cacheKey = `profile:${userId}`
    
    const cachedProfile = cache.get(cacheKey)
    if (cachedProfile) {
      return res.json(cachedProfile)
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Profile not found' })
      }
      return res.status(500).json({ error: 'Failed to fetch profile' })
    }

    cache.set(cacheKey, profile, 300) // Cache for 5 minutes
    res.json(profile)
  } catch (error) {
    console.error('Error fetching profile:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update profile
router.put('/:userId', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params
    
    // Check if user is updating their own profile
    if (userId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to update this profile' })
    }

    const { error: validationError, value } = updateProfileSchema.validate(req.body)
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message })
    }

    // Check if username is already taken (if updating username)
    if (value.username) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', value.username)
        .neq('id', userId)
        .single()

      if (existingProfile) {
        return res.status(400).json({ error: 'Username already taken' })
      }
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        ...value,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Update profile error:', error)
      return res.status(500).json({ error: 'Failed to update profile' })
    }

    // Clear cache
    cache.del(`profile:${userId}`)

    res.json(profile)
  } catch (error) {
    console.error('Error updating profile:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get profile stats
router.get('/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params
    const cacheKey = `profile:stats:${userId}`
    
    const cachedStats = cache.get(cacheKey)
    if (cachedStats) {
      return res.json(cachedStats)
    }

    // Get posts count
    const { count: postsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Get marketplace items count
    const { count: itemsCount } = await supabase
      .from('marketplace_items')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', userId)

    // Get communities count
    const { count: communitiesCount } = await supabase
      .from('community_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    const stats = {
      posts: postsCount || 0,
      marketplaceItems: itemsCount || 0,
      communities: communitiesCount || 0
    }

    cache.set(cacheKey, stats, 180) // Cache for 3 minutes
    res.json(stats)
  } catch (error) {
    console.error('Error fetching profile stats:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export { router as profilesRouter }
