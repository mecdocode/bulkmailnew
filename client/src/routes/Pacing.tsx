import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, ArrowLeft, Play, AlertCircle } from 'lucide-react'
import { WizardStepper } from '../components/WizardStepper'
import { PacingControls } from '../components/PacingControls'
import { PacingConfig } from '@bulk-email/shared'
import { useAttachments } from '../contexts/AttachmentContext'

export default function Pacing() {
  const navigate = useNavigate()
  const { attachmentFiles, clearAttachments } = useAttachments()
  const [pacingConfig, setPacingConfig] = useState<PacingConfig>({
    delayMs: 2000, // 2 seconds default
    concurrency: 1 // 1 concurrent email default
  })
  const [recipients, setRecipients] = useState<any[]>([])
  const [isStarting, setIsStarting] = useState(false)

  const steps = [
    { id: 'recipients', title: 'Recipients', description: 'Add email addresses', status: 'completed' as const },
    { id: 'smtp', title: 'SMTP Config', description: 'Email server settings', status: 'completed' as const },
    { id: 'compose', title: 'Compose', description: 'Write your email', status: 'completed' as const },
    { id: 'pacing', title: 'Pacing', description: 'Sending controls', status: 'active' as const }
  ]

  useEffect(() => {
    // Check if previous steps are completed
    const recipientsData = localStorage.getItem('recipients')
    const smtpConfig = localStorage.getItem('smtpConfig')
    const emailData = localStorage.getItem('emailData')
    
    if (!recipientsData) {
      navigate('/recipients')
      return
    }
    if (!smtpConfig) {
      navigate('/smtp')
      return
    }
    if (!emailData) {
      navigate('/compose')
      return
    }

    try {
      setRecipients(JSON.parse(recipientsData))
    } catch (error) {
      console.error('Failed to parse recipients:', error)
      navigate('/recipients')
    }
  }, [navigate])

  const calculateStats = () => {
    const emailsPerMinute = Math.round(60000 / (pacingConfig.delayMs + 1000)) * pacingConfig.concurrency
    const totalMinutes = Math.ceil(recipients.length / emailsPerMinute)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    return {
      emailsPerMinute,
      totalTime: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
      totalMinutes
    }
  }

  const handleStartSending = async () => {
    setIsStarting(true)

    try {
      // Prepare form data
      const formData = new FormData()
      
      // Get stored data
      const recipientsData = localStorage.getItem('recipients')
      const smtpConfig = localStorage.getItem('smtpConfig')
      const emailData = localStorage.getItem('emailData')

      if (!recipientsData || !smtpConfig || !emailData) {
        throw new Error('Missing required data')
      }

      // Parse email data to handle attachments
      const parsedEmailData = JSON.parse(emailData)
      
      // Add text data
      formData.append('recipients', recipientsData)
      formData.append('smtp', smtpConfig)
      formData.append('email', JSON.stringify({
        ...parsedEmailData,
        attachments: [] // Will be added separately
      }))
      formData.append('pacing', JSON.stringify(pacingConfig))

      // Add attachments from context
      if (attachmentFiles && attachmentFiles.length > 0) {
        attachmentFiles.forEach((file: File) => {
          formData.append('attachments', file)
        })
      }

      const response = await fetch('/api/start-send', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        // Clear stored data
        localStorage.removeItem('recipients')
        localStorage.removeItem('smtpConfig')
        localStorage.removeItem('emailData')
        
        // Clear attachments from context
        clearAttachments()
        
        // Navigate to monitor
        navigate(`/monitor/${result.data.sessionId}`)
      } else {
        throw new Error(result.error || 'Failed to start sending')
      }
    } catch (error: any) {
      alert(`Failed to start sending: ${error.message}`)
    } finally {
      setIsStarting(false)
    }
  }

  const stats = calculateStats()

  return (
    <div className="min-h-screen bg-gray-50">
      <WizardStepper steps={steps} currentStep="pacing" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
              <Clock className="w-6 h-6 mr-3 text-primary-600" />
              Pacing Controls
            </h2>
            <p className="text-gray-600 mt-2">
              Configure sending speed and concurrency. Conservative settings help avoid rate limits.
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Controls */}
              <div className="space-y-6">
                <PacingControls
                  config={pacingConfig}
                  onChange={setPacingConfig}
                />

                {/* Recommendations */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-3">📧 Provider Recommendations</h4>
                  <div className="text-sm text-blue-800 space-y-2">
                    <div><strong>Gmail:</strong> 2s delay, 1 concurrent (500/day limit)</div>
                    <div><strong>Outlook:</strong> 1s delay, 2 concurrent (300/day limit)</div>
                    <div><strong>Custom SMTP:</strong> Check with your provider</div>
                  </div>
                </div>

                {/* Warning for high volume */}
                {recipients.length > 100 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-900">High Volume Detected</h4>
                        <p className="text-sm text-yellow-800 mt-1">
                          You're sending to {recipients.length} recipients. Consider using conservative settings to avoid being blocked.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats & Preview */}
              <div className="space-y-6">
                {/* Sending Statistics */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Sending Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Recipients:</span>
                      <span className="font-medium">{recipients.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Emails per Minute:</span>
                      <span className="font-medium">{stats.emailsPerMinute}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estimated Time:</span>
                      <span className="font-medium">{stats.totalTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delay Between Emails:</span>
                      <span className="font-medium">{pacingConfig.delayMs / 1000}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Concurrent Connections:</span>
                      <span className="font-medium">{pacingConfig.concurrency}</span>
                    </div>
                  </div>
                </div>

                {/* Session Summary */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-3">✅ Ready to Send</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• {recipients.length} recipients loaded</li>
                    <li>• SMTP connection tested</li>
                    <li>• Email content prepared</li>
                    <li>• Pacing configured</li>
                  </ul>
                </div>

                {/* Final Warning */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2">⚠️ Important</h4>
                  <p className="text-sm text-red-800">
                    Once started, the sending process will begin immediately. Make sure you've reviewed all settings carefully.
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => navigate('/compose')}
                className="btn-outline"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
              
              <button
                onClick={handleStartSending}
                disabled={isStarting}
                className="btn-primary text-lg px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isStarting ? (
                  'Starting...'
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Start Sending
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
