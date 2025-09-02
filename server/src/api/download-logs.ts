import { Router } from 'express'
import { ApiResponse } from '@bulk-email/shared'
import { sessionVault } from '../lib/sessionVault.js'

const router = Router()

router.get('/download-logs/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params

    const session = sessionVault.getSession(sessionId)
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      } as ApiResponse)
    }

    const logs = sessionVault.getLogs(sessionId)

    // Generate CSV content
    const csvHeaders = [
      'Timestamp',
      'Recipient',
      'Status',
      'Message ID',
      'Error Code',
      'Error Message',
      'Retry Count'
    ]

    const csvRows = logs.map(log => [
      log.timestamp.toISOString(),
      log.recipient,
      log.status,
      log.messageId || '',
      log.errorCode || '',
      log.errorMessage || '',
      log.retryCount.toString()
    ])

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="email-logs-${sessionId}.csv"`)
    res.send(csvContent)

  } catch (error: any) {
    console.error('Download logs error:', error)
    res.status(500).json({
      success: false,
      error: `Failed to download logs: ${error.message}`
    } as ApiResponse)
  }
})

export { router as downloadLogsRoute }
