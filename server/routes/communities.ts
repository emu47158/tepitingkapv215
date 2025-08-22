import express from 'express'
import Joi from 'joi'
import { supabase, cache } from '../index'
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth'

const router = express.Router()

// Get communities with caching
router.get('/', async (req, res) => {
  try {
    const cacheKey = 'communities:all'
    const cachedCommunities = cache.get(cacheKey)
    
    if (cachedCommunities) {
      return res.json(cachedCommunities)
    }

    const { data: communities, error } = await supabase
      .from('communities')
      .select('*')
      .order('member_count', { ascending: false })

    if (error) {
      console.error('Communities query error:', error)
      return res.status(500).json({ error: 'Failed to fetch communities' })
    }

    cache.set(cacheKey, communities, 300) // Cache for 5 minutes
    res.json(communities || [])
  } catch (error) {
    console.error('Error fetching communities:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user's communities
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const cacheKey = `communities:user:${userId}`
    
    const cachedCommunities = cache.get(cacheKey)
    if (cachedCommunities) {
      return res.json(cachedCommunities)
    }

    const { data: memberships, error } = await supabase
      .from('community_memberships')
      .select(`
        communities (*)
      `)
      .eq('user_id', userId)

    if (error) {
      console.error('User communities query error:', error)
      return res.status(500).json({ error: 'Failed to fetch user communities' })
    }

    const communities = memberships?.map(m => m.communities).filter(Boolean) || []
    
    cache.set(cacheKey, communities, 180) // Cache for 3 minutes
    res.json(communities)
  } catch (error) {
    console.error('Error fetching user communities:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Join community
router.post('/:communityId/join', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { communityId } = req.params

    // Check if already a member
    const { data: existingMembership } = await supabase
      .from('community_memberships')
      .select('id')
      .eq('community_id', communityId)
      .eq('user_id', req.user!.id)
      .single()

    if (existingMembership) {
      return res.status(400).json({ error: 'Already a member of this community' })
    }

    const { error } = await supabase
      .from('community_memberships')
      .insert({
        community_id: communityId,
        user_id: req.user!.id,
        role: 'member'
      })

    if (error) {
      console.error('Join community error:', error)
      return res.status(500).json({ error: 'Failed to join community' })
    }

    // Clear cache
    cache.flushAll()

    res.json({ message: 'Successfully joined community' })
  } catch (error) {
    console.error('Error joining community:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Leave community
router.post('/:communityId/leave', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { communityId } = req.params

    const { error } = await supabase
      .from('community_memberships')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', req.user!.id)

    if (error) {
      console.error('Leave community error:', error)
      return res.status(500).json({ error: 'Failed to leave community' })
    }

    // Clear cache
    cache.flushAll()

    res.json({ message: 'Successfully left community' })
  } catch (error) {
    console.error('Error leaving community:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export { router as communitiesRouter }
