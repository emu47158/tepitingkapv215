import express from 'express'
import Joi from 'joi'
import { supabase, cache } from '../index'
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth'

const router = express.Router()

// Validation schemas
const createItemSchema = Joi.object({
  title: Joi.string().required().min(1).max(200),
  description: Joi.string().required().min(1).max(2000),
  price: Joi.number().required().min(0),
  category: Joi.string().required().valid('electronics', 'clothing', 'home', 'books', 'sports', 'automotive', 'other'),
  condition: Joi.string().required().valid('new', 'like-new', 'good', 'fair', 'poor'),
  images: Joi.array().items(Joi.string().uri()).max(10).default([])
})

const updateItemSchema = Joi.object({
  title: Joi.string().min(1).max(200),
  description: Joi.string().min(1).max(2000),
  price: Joi.number().min(0),
  category: Joi.string().valid('electronics', 'clothing', 'home', 'books', 'sports', 'automotive', 'other'),
  condition: Joi.string().valid('new', 'like-new', 'good', 'fair', 'poor'),
  images: Joi.array().items(Joi.string().uri()).max(10),
  is_sold: Joi.boolean()
})

// Get marketplace items with advanced filtering and caching
router.get('/', async (req, res) => {
  try {
    const { 
      category = 'all',
      condition,
      minPrice,
      maxPrice,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query

    const cacheKey = `marketplace:${JSON.stringify(req.query)}`
    const cachedItems = cache.get(cacheKey)
    
    if (cachedItems) {
      return res.json(cachedItems)
    }

    let query = supabase
      .from('marketplace_items')
      .select(`
        *,
        profiles!marketplace_items_seller_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('is_sold', false)

    // Apply filters
    if (category !== 'all') {
      query = query.eq('category', category)
    }

    if (condition) {
      query = query.eq('condition', condition)
    }

    if (minPrice) {
      query = query.gte('price', Number(minPrice))
    }

    if (maxPrice) {
      query = query.lte('price', Number(maxPrice))
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply sorting
    const ascending = sortOrder === 'asc'
    query = query.order(sortBy as string, { ascending })

    // Apply pagination
    const offset = (Number(page) - 1) * Number(limit)
    const { data: items, error, count } = await query
      .range(offset, offset + Number(limit) - 1)

    if (error) {
      console.error('Marketplace query error:', error)
      return res.status(500).json({ error: 'Failed to fetch marketplace items' })
    }

    const result = {
      items: items || [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit))
      }
    }

    // Cache the result
    cache.set(cacheKey, result, 120) // Cache for 2 minutes

    res.json(result)
  } catch (error) {
    console.error('Error fetching marketplace items:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get single marketplace item
router.get('/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params
    const cacheKey = `marketplace:item:${itemId}`
    
    const cachedItem = cache.get(cacheKey)
    if (cachedItem) {
      return res.json(cachedItem)
    }

    const { data: item, error } = await supabase
      .from('marketplace_items')
      .select(`
        *,
        profiles!marketplace_items_seller_id_fkey (
          id,
          username,
          full_name,
          avatar_url,
          created_at
        )
      `)
      .eq('id', itemId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Item not found' })
      }
      return res.status(500).json({ error: 'Failed to fetch item' })
    }

    cache.set(cacheKey, item, 300) // Cache for 5 minutes
    res.json(item)
  } catch (error) {
    console.error('Error fetching marketplace item:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create marketplace item
router.post('/', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { error: validationError, value } = createItemSchema.validate(req.body)
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message })
    }

    const { data: item, error } = await supabase
      .from('marketplace_items')
      .insert({
        ...value,
        seller_id: req.user!.id
      })
      .select(`
        *,
        profiles!marketplace_items_seller_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Create marketplace item error:', error)
      return res.status(500).json({ error: 'Failed to create item' })
    }

    // Clear cache
    cache.flushAll()

    res.status(201).json(item)
  } catch (error) {
    console.error('Error creating marketplace item:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update marketplace item
router.put('/:itemId', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { itemId } = req.params
    const { error: validationError, value } = updateItemSchema.validate(req.body)
    
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message })
    }

    // Check if user owns the item
    const { data: existingItem } = await supabase
      .from('marketplace_items')
      .select('seller_id')
      .eq('id', itemId)
      .single()

    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found' })
    }

    if (existingItem.seller_id !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to update this item' })
    }

    const { data: item, error } = await supabase
      .from('marketplace_items')
      .update({
        ...value,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select(`
        *,
        profiles!marketplace_items_seller_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Update marketplace item error:', error)
      return res.status(500).json({ error: 'Failed to update item' })
    }

    // Clear cache
    cache.flushAll()

    res.json(item)
  } catch (error) {
    console.error('Error updating marketplace item:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete marketplace item
router.delete('/:itemId', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { itemId } = req.params

    // Check if user owns the item
    const { data: existingItem } = await supabase
      .from('marketplace_items')
      .select('seller_id')
      .eq('id', itemId)
      .single()

    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found' })
    }

    if (existingItem.seller_id !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to delete this item' })
    }

    const { error } = await supabase
      .from('marketplace_items')
      .delete()
      .eq('id', itemId)

    if (error) {
      console.error('Delete marketplace item error:', error)
      return res.status(500).json({ error: 'Failed to delete item' })
    }

    // Clear cache
    cache.flushAll()

    res.json({ message: 'Item deleted successfully' })
  } catch (error) {
    console.error('Error deleting marketplace item:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user's marketplace items
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const cacheKey = `marketplace:user:${userId}`
    
    const cachedItems = cache.get(cacheKey)
    if (cachedItems) {
      return res.json(cachedItems)
    }

    const { data: items, error } = await supabase
      .from('marketplace_items')
      .select(`
        *,
        profiles!marketplace_items_seller_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('seller_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('User marketplace items query error:', error)
      return res.status(500).json({ error: 'Failed to fetch user items' })
    }

    cache.set(cacheKey, items, 180) // Cache for 3 minutes
    res.json(items || [])
  } catch (error) {
    console.error('Error fetching user marketplace items:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export { router as marketplaceRouter }
