import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Mail, Shield, Zap, Users, CheckCircle } from 'lucide-react'

export default function Landing() {
  const navigate = useNavigate()

  const features = [
    {
      icon: Mail,
      title: 'SMTP Integration',
      description: 'Works with Gmail, Outlook, Zoho, or custom SMTP servers'
    },
    {
      icon: Users,
      title: 'Bulk Recipients',
      description: 'Upload CSV or paste up to 2000 email addresses'
    },
    {
      icon: Zap,
      title: 'Real-time Monitoring',
      description: 'Live progress tracking with detailed logs and analytics'
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'No sign-up, no database, all data cleared after session'
    }
  ]

  const steps = [
    'Add your recipients (CSV or manual)',
    'Configure SMTP credentials',
    'Compose your email with HTML/text',
    'Set pacing controls',
    'Monitor sending in real-time'
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Send Bulk Emails with Confidence
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          A lightweight, secure bulk email tool that doesn't require sign-up or store your data. 
          Perfect for newsletters, announcements, and marketing campaigns.
        </p>
        <button
          onClick={() => navigate('/recipients')}
          className="btn-primary px-8 py-3 text-lg"
        >
          Start Sending
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        {features.map((feature, index) => (
          <div key={index} className="card">
            <div className="card-content">
              <feature.icon className="w-8 h-8 text-primary-600 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h2>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-6 h-6 bg-primary-600 text-white rounded-full text-sm font-medium">
                {index + 1}
              </div>
              <span className="text-gray-700">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="bg-green-50 rounded-lg border border-green-200 p-6">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900 mb-2">Secure & Private</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• No account creation or personal data collection</li>
              <li>• SMTP credentials never stored permanently</li>
              <li>• All session data cleared automatically</li>
              <li>• Open source and transparent</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Setup Guide */}
      <div className="mt-16 bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h3 className="font-semibold text-blue-900 mb-4">📧 SMTP Setup Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Gmail</h4>
            <p className="text-blue-700">Use App Passwords, not your regular password. Enable 2FA first.</p>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Outlook</h4>
            <p className="text-blue-700">Use smtp-mail.outlook.com with your Microsoft account.</p>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Custom SMTP</h4>
            <p className="text-blue-700">Get settings from your email provider or hosting service.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
