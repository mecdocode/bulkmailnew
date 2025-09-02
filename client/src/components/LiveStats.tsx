import { Mail, CheckCircle, XCircle, Clock, Zap } from 'lucide-react'
import { EmailSession } from '@bulk-email/shared'

interface LiveStatsProps {
  session: EmailSession
}

export function LiveStats({ session }: LiveStatsProps) {
  const { stats } = session
  const progress = stats.total > 0 ? ((stats.sent + stats.failed) / stats.total) * 100 : 0

  const getStatusColor = (status: EmailSession['status']) => {
    switch (status) {
      case 'running': return 'text-green-600 bg-green-100'
      case 'paused': return 'text-yellow-600 bg-yellow-100'
      case 'completed': return 'text-blue-600 bg-blue-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatStatus = (status: EmailSession['status']) => {
    switch (status) {
      case 'running': return 'Sending'
      case 'paused': return 'Paused'
      case 'completed': return 'Completed'
      case 'cancelled': return 'Cancelled'
      default: return 'Idle'
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {/* Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg ${getStatusColor(session.status)}`}>
            <Zap className="w-5 h-5" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Status</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatStatus(session.status)}
            </p>
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
            <Mail className="w-5 h-5" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
          </div>
        </div>
      </div>

      {/* Sent */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="p-2 rounded-lg bg-green-100 text-green-600">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Sent</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.sent}</p>
          </div>
        </div>
      </div>

      {/* Failed */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="p-2 rounded-lg bg-red-100 text-red-600">
            <XCircle className="w-5 h-5" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Failed</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.failed}</p>
          </div>
        </div>
      </div>

      {/* Pending */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600">
            <Clock className="w-5 h-5" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Pending</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="md:col-span-2 lg:col-span-5 bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600">Progress</h3>
          <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-primary-600 h-3 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>{stats.sent + stats.failed} of {stats.total} processed</span>
          <span>{stats.pending} remaining</span>
        </div>
      </div>
    </div>
  )
}
