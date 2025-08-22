import express from 'express'
import Joi from 'joi'
import { supabase, cache } from '../index'
import { authenticateUser, optionalAuth, AuthenticatedRequest } from '../middleware/auth'

const router = express.Router()

// Validation schemas
const createPostSchema = Joi.object({
  content: Joi.string().required().min(1).max(2000),
  images: Joi.array().items(Joi.string().uri()).max(10).default([]),
  visibility: Joi.string().valid('public', 'anonymous').default('public'),
  community_id: Joi.string().uuid().optional()
})

const commentSchema = Joi.object({
  content: Joi.string().required().min(1).max(500)
})

// Get posts with caching and optimized queries
router.get('/', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { section = 'public', page = 1, limit = 20 } = req.query
    const cacheKey = `posts:${section}:${page}:${limit}`
    
    // Check cache first
    const cachedPosts = cache.get(cacheKey)
    if (cachedPosts) {
      return res.json(cachedPosts)
    }

    let query = supabase
      .from('posts')
      .select(`
        id,
        content,
        images,
        visibility,
        created_at,
        updated_at,
        user_id,
        community_id,
        profiles!posts_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `)

    // Apply filters based on section
    if (section === 'public') {
      query = query.eq('visibility', 'public').is('community_id', null)
    } else if (section === 'anonymous') {
      query = query.eq('visibility', 'anonymous').is('community_id', null)
    } else {
      query = query.eq('community_id', section)
    }

    const offset = (Number(page) - 1) * Number(limit)
    const { data: posts, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1)

    if (error) {
      console.error('Posts query error:', error)
      return res.status(500).json({ error: 'Failed to fetch posts' })
    }

    // Get additional data for each post
    const postsWithMetadata = await Promise.all(
      (posts || []).map(async (post) => {
        // Get likes count and user's like status
        const { data: likes } = await supabase
          .from('likes')
          .select('id, user_id')
          .eq('post_id', post.id)

        // Get comments count
        const { data: comments } = await supabase
          .from('comments')
          .select(`
            id,
            content,
            created_at,
            user_id,
            profiles!comments_user_id_fkey (
              id,
              username,
              full_name,
              avatar_url
            )
          `)
          .eq('post_id', post.id)
          .order('created_at', { ascending: true })

        const userLiked = req.user ? likes?.some(like => like.user_id === req.user?.id) : false

        return {
          ...post,
          // Hide profile for anonymous posts
          profiles: section === 'anonymous' ? null : post.profiles,
          likes: likes || [],
          comments: section === 'anonymous' 
            ? (comments || []).map(comment => ({ ...comment, profiles: null }))
            : comments || [],
          _count: {
            likes: likes?.length || 0,
            comments: comments?.length || 0
          },
          userLiked
        }
      })
    )

    // Cache the result
    cache.set(cacheKey, postsWithMetadata, 60) // Cache for 1 minute

    res.json(postsWithMetadata)
  } catch (error) {
    console.error('Error fetching posts:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create post
router.post('/', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { error: validationError, value } = createPostSchema.validate(req.body)
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message })
    }

    const { content, images, visibility, community_id } = value

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        user_id: req.user!.id,
        content,
        images,
        visibility,
        community_id
      })
      .select(`
        *,
        profiles!posts_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Create post error:', error)
      return res.status(500).json({ error: 'Failed to create post' })
    }

    // Clear relevant caches
    cache.flushAll()

    res.status(201).json({
      ...post,
      likes: [],
      comments: [],
      _count: { likes: 0, comments: 0 },
      userLiked: false
    })
  } catch (error) {
    console.error('Error creating post:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Like/unlike post
router.post('/:postId/like', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { postId } = req.params

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', req.user!.id)
      .single()

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id)

      if (error) {
        return res.status(500).json({ error: 'Failed to unlike post' })
      }

      res.json({ liked: false })
    } else {
      // Like
      const { error } = await supabase
        .from('likes')
        .insert({ post_id: postId, user_id: req.user!.id })

      if (error) {
        return res.status(500).json({ error: 'Failed to like post' })
      }

      res.json({ liked: true })
    }

    // Clear cache
    cache.flushAll()
  } catch (error) {
    console.error('Error toggling like:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Add comment
router.post('/:postId/comments', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { postId } = req.params
    const { error: validationError, value } = commentSchema.validate(req.body)
    
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message })
    }

    const { content } = value

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: req.user!.id,
        content
      })
      .select(`
        *,
        profiles!comments_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Create comment error:', error)
      return res.status(500).json({ error: 'Failed to create comment' })
    }

    // Clear cache
    cache.flushAll()

    res.status(201).json(comment)
  } catch (error) {
    console.error('Error creating comment:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export { router as postsRouter }
