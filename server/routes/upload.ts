import express from 'express'
import multer from 'multer'
import { supabase } from '../index'
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth'

const router = express.Router()

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  }
})

// Upload single file
router.post('/image', authenticateUser, upload.single('image'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' })
    }

    const file = req.file
    const fileExt = file.originalname.split('.').pop()
    const fileName = `${req.user!.id}/${Date.now()}-${Math.random()}.${fileExt}`

    const { data, error: uploadError } = await supabase.storage
      .from('marketplace-images')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('File upload error:', uploadError)
      return res.status(500).json({ error: 'Failed to upload file' })
    }

    const { data: urlData } = supabase.storage
      .from('marketplace-images')
      .getPublicUrl(fileName)

    res.json({
      url: urlData.publicUrl,
      fileName: fileName
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Upload multiple files
router.post('/images', authenticateUser, upload.array('images', 10), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'No files provided' })
    }

    const uploadPromises = req.files.map(async (file) => {
      const fileExt = file.originalname.split('.').pop()
      const fileName = `${req.user!.id}/${Date.now()}-${Math.random()}.${fileExt}`

      const { data, error: uploadError } = await supabase.storage
        .from('marketplace-images')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      const { data: urlData } = supabase.storage
        .from('marketplace-images')
        .getPublicUrl(fileName)

      return {
        url: urlData.publicUrl,
        fileName: fileName
      }
    })

    const results = await Promise.all(uploadPromises)

    res.json({
      files: results
    })
  } catch (error) {
    console.error('Error uploading files:', error)
    res.status(500).json({ error: 'Failed to upload files' })
  }
})

export { router as uploadRouter }
