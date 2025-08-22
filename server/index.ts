import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { createClient } from '@supabase/supabase-js'
import NodeCache from 'node-cache'

// Routes
import { postsRouter } from './routes/posts'
import { marketplaceRouter } from './routes/marketplace'
import { profilesRouter } from './routes/profiles'
import { communitiesRouter } from './routes/communities'
import { messagesRouter } from './routes/messages'
import { uploadRouter } from './routes/upload'

// Initialize Supabase client for server-side operations
const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Initialize cache
export const cache = new NodeCache({ stdTTL: 300 }) // 5 minutes default TTL

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}))
app.use(compression())

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
})
app.use('/api/', limiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api/posts', postsRouter)
app.use('/api/marketplace', marketplaceRouter)
app.use('/api/profiles', profilesRouter)
app.use('/api/communities', communitiesRouter)
app.use('/api/messages', messagesRouter)
app.use('/api/upload', uploadRouter)

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err)
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
})
