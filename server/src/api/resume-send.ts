import { Router } from 'express'
import { ApiResponse } from '@bulk-email/shared'
import { sessionVault } from '../lib/sessionVault.js'
import { emailQueue } from '../lib/queue.js'
import { broadcastToSession } from '../lib/ws.js'

const router = Router()

router.post('/resume-send/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params

    const session = sessionVault.getSession(sessionId)
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      } as ApiResponse)
    }

    if (session.status !== 'paused') {
      return res.status(400).json({
        success: false,
        error: 'Session is not paused'
      } as ApiResponse)
    }

    // Resume the session
    emailQueue.resumeSession(sessionId)
    sessionVault.updateSession(sessionId, { status: 'running' })

    // Broadcast resume event
    broadcastToSession(sessionId, {
      type: 'session_resumed',
      sessionId,
      timestamp: new Date()
    })

    res.json({
      success: true,
      data: { message: 'Session resumed successfully' }
    } as ApiResponse)

  } catch (error: any) {
    console.error('Resume send error:', error)
    res.status(500).json({
      success: false,
      error: `Failed to resume session: ${error.message}`
    } as ApiResponse)
  }
})

export { router as resumeSendRoute }
