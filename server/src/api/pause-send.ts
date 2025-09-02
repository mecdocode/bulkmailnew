import { Router } from 'express'
import { ApiResponse } from '@bulk-email/shared'
import { sessionVault } from '../lib/sessionVault.js'
import { emailQueue } from '../lib/queue.js'
import { broadcastToSession } from '../lib/ws.js'

const router = Router()

router.post('/pause-send/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params

    const session = sessionVault.getSession(sessionId)
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      } as ApiResponse)
    }

    if (session.status !== 'running') {
      return res.status(400).json({
        success: false,
        error: 'Session is not running'
      } as ApiResponse)
    }

    // Pause the session
    emailQueue.pauseSession(sessionId)
    sessionVault.updateSession(sessionId, { status: 'paused' })

    // Broadcast pause event
    broadcastToSession(sessionId, {
      type: 'session_paused',
      sessionId,
      timestamp: new Date()
    })

    res.json({
      success: true,
      data: { message: 'Session paused successfully' }
    } as ApiResponse)

  } catch (error: any) {
    console.error('Pause send error:', error)
    res.status(500).json({
      success: false,
      error: `Failed to pause session: ${error.message}`
    } as ApiResponse)
  }
})

export { router as pauseSendRoute }
