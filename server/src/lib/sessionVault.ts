import { EmailSession, LogEntry } from '@bulk-email/shared'

// In-memory session storage (no Redis needed)
class SessionVault {
  private sessions = new Map<string, EmailSession>()
  private logs = new Map<string, LogEntry[]>()

  // Session management
  createSession(session: EmailSession): void {
    this.sessions.set(session.id, session)
    this.logs.set(session.id, [])
  }

  getSession(sessionId: string): EmailSession | undefined {
    return this.sessions.get(sessionId)
  }

  updateSession(sessionId: string, updates: Partial<EmailSession>): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      Object.assign(session, updates)
    }
  }

  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId)
    this.logs.delete(sessionId)
  }

  getAllSessions(): EmailSession[] {
    return Array.from(this.sessions.values())
  }

  // Log management
  addLog(sessionId: string, log: LogEntry): void {
    const sessionLogs = this.logs.get(sessionId) || []
    sessionLogs.push(log)
    this.logs.set(sessionId, sessionLogs)

    // Update session stats
    const session = this.sessions.get(sessionId)
    if (session) {
      session.logs = sessionLogs
      this.updateSessionStats(sessionId)
    }
  }

  getLogs(sessionId: string): LogEntry[] {
    return this.logs.get(sessionId) || []
  }

  // Update session statistics based on logs
  private updateSessionStats(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    const logs = this.logs.get(sessionId)
    
    if (!session || !logs) return

    const stats = {
      total: session.recipients.length,
      sent: logs.filter(log => log.status === 'sent').length,
      failed: logs.filter(log => log.status === 'failed').length,
      pending: 0
    }
    
    stats.pending = stats.total - stats.sent - stats.failed

    session.stats = stats
  }

  // Cleanup old sessions (called periodically)
  cleanup(maxAgeHours: number = 24): void {
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000)
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.createdAt < cutoff) {
        this.deleteSession(sessionId)
      }
    }
  }

  // Get memory usage info
  getStats(): { sessions: number; totalLogs: number } {
    let totalLogs = 0
    for (const logs of this.logs.values()) {
      totalLogs += logs.length
    }
    
    return {
      sessions: this.sessions.size,
      totalLogs
    }
  }
}

// Singleton instance
export const sessionVault = new SessionVault()

// Cleanup old sessions every hour
setInterval(() => {
  sessionVault.cleanup()
}, 60 * 60 * 1000)
