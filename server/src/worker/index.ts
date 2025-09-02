import { v4 as uuidv4 } from 'uuid'
import { LogEntry } from '@bulk-email/shared'
import { emailQueue } from '../lib/queue.js'
import { smtpService } from '../lib/smtp.js'
import { sessionVault } from '../lib/sessionVault.js'
import { broadcastToSession } from '../lib/ws.js'

class EmailWorker {
  private isRunning = false
  private concurrency = 3 // Max concurrent emails
  private processingInterval = 1000 // Check for jobs every second

  start() {
    if (this.isRunning) return
    
    this.isRunning = true
    console.log('📧 Email worker started')
    
    this.processJobs()
  }

  stop() {
    this.isRunning = false
    console.log('📧 Email worker stopped')
  }

  private async processJobs() {
    while (this.isRunning) {
      try {
        const jobs = emailQueue.getNextJobs(this.concurrency)
        
        if (jobs.length > 0) {
          // Process jobs concurrently
          const promises = jobs.map(job => this.processJob(job))
          await Promise.allSettled(promises)
        }
        
        // Wait before checking for more jobs
        await this.sleep(this.processingInterval)
      } catch (error) {
        console.error('Worker error:', error)
        await this.sleep(5000) // Wait longer on error
      }
    }
  }

  private async processJob(job: any) {
    const { id: jobId, sessionId, recipient, emailData } = job
    
    try {
      // Mark job as processing
      emailQueue.markProcessing(jobId)
      
      // Create log entry for sending attempt
      const sendingLog: LogEntry = {
        id: uuidv4(),
        sessionId,
        recipient: recipient.email,
        status: 'sending',
        timestamp: new Date(),
        retryCount: job.retryCount
      }
      
      sessionVault.addLog(sessionId, sendingLog)
      
      // Broadcast sending event
      broadcastToSession(sessionId, {
        type: 'email_sending',
        sessionId,
        timestamp: new Date(),
        data: { recipient: recipient.email }
      })

      // Send the email
      const result = await smtpService.sendEmail(emailData, recipient)
      
      if (result.success) {
        // Mark as completed
        emailQueue.markCompleted(jobId)
        
        // Create success log entry
        const successLog: LogEntry = {
          id: uuidv4(),
          sessionId,
          recipient: recipient.email,
          status: 'sent',
          messageId: result.messageId,
          timestamp: new Date(),
          retryCount: job.retryCount
        }
        
        sessionVault.addLog(sessionId, successLog)
        
        // Broadcast success event
        broadcastToSession(sessionId, {
          type: 'email_sent',
          sessionId,
          timestamp: new Date(),
          data: {
            recipient: recipient.email,
            messageId: result.messageId!
          }
        })
        
      } else {
        // Handle failure
        const shouldRetry = this.shouldRetry(result.errorCode) && job.retryCount < job.maxRetries
        
        if (shouldRetry) {
          // Retry the job
          const retrySuccess = emailQueue.retryJob(jobId, this.getRetryDelay(job.retryCount))
          
          if (retrySuccess) {
            // Create retry log entry
            const retryLog: LogEntry = {
              id: uuidv4(),
              sessionId,
              recipient: recipient.email,
              status: 'retry',
              errorCode: result.errorCode,
              errorMessage: result.errorMessage,
              timestamp: new Date(),
              retryCount: job.retryCount
            }
            
            sessionVault.addLog(sessionId, retryLog)
            
            // Broadcast retry event
            broadcastToSession(sessionId, {
              type: 'email_retry',
              sessionId,
              timestamp: new Date(),
              data: {
                recipient: recipient.email,
                retryCount: job.retryCount + 1,
                nextAttemptIn: this.getRetryDelay(job.retryCount) / 1000
              }
            })
          } else {
            // Max retries reached, mark as failed
            this.handleJobFailure(job, result)
          }
        } else {
          // Don't retry, mark as failed
          this.handleJobFailure(job, result)
        }
      }
      
      // Update session stats and check completion
      await this.updateSessionProgress(sessionId)
      
    } catch (error: any) {
      console.error(`Job ${jobId} processing error:`, error)
      
      // Mark as failed
      emailQueue.markFailed(jobId)
      
      // Create error log entry
      const errorLog: LogEntry = {
        id: uuidv4(),
        sessionId,
        recipient: recipient.email,
        status: 'failed',
        errorCode: 'PROCESSING_ERROR',
        errorMessage: error.message,
        timestamp: new Date(),
        retryCount: job.retryCount
      }
      
      sessionVault.addLog(sessionId, errorLog)
      
      // Broadcast error event
      broadcastToSession(sessionId, {
        type: 'email_failed',
        sessionId,
        timestamp: new Date(),
        data: {
          recipient: recipient.email,
          errorCode: 'PROCESSING_ERROR',
          errorMessage: error.message,
          retryCount: job.retryCount,
          willRetry: false
        }
      })
    }
  }

  private handleJobFailure(job: any, result: any) {
    const { id: jobId, sessionId, recipient } = job
    
    // Mark as failed
    emailQueue.markFailed(jobId)
    
    // Create failure log entry
    const failureLog: LogEntry = {
      id: uuidv4(),
      sessionId,
      recipient: recipient.email,
      status: 'failed',
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
      timestamp: new Date(),
      retryCount: job.retryCount
    }
    
    sessionVault.addLog(sessionId, failureLog)
    
    // Broadcast failure event
    broadcastToSession(sessionId, {
      type: 'email_failed',
      sessionId,
      timestamp: new Date(),
      data: {
        recipient: recipient.email,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
        retryCount: job.retryCount,
        willRetry: false
      }
    })
  }

  private async updateSessionProgress(sessionId: string) {
    const session = sessionVault.getSession(sessionId)
    if (!session) return
    
    const queueStats = emailQueue.getSessionStats(sessionId)
    
    // Update session stats
    sessionVault.updateSession(sessionId, {
      stats: {
        total: session.recipients.length,
        sent: queueStats.completed,
        failed: queueStats.failed,
        pending: queueStats.pending + queueStats.processing
      }
    })
    
    // Broadcast stats update
    const updatedSession = sessionVault.getSession(sessionId)!
    broadcastToSession(sessionId, {
      type: 'stats_updated',
      sessionId,
      timestamp: new Date(),
      data: {
        total: updatedSession.stats.total,
        sent: updatedSession.stats.sent,
        failed: updatedSession.stats.failed,
        pending: updatedSession.stats.pending,
        rate: this.calculateRate(sessionId),
        eta: this.calculateETA(sessionId)
      }
    })
    
    // Check if session is complete
    if (queueStats.pending === 0 && queueStats.processing === 0) {
      sessionVault.updateSession(sessionId, {
        status: 'completed',
        completedAt: new Date()
      })
      
      // Broadcast completion event
      broadcastToSession(sessionId, {
        type: 'session_completed',
        sessionId,
        timestamp: new Date(),
        data: {
          totalSent: queueStats.completed,
          totalFailed: queueStats.failed,
          duration: this.calculateDuration(sessionId)
        }
      })
      
      // Cleanup queue after a delay
      setTimeout(() => {
        emailQueue.cleanupSession(sessionId)
      }, 60000) // Keep for 1 minute after completion
    }
  }

  private shouldRetry(errorCode?: string): boolean {
    if (!errorCode) return false
    
    // Retry on transient errors
    const retryableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'RATE_LIMITED',
      'QUOTA_EXCEEDED'
    ]
    
    return retryableErrors.includes(errorCode)
  }

  private getRetryDelay(retryCount: number): number {
    // Exponential backoff: 5s, 10s, 20s
    return Math.min(5000 * Math.pow(2, retryCount), 30000)
  }

  private calculateRate(sessionId: string): number {
    const session = sessionVault.getSession(sessionId)
    if (!session || !session.startedAt) return 0
    
    const elapsedMinutes = (Date.now() - session.startedAt.getTime()) / (1000 * 60)
    if (elapsedMinutes === 0) return 0
    
    return Math.round(session.stats.sent / elapsedMinutes)
  }

  private calculateETA(sessionId: string): number {
    const session = sessionVault.getSession(sessionId)
    if (!session || session.stats.pending === 0) return 0
    
    const rate = this.calculateRate(sessionId)
    if (rate === 0) return 0
    
    return Math.round((session.stats.pending / rate) * 60) // seconds
  }

  private calculateDuration(sessionId: string): number {
    const session = sessionVault.getSession(sessionId)
    if (!session || !session.startedAt) return 0
    
    const endTime = session.completedAt || new Date()
    return Math.round((endTime.getTime() - session.startedAt.getTime()) / 1000)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Start the worker
const worker = new EmailWorker()
worker.start()

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down email worker...')
  worker.stop()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('Shutting down email worker...')
  worker.stop()
  process.exit(0)
})
