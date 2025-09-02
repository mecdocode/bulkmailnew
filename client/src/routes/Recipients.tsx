import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Users, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react'
import { WizardStepper } from '../components/WizardStepper'
import { CSVDropzone } from '../components/CSVDropzone'
import { RecipientTable } from '../components/RecipientTable'
import { Recipient } from '@bulk-email/shared'

export default function Recipients() {
  const navigate = useNavigate()
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [manualInput, setManualInput] = useState('')
  const [inputMode, setInputMode] = useState<'manual' | 'csv'>('manual')
  const [errors, setErrors] = useState<string[]>([])

  const steps = [
    { id: 'recipients', title: 'Recipients', description: 'Add email addresses', status: 'active' as const },
    { id: 'smtp', title: 'SMTP Config', description: 'Email server settings', status: 'inactive' as const },
    { id: 'compose', title: 'Compose', description: 'Write your email', status: 'inactive' as const },
    { id: 'pacing', title: 'Pacing', description: 'Sending controls', status: 'inactive' as const }
  ]

  const handleManualInput = () => {
    const lines = manualInput.trim().split('\n')
    const newRecipients: Recipient[] = []
    const newErrors: string[] = []

    lines.forEach((line, index) => {
      const trimmed = line.trim()
      if (!trimmed) return

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      
      // Check if line has comma (CSV format)
      if (trimmed.includes(',')) {
        const parts = trimmed.split(',').map(p => p.trim())
        const email = parts[0]
        const name = parts[1] || ''
        
        if (emailRegex.test(email)) {
          newRecipients.push({ email, name })
        } else {
          newErrors.push(`Line ${index + 1}: Invalid email format`)
        }
      } else {
        // Just email
        if (emailRegex.test(trimmed)) {
          newRecipients.push({ email: trimmed })
        } else {
          newErrors.push(`Line ${index + 1}: Invalid email format`)
        }
      }
    })

    setRecipients(newRecipients)
    setErrors(newErrors)
  }

  const handleCSVData = (data: Recipient[], csvErrors: string[]) => {
    setRecipients(data)
    setErrors(csvErrors)
  }

  const handleNext = () => {
    if (recipients.length === 0) {
      setErrors(['Please add at least one recipient'])
      return
    }

    if (recipients.length > 2000) {
      setErrors(['Maximum 2000 recipients allowed'])
      return
    }

    // Store recipients in localStorage for next step
    localStorage.setItem('recipients', JSON.stringify(recipients))
    navigate('/smtp')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <WizardStepper steps={steps} currentStep="recipients" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
              <Users className="w-6 h-6 mr-3 text-primary-600" />
              Add Recipients
            </h2>
            <p className="text-gray-600 mt-2">
              Add up to 2000 email addresses. You can paste them manually or upload a CSV file.
            </p>
          </div>

          <div className="p-6">
            {/* Input Mode Toggle */}
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setInputMode('manual')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  inputMode === 'manual'
                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                }`}
              >
                Manual Input
              </button>
              <button
                onClick={() => setInputMode('csv')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  inputMode === 'csv'
                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                }`}
              >
                <Upload className="w-4 h-4 mr-2 inline" />
                CSV Upload
              </button>
            </div>

            {/* Manual Input */}
            {inputMode === 'manual' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Addresses
                  </label>
                  <textarea
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Enter email addresses, one per line:&#10;john@example.com&#10;jane@example.com, Jane Doe&#10;support@company.com"
                    className="input w-full h-40 resize-none"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Format: email@domain.com or email@domain.com, Name
                  </p>
                </div>
                <button
                  onClick={handleManualInput}
                  className="btn-primary"
                >
                  Parse Addresses
                </button>
              </div>
            )}

            {/* CSV Upload */}
            {inputMode === 'csv' && (
              <CSVDropzone onData={handleCSVData} />
            )}

            {/* Errors */}
            {errors.length > 0 && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800">Validation Errors</h4>
                    <ul className="text-sm text-red-700 mt-2 space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Recipients Table */}
            {recipients.length > 0 && (
              <div className="mt-6">
                <RecipientTable recipients={recipients} onUpdate={setRecipients} />
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => navigate('/')}
                className="btn-outline"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {recipients.length} recipients added
                </span>
                <button
                  onClick={handleNext}
                  disabled={recipients.length === 0}
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
    </div>
  )
}
