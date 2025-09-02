import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Activity, Download, Pause, Play, Square, BarChart3 } from 'lucide-react'
import { LiveStats } from '../components/LiveStats'
import { LogStream } from '../components/LogStream'
import { useWebSocket } from '../lib/ws'
import { EmailSession, WebSocketEvent } from '@bulk-email/shared'

export default function Monitor() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [session, setSession] = useState<EmailSession | null>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [isConnected, setIsConnected] = useState(false)

  const { socket, connect, disconnect } = useWebSocket()

  useEffect(() => {
    if (!sessionId) return

    // Load session data first
    loadSession()

    // Connect to WebSocket
    connect()

    return () => {
      disconnect()
    }
  }, [sessionId, connect, disconnect])

  const loadSession = async () => {
    if (!sessionId) return
    
    try {
      const response = await fetch(`http://localhost:3001/api/session/${sessionId}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setSession(result.data)
        }
      }
    } catch (error) {
      console.error('Failed to load session:', error)
    }
  }

  useEffect(() => {
    if (!socket || !sessionId) return

    const handleConnect = () => {
      setIsConnected(true)
      socket.emit('join_session', sessionId)
    }

    const handleDisconnect = () => {
      setIsConnected(false)
    }

    const handleEmailEvent = (event: WebSocketEvent) => {
      console.log('Received event:', event)

      switch (event.type) {
        case 'session_created':
        case 'session_started':
        case 'session_paused':
        case 'session_resumed':
        case 'session_cancelled':
        case 'session_completed':
          // Update session status
          if (session) {
            setSession(prev => prev ? { ...prev, status: getSessionStatus(event.type) } : null)
          }
          break

        case 'email_sent':
        case 'email_failed':
        case 'email_retry':
          // Add to logs
          const logEntry = {
            id: Date.now().toString(),
            sessionId: event.sessionId,
            recipient: event.data.recipient,
            status: event.type === 'email_sent' ? 'sent' : event.type === 'email_failed' ? 'failed' : 'retry',
            messageId: event.type === 'email_sent' ? event.data.messageId : undefined,
            errorCode: event.type === 'email_failed' ? event.data.errorCode : undefined,
            errorMessage: event.type === 'email_failed' ? event.data.errorMessage : undefined,
            timestamp: new Date(event.timestamp),
            retryCount: (event.type === 'email_failed' || event.type === 'email_retry') ? event.data.retryCount : 0
          }
          setLogs(prev => [logEntry, ...prev].slice(0, 1000)) // Keep last 1000 logs
          break

        case 'stats_updated':
          // Update session stats
          if (session) {
            setSession(prev => prev ? {
              ...prev,
              stats: {
                total: event.data.total,
                sent: event.data.sent,
                failed: event.data.failed,
                pending: event.data.pending
              }
            } : null)
          }
          break
      }
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('email_event', handleEmailEvent)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('email_event', handleEmailEvent)
    }
  }, [socket, sessionId, session])

  const getSessionStatus = (eventType: string): EmailSession['status'] => {
    switch (eventType) {
      case 'session_started': return 'running'
      case 'session_paused': return 'paused'
      case 'session_resumed': return 'running'
      case 'session_cancelled': return 'cancelled'
      case 'session_completed': return 'completed'
      default: return 'idle'
    }
  }

  const handlePause = async () => {
    if (!sessionId) return
    
    try {
      const response = await fetch(`http://localhost:3001/api/pause-send/${sessionId}`, {
        method: 'POST'
      })
      const result = await response.json()
      if (!result.success) {
        alert(result.error)
      }
    } catch (error: any) {
      alert(`Failed to pause: ${error.message}`)
    }
  }

  const handleResume = async () => {
    if (!sessionId) return
    
    try {
      const response = await fetch(`http://localhost:3001/api/resume-send/${sessionId}`, {
        method: 'POST'
      })
      const result = await response.json()
      if (!result.success) {
        alert(result.error)
      }
    } catch (error: any) {
      alert(`Failed to resume: ${error.message}`)
    }
  }

  const handleCancel = async () => {
    if (!sessionId) return
    
    if (!confirm('Are you sure you want to cancel the sending session? This cannot be undone.')) {
      return
    }
    
    try {
      const response = await fetch(`http://localhost:3001/api/cancel-send/${sessionId}`, {
        method: 'POST'
      })
      const result = await response.json()
      if (!result.success) {
        alert(result.error)
      }
    } catch (error: any) {
      alert(`Failed to cancel: ${error.message}`)
    }
  }

  const handleDownloadLogs = () => {
    if (!sessionId) return
    
    const link = document.createElement('a')
    link.href = `http://localhost:3001/api/download-logs/${sessionId}`
    link.download = `email-logs-${sessionId}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Mock session data if not loaded yet
  const displaySession = session || {
    id: sessionId || '',
    status: 'running' as const,
    stats: { total: 0, sent: 0, failed: 0, pending: 0 },
    createdAt: new Date(),
    recipients: [],
    smtp: { host: '', port: 587, secure: false, auth: { user: '', pass: '' } },
    email: { from: '', subject: '', html: '', text: '' },
    pacing: { delayMs: 2000, concurrency: 1 },
    logs: []
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
                  <Activity className="w-6 h-6 mr-3 text-primary-600" />
                  Live Monitor
                </h1>
                <p className="text-gray-600 mt-1">Session: {sessionId}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                  isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  {isConnected ? 'Connected' : 'Disconnected'}
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {displaySession.status === 'running' && (
                  <button
                    onClick={handlePause}
                    className="btn-outline"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </button>
                )}
                
                {displaySession.status === 'paused' && (
                  <button
                    onClick={handleResume}
                    className="btn-primary"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </button>
                )}
                
                {(displaySession.status === 'running' || displaySession.status === 'paused') && (
                  <button
                    onClick={handleCancel}
                    className="btn-outline text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleDownloadLogs}
                  className="btn-outline"
                  disabled={logs.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Logs
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <LiveStats session={displaySession} />
        </div>

        {/* Logs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-primary-600" />
              Email Logs
            </h2>
          </div>
          <LogStream logs={logs} />
        </div>
      </div>
    </div>
  )
}
