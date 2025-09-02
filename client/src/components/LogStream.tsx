import { CheckCircle, XCircle, RotateCcw, Clock } from 'lucide-react'
import { LogEntry } from '@bulk-email/shared'

interface LogStreamProps {
  logs: LogEntry[]
}

export function LogStream({ logs }: LogStreamProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'retry':
        return <RotateCcw className="w-4 h-4 text-yellow-600" />
      case 'sending':
        return <Clock className="w-4 h-4 text-blue-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-50 border-green-200'
      case 'failed': return 'bg-red-50 border-red-200'
      case 'retry': return 'bg-yellow-50 border-yellow-200'
      case 'sending': return 'bg-blue-50 border-blue-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  if (logs.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Clock className="w-8 h-8 mx-auto mb-3 text-gray-400" />
        <p>Waiting for email logs...</p>
        <p className="text-sm mt-1">Logs will appear here as emails are processed</p>
      </div>
    )
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      <div className="space-y-2 p-4">
        {logs.map((log) => (
          <div
            key={log.id}
            className={`border rounded-lg p-3 ${getStatusColor(log.status)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(log.status)}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {log.recipient}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatTime(log.timestamp)}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  log.status === 'sent' ? 'bg-green-100 text-green-800' :
                  log.status === 'failed' ? 'bg-red-100 text-red-800' :
                  log.status === 'retry' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {log.status.toUpperCase()}
                </span>
                {log.retryCount > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Retry #{log.retryCount}
                  </p>
                )}
              </div>
            </div>
            
            {log.messageId && (
              <p className="text-xs text-gray-600 mt-2 font-mono">
                ID: {log.messageId}
              </p>
            )}
            
            {log.errorMessage && (
              <p className="text-xs text-red-600 mt-2">
                {log.errorCode && `${log.errorCode}: `}{log.errorMessage}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
