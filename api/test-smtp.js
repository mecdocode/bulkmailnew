const nodemailer = require('nodemailer')

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
  }

  try {
    const smtpConfig = req.body

    // Validate required fields
    if (!smtpConfig || !smtpConfig.host || !smtpConfig.port || !smtpConfig.auth?.user || !smtpConfig.auth?.pass) {
      return res.status(400).json({
        success: false,
        error: 'Missing required SMTP configuration fields'
      })
    }

    // Create transporter for testing
    const transporter = nodemailer.createTransporter({
      host: smtpConfig.host,
      port: parseInt(smtpConfig.port),
      secure: smtpConfig.secure || false,
      auth: {
        user: smtpConfig.auth.user,
        pass: smtpConfig.auth.pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000
    })
    
    // Test connection
    try {
      await transporter.verify()
      
      const response = {
        success: true,
        message: 'SMTP connection successful',
        details: {
          host: smtpConfig.host,
          port: smtpConfig.port,
          secure: smtpConfig.secure || false
        }
      }

      res.status(200).json({
        success: true,
        data: response
      })
    } catch (testError) {
      res.status(200).json({
        success: true,
        data: {
          success: false,
          message: `SMTP connection failed: ${testError.message}`
        }
      })
    } finally {
      if (transporter && typeof transporter.close === 'function') {
        transporter.close()
      }
    }

  } catch (error) {
    console.error('SMTP test error:', error)
    res.status(500).json({
      success: false,
      error: `SMTP test failed: ${error.message || 'Unknown error'}`
    })
  }
}
