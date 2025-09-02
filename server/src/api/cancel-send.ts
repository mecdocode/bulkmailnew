import { Router } from 'express'
import { ApiResponse } from '@bulk-email/shared'
import { sessionVault } from '../lib/sessionVault.js'
import { emailQueue } from '../lib/queue.js'
import { broadcastToSession } from '../lib/ws.js'

const router = Router()

router.post('/cancel-send/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params

    const session = sessionVault.getSession(sessionId)
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      } as ApiResponse)
    }

    if (session.status === 'completed' || session.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Session already completed or cancelled'
      } as ApiResponse)
    }

    // Cancel the session
    emailQueue.cancelSession(sessionId)
    sessionVault.updateSession(sessionId, { 
      status: 'cancelled',
      completedAt: new Date()
    })

    // Broadcast cancel event
    broadcastToSession(sessionId, {
      type: 'session_cancelled',
      sessionId,
      timestamp: new Date()
    })

    res.json({
      success: true,
      data: { message: 'Session cancelled successfully' }
    } as ApiResponse)

  } catch (error: any) {
    console.error('Cancel send error:', error)
    res.status(500).json({
      success: false,
      error: `Failed to cancel session: ${error.message}`
    } as ApiResponse)
  }
})

export { router as cancelSendRoute }
