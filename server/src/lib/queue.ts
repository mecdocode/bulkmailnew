import { v4 as uuidv4 } from 'uuid'
import { EmailData, Recipient, PacingConfig } from '@bulk-email/shared'

export interface EmailJob {
  id: string
  sessionId: string
  recipient: Recipient
  emailData: EmailData
  retryCount: number
  maxRetries: number
  scheduledAt: Date
  createdAt: Date
}

export interface QueueStats {
  pending: number
  processing: number
  completed: number
  failed: number
}

class EmailQueue {
  private jobs: EmailJob[] = []
  private processing = new Set<string>()
  private completed = new Set<string>()
  private failed = new Set<string>()
  private paused = new Set<string>() // Paused sessions
  private cancelled = new Set<string>() // Cancelled sessions

  // Add jobs for a session
  addJobs(sessionId: string, recipients: Recipient[], emailData: EmailData, pacing: PacingConfig): EmailJob[] {
    const jobs: EmailJob[] = []
    const now = new Date()

    recipients.forEach((recipient, index) => {
      const job: EmailJob = {
        id: uuidv4(),
        sessionId,
        recipient,
        emailData,
        retryCount: 0,
        maxRetries: 3,
        scheduledAt: new Date(now.getTime() + (index * pacing.delayMs)),
        createdAt: now
      }
      
      jobs.push(job)
      this.jobs.push(job)
    })

    return jobs
  }

  // Get next available jobs (respecting concurrency and pacing)
  getNextJobs(concurrency: number): EmailJob[] {
    const now = new Date()
    const availableJobs: EmailJob[] = []

    // Filter jobs that are ready to process
    const readyJobs = this.jobs.filter(job => 
      !this.processing.has(job.id) &&
      !this.completed.has(job.id) &&
      !this.failed.has(job.id) &&
      !this.paused.has(job.sessionId) &&
      !this.cancelled.has(job.sessionId) &&
      job.scheduledAt <= now
    )

    // Group by session to respect per-session concurrency
    const sessionJobs = new Map<string, EmailJob[]>()
    readyJobs.forEach(job => {
      if (!sessionJobs.has(job.sessionId)) {
        sessionJobs.set(job.sessionId, [])
      }
      sessionJobs.get(job.sessionId)!.push(job)
    })

    // Select jobs respecting global concurrency limit
    let selected = 0
    for (const [sessionId, jobs] of sessionJobs.entries()) {
      if (selected >= concurrency) break
      
      // Sort by scheduled time
      jobs.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
      
      // Take jobs up to concurrency limit
      const sessionProcessing = Array.from(this.processing).filter(jobId => {
        const job = this.jobs.find(j => j.id === jobId)
        return job?.sessionId === sessionId
      }).length

      const canTake = Math.min(
        jobs.length,
        concurrency - selected,
        Math.max(0, 2 - sessionProcessing) // Max 2 concurrent per session
      )

      availableJobs.push(...jobs.slice(0, canTake))
      selected += canTake
    }

    return availableJobs
  }

  // Mark job as processing
  markProcessing(jobId: string): void {
    this.processing.add(jobId)
  }

  // Mark job as completed
  markCompleted(jobId: string): void {
    this.processing.delete(jobId)
    this.completed.add(jobId)
  }

  // Mark job as failed
  markFailed(jobId: string): void {
    this.processing.delete(jobId)
    this.failed.add(jobId)
  }

  // Retry a failed job
  retryJob(jobId: string, delayMs: number = 5000): boolean {
    const job = this.jobs.find(j => j.id === jobId)
    if (!job || job.retryCount >= job.maxRetries) {
      return false
    }

    // Remove from failed set and reschedule
    this.failed.delete(jobId)
    job.retryCount++
    job.scheduledAt = new Date(Date.now() + delayMs * Math.pow(2, job.retryCount)) // Exponential backoff

    return true
  }

  // Session control
  pauseSession(sessionId: string): void {
    this.paused.add(sessionId)
  }

  resumeSession(sessionId: string): void {
    this.paused.delete(sessionId)
  }

  cancelSession(sessionId: string): void {
    this.cancelled.add(sessionId)
    
    // Move all processing jobs back to pending
    const sessionJobs = this.jobs.filter(job => job.sessionId === sessionId)
    sessionJobs.forEach(job => {
      if (this.processing.has(job.id)) {
        this.processing.delete(job.id)
      }
    })
  }

  // Get session statistics
  getSessionStats(sessionId: string): QueueStats {
    const sessionJobs = this.jobs.filter(job => job.sessionId === sessionId)
    
    return {
      pending: sessionJobs.filter(job => 
        !this.processing.has(job.id) && 
        !this.completed.has(job.id) && 
        !this.failed.has(job.id)
      ).length,
      processing: sessionJobs.filter(job => this.processing.has(job.id)).length,
      completed: sessionJobs.filter(job => this.completed.has(job.id)).length,
      failed: sessionJobs.filter(job => this.failed.has(job.id)).length
    }
  }

  // Get job by ID
  getJob(jobId: string): EmailJob | undefined {
    return this.jobs.find(job => job.id === jobId)
  }

  // Clean up completed sessions
  cleanupSession(sessionId: string): void {
    this.jobs = this.jobs.filter(job => job.sessionId !== sessionId)
    
    // Clean up tracking sets
    const sessionJobIds = this.jobs
      .filter(job => job.sessionId === sessionId)
      .map(job => job.id)
    
    sessionJobIds.forEach(jobId => {
      this.processing.delete(jobId)
      this.completed.delete(jobId)
      this.failed.delete(jobId)
    })
    
    this.paused.delete(sessionId)
    this.cancelled.delete(sessionId)
  }

  // Get overall queue stats
  getOverallStats(): QueueStats & { sessions: number } {
    return {
      pending: this.jobs.length - this.processing.size - this.completed.size - this.failed.size,
      processing: this.processing.size,
      completed: this.completed.size,
      failed: this.failed.size,
      sessions: new Set(this.jobs.map(job => job.sessionId)).size
    }
  }
}

// Singleton instance
export const emailQueue = new EmailQueue()
