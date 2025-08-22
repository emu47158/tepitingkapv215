import express from 'express'
import Joi from 'joi'
import { supabase, cache } from '../index'
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth'

const router = express.Router()

// Validation schemas
const sendMessageSchema = Joi.object({
  receiver_id: Joi.string().uuid().required(),
  content: Joi.string().required().min(1).max(1000),
  item_id: Joi.string().uuid().optional()
})

// Get user conversations
router.get('/conversations', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const cacheKey = `conversations:${req.user!.id}`
    const cachedConversations = cache.get(cacheKey)
    
    if (cachedConversations) {
      return res.json(cachedConversations)
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        profiles!messages_sender_id_fkey (*),
        marketplace_items (*)
      `)
      .or(`sender_id.eq.${req.user!.id},receiver_id.eq.${req.user!.id}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Conversations query error:', error)
      return res.status(500).json({ error: 'Failed to fetch conversations' })
    }

    cache.set(cacheKey, messages, 60) // Cache for 1 minute
    res.json(messages || [])
  } catch (error) {
    console.error('Error fetching conversations:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get messages for a conversation
router.get('/conversation/:conversationId', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { conversationId } = req.params
    const cacheKey = `messages:${conversationId}`
    
    const cachedMessages = cache.get(cacheKey)
    if (cachedMessages) {
      return res.json(cachedMessages)
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        profiles!messages_sender_id_fkey (*)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Messages query error:', error)
      return res.status(500).json({ error: 'Failed to fetch messages' })
    }

    cache.set(cacheKey, messages, 30) // Cache for 30 seconds
    res.json(messages || [])
  } catch (error) {
    console.error('Error fetching messages:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Send message
router.post('/', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { error: validationError, value } = sendMessageSchema.validate(req.body)
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message })
    }

    const { receiver_id, content, item_id } = value

    // Create conversation ID by sorting user IDs
    const conversationId = [req.user!.id, receiver_id].sort().join('-')

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: req.user!.id,
        receiver_id,
        content,
        item_id
      })
      .select(`
        *,
        profiles!messages_sender_id_fkey (*)
      `)
      .single()

    if (error) {
      console.error('Send message error:', error)
      return res.status(500).json({ error: 'Failed to send message' })
    }

    // Clear relevant caches
    cache.del(`conversations:${req.user!.id}`)
    cache.del(`conversations:${receiver_id}`)
    cache.del(`messages:${conversationId}`)

    res.status(201).json(message)
  } catch (error) {
    console.error('Error sending message:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Mark message as read
router.put('/:messageId/read', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { messageId } = req.params

    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('receiver_id', req.user!.id) // Only receiver can mark as read

    if (error) {
      console.error('Mark message read error:', error)
      return res.status(500).json({ error: 'Failed to mark message as read' })
    }

    // Clear cache
    cache.flushAll()

    res.json({ message: 'Message marked as read' })
  } catch (error) {
    console.error('Error marking message as read:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export { router as messagesRouter }
