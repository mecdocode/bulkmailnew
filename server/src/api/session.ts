import { Router } from 'express'
import { ApiResponse } from '@bulk-email/shared'
import { sessionVault } from '../lib/sessionVault.js'

export const sessionRoute = Router()

// Get session data
sessionRoute.get('/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params
    
    const session = sessionVault.getSession(sessionId)
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      } as ApiResponse)
    }

    res.json({
      success: true,
      data: session
    } as ApiResponse)

  } catch (error: any) {
    console.error('Get session error:', error)
    res.status(500).json({
      success: false,
      error: `Failed to get session: ${error.message}`
    } as ApiResponse)
  }
})
