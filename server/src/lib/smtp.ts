import nodemailer from 'nodemailer'
import { SMTPConfig, EmailData, Recipient } from '@bulk-email/shared'

export interface SendResult {
  success: boolean
  messageId?: string
  errorCode?: string
  errorMessage?: string
}

export class SMTPService {
  private transporter: nodemailer.Transporter | null = null
  private config: SMTPConfig | null = null

  async createTransporter(config?: SMTPConfig): Promise<void> {
    let smtpConfig: SMTPConfig;

    if (process.env.NODE_ENV === 'production') {
      smtpConfig = {
        host: process.env.SMTP_HOST || '',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
        },
      };
    } else if (config) {
      smtpConfig = config;
    } else {
      throw new Error('SMTP configuration is missing.');
    }

    this.config = smtpConfig;
    this.transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.auth.user,
        pass: smtpConfig.auth.pass,
      },
      pool: true, // Use connection pooling
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: 14, // Max 14 emails per second (Gmail limit)
    })
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.transporter) {
      return { success: false, message: 'No transporter configured' }
    }

    try {
      await this.transporter.verify()
      return { success: true, message: 'SMTP connection successful' }
    } catch (error: any) {
      return { 
        success: false, 
        message: `SMTP connection failed: ${error.message}` 
      }
    }
  }

  async sendEmail(emailData: EmailData, recipient: Recipient): Promise<SendResult> {
    if (!this.transporter) {
      return {
        success: false,
        errorCode: 'NO_TRANSPORTER',
        errorMessage: 'SMTP transporter not configured'
      }
    }

    try {
      // Replace merge tags in subject and content
      const processedSubject = this.replaceMergeTags(emailData.subject, recipient)
      const processedHtml = emailData.html ? this.replaceMergeTags(emailData.html, recipient) : undefined
      const processedText = emailData.text ? this.replaceMergeTags(emailData.text, recipient) : undefined

      const mailOptions: nodemailer.SendMailOptions = {
        from: emailData.from,
        to: recipient.email,
        subject: processedSubject,
        html: processedHtml,
        text: processedText,
        attachments: emailData.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType
        }))
      }

      const result = await this.transporter.sendMail(mailOptions)
      
      return {
        success: true,
        messageId: result.messageId
      }
    } catch (error: any) {
      return {
        success: false,
        errorCode: this.getErrorCode(error),
        errorMessage: error.message
      }
    }
  }

  private replaceMergeTags(content: string, recipient: Recipient): string {
    let processed = content

    // Replace {{email}} with recipient email
    processed = processed.replace(/\{\{email\}\}/g, recipient.email)
    
    // Replace {{name}} with recipient name (if available)
    if (recipient.name) {
      processed = processed.replace(/\{\{name\}\}/g, recipient.name)
    }

    // Replace custom variables
    if (recipient.variables) {
      for (const [key, value] of Object.entries(recipient.variables)) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
        processed = processed.replace(regex, value)
      }
    }

    return processed
  }

  private getErrorCode(error: any): string {
    if (error.code) {
      return error.code
    }
    
    if (error.response) {
      const response = error.response.toLowerCase()
      if (response.includes('authentication')) return 'AUTH_FAILED'
      if (response.includes('quota')) return 'QUOTA_EXCEEDED'
      if (response.includes('rate limit')) return 'RATE_LIMITED'
      if (response.includes('invalid')) return 'INVALID_RECIPIENT'
      if (response.includes('blocked')) return 'BLOCKED'
    }

    return 'UNKNOWN_ERROR'
  }

  async close(): Promise<void> {
    if (this.transporter) {
      this.transporter.close()
      this.transporter = null
    }
  }
}

// Singleton instance for connection pooling
export const smtpService = new SMTPService()
