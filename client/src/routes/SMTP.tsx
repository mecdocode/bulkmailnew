import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Server, ArrowRight, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { WizardStepper } from '../components/WizardStepper'
import { SMTPConfig } from '@bulk-email/shared'

export default function SMTP() {
  const navigate = useNavigate()
  const [smtpConfig, setSMTPConfig] = useState<SMTPConfig>({
    host: '',
    port: 587,
    secure: false,
    auth: {
      user: '',
      pass: ''
    }
  })
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const steps = [
    { id: 'recipients', title: 'Recipients', description: 'Add email addresses', status: 'completed' as const },
    { id: 'smtp', title: 'SMTP Config', description: 'Email server settings', status: 'active' as const },
    { id: 'compose', title: 'Compose', description: 'Write your email', status: 'inactive' as const },
    { id: 'pacing', title: 'Pacing', description: 'Sending controls', status: 'inactive' as const }
  ]

  useEffect(() => {
    // Check if recipients exist
    const recipients = localStorage.getItem('recipients')
    if (!recipients) {
      navigate('/recipients')
    }
  }, [navigate])

  const handleTestConnection = async () => {
    if (!smtpConfig.host || !smtpConfig.auth.user || !smtpConfig.auth.pass) {
      setTestResult({ success: false, message: 'Please fill in all required fields' })
      return
    }

    setIsTestingConnection(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/test-smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(smtpConfig),
      })

      const result = await response.json()
      
      if (result.success) {
        setTestResult({ success: true, message: result.data.message })
      } else {
        setTestResult({ success: false, message: result.error || 'Connection test failed' })
      }
    } catch (error: any) {
      setTestResult({ success: false, message: `Network error: ${error.message}` })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleNext = () => {
    if (!testResult?.success) {
      setTestResult({ success: false, message: 'Please test the connection first' })
      return
    }

    // Store SMTP config for next step
    localStorage.setItem('smtpConfig', JSON.stringify(smtpConfig))
    navigate('/compose')
  }

  const presets = [
    {
      name: 'Gmail',
      config: { host: 'smtp.gmail.com', port: 587, secure: false }
    },
    {
      name: 'Outlook',
      config: { host: 'smtp-mail.outlook.com', port: 587, secure: false }
    },
    {
      name: 'Yahoo',
      config: { host: 'smtp.mail.yahoo.com', port: 587, secure: false }
    },
    {
      name: 'Zoho',
      config: { host: 'smtp.zoho.com', port: 587, secure: false }
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <WizardStepper steps={steps} currentStep="smtp" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
              <Server className="w-6 h-6 mr-3 text-primary-600" />
              SMTP Configuration
            </h2>
            <p className="text-gray-600 mt-2">
              Configure your email server settings. We recommend using app passwords for better security.
            </p>
          </div>

          <div className="p-6">
            {/* Quick Presets */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Setup</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {presets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setSMTPConfig((prev: any) => ({ ...prev, ...preset.config }))}
                    className="p-3 text-sm border border-gray-300 rounded-md hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* SMTP Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Host *
                </label>
                <input
                  type="text"
                  value={smtpConfig.host}
                  onChange={(e) => setSMTPConfig((prev: any) => ({ ...prev, host: e.target.value }))}
                  className="input w-full"
                  placeholder="smtp.gmail.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Port *
                </label>
                <input
                  type="number"
                  value={smtpConfig.port}
                  onChange={(e) => setSMTPConfig((prev: any) => ({ ...prev, port: parseInt(e.target.value) }))}
                  className="input w-full"
                  placeholder="587"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username/Email *
                </label>
                <input
                  type="email"
                  value={smtpConfig.auth.user}
                  onChange={(e) => setSMTPConfig((prev: any) => ({ 
                    ...prev, 
                    auth: { ...prev.auth, user: e.target.value }
                  }))}
                  className="input w-full"
                  placeholder="your-email@gmail.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password/App Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={smtpConfig.auth.pass}
                    onChange={(e) => setSMTPConfig((prev: any) => ({ 
                      ...prev, 
                      auth: { ...prev.auth, pass: e.target.value }
                    }))}
                    className="input w-full pr-10"
                    placeholder="your-app-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Security Toggle */}
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={smtpConfig.secure}
                  onChange={(e) => setSMTPConfig((prev: any) => ({ ...prev, secure: e.target.checked }))}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Use SSL/TLS (port 465)
                </span>
              </label>
            </div>

            {/* Test Connection */}
            <div className="mb-6">
              <button
                onClick={handleTestConnection}
                disabled={isTestingConnection}
                className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTestingConnection ? 'Testing...' : 'Test Connection'}
              </button>

              {testResult && (
                <div className={`mt-3 p-3 rounded-md flex items-start space-x-2 ${
                  testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${
                      testResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                    </p>
                    <p className={`text-sm ${
                      testResult.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {testResult.message}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-blue-900 mb-2">🔒 Security Tips</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use App Passwords instead of your regular password</li>
                <li>• Enable 2-factor authentication on your email account</li>
                <li>• Your credentials are never stored permanently</li>
                <li>• All data is cleared when you close the browser</li>
              </ul>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <button
                onClick={() => navigate('/recipients')}
                className="btn-outline"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
              
              <button
                onClick={handleNext}
                disabled={!testResult?.success}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
