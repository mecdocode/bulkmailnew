import { Router, Request, Response } from 'express'
import { Multer } from 'multer'
import { v4 as uuidv4 } from 'uuid'
import { EmailSession, Recipient, SMTPConfig, EmailData, PacingConfig, ApiResponse } from '@bulk-email/shared'
import { sessionVault } from '../lib/sessionVault.js'
import { emailQueue } from '../lib/queue.js'
import { smtpService } from '../lib/smtp.js'
import { broadcastToSession } from '../lib/ws.js'

export function startSendRoute(upload: Multer): Router {
  const router = Router()

  router.post('/start-send', upload.array('attachments', 5), async (req, res) => {
    try {
      const {
        recipients: recipientsData,
        smtp: smtpConfig,
        email: emailData,
        pacing: pacingConfig
      } = req.body

      // Parse JSON strings
      const recipients: Recipient[] = JSON.parse(recipientsData)
      const smtp: SMTPConfig = JSON.parse(smtpConfig)
      const email: EmailData = JSON.parse(emailData)
      const pacing: PacingConfig = JSON.parse(pacingConfig)

      // Validate recipients
      if (!recipients || recipients.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No recipients provided'
        } as ApiResponse)
      }

      if (recipients.length > 2000) {
        return res.status(400).json({
          success: false,
          error: 'Maximum 2000 recipients allowed'
        } as ApiResponse)
      }

      // Validate email addresses
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const invalidEmails = recipients.filter(r => !emailRegex.test(r.email))
      if (invalidEmails.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid email addresses: ${invalidEmails.map(r => r.email).join(', ')}`
        } as ApiResponse)
      }

      // Process attachments
      const attachments = req.files ? (req.files as Express.Multer.File[]).map(file => ({
        filename: file.originalname,
        content: file.buffer,
        contentType: file.mimetype
      })) : []

      // Create session
      const sessionId = uuidv4()
      const session: EmailSession = {
        id: sessionId,
        recipients,
        smtp,
        email: {
          ...email,
          attachments
        },
        pacing,
        status: 'idle',
        stats: {
          total: recipients.length,
          sent: 0,
          failed: 0,
          pending: recipients.length
        },
        logs: [],
        createdAt: new Date()
      }

      // Store session
      sessionVault.createSession(session)

      // Setup SMTP transporter
      await smtpService.createTransporter(smtp)

      // Test SMTP connection
      const testResult = await smtpService.testConnection()
      if (!testResult.success) {
        sessionVault.deleteSession(sessionId)
        return res.status(400).json({
          success: false,
          error: `SMTP connection failed: ${testResult.message}`
        } as ApiResponse)
      }

      // Add jobs to queue
      emailQueue.addJobs(sessionId, recipients, session.email, pacing)

      // Update session status
      sessionVault.updateSession(sessionId, {
        status: 'running',
        startedAt: new Date()
      })

      // Broadcast session created event
      broadcastToSession(sessionId, {
        type: 'session_created',
        sessionId,
        timestamp: new Date(),
        data: {
          sessionId,
          totalRecipients: recipients.length
        }
      })

      // Broadcast session started event
      broadcastToSession(sessionId, {
        type: 'session_started',
        sessionId,
        timestamp: new Date()
      })

      res.json({
        success: true,
        data: {
          sessionId,
          message: 'Email sending session started',
          stats: session.stats
        }
      } as ApiResponse)

    } catch (error: any) {
      console.error('Start send error:', error)
      res.status(500).json({
        success: false,
        error: `Failed to start sending: ${error.message}`
      } as ApiResponse)
    }
  })

  return router
}
