import { Router } from 'express'
import { SMTPConfig, TestSMTPResponse, ApiResponse } from '@bulk-email/shared'
import { SMTPService } from '../lib/smtp.js'

const router: Router = Router()

router.post('/test-smtp', async (req, res) => {
  try {
    const smtpConfig: SMTPConfig = req.body

    // Validate required fields
    if (!smtpConfig.host || !smtpConfig.port || !smtpConfig.auth?.user || !smtpConfig.auth?.pass) {
      return res.status(400).json({
        success: false,
        error: 'Missing required SMTP configuration fields'
      } as ApiResponse)
    }

    // Create temporary SMTP service for testing
    const testService = new SMTPService()
    await testService.createTransporter(smtpConfig)
    
    const result = await testService.testConnection()
    await testService.close()

    const response: TestSMTPResponse = {
      success: result.success,
      message: result.message,
      details: result.success ? {
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure
      } : undefined
    }

    res.json({
      success: true,
      data: response
    } as ApiResponse<TestSMTPResponse>)

  } catch (error: any) {
    console.error('SMTP test error:', error)
    res.status(500).json({
      success: false,
      error: `SMTP test failed: ${error.message}`
    } as ApiResponse)
  }
})

export { router as testSMTPRoute }
