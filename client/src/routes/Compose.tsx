import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, ArrowRight, ArrowLeft, Paperclip, X, Eye } from 'lucide-react'
import { WizardStepper } from '../components/WizardStepper'
import { AttachmentUploader } from '../components/AttachmentUploader'
import { EmailData } from '@bulk-email/shared'
import { useAttachments } from '../contexts/AttachmentContext'

export default function Compose() {
  const navigate = useNavigate()
  const { attachmentFiles, setAttachmentFiles } = useAttachments()
  const [emailData, setEmailData] = useState<EmailData>({
    from: '',
    subject: '',
    html: '',
    text: '',
    attachments: []
  })
  const [showPreview, setShowPreview] = useState(false)
  const [activeTab, setActiveTab] = useState<'html' | 'text'>('html')

  const steps = [
    { id: 'recipients', title: 'Recipients', description: 'Add email addresses', status: 'completed' as const },
    { id: 'smtp', title: 'SMTP Config', description: 'Email server settings', status: 'completed' as const },
    { id: 'compose', title: 'Compose', description: 'Write your email', status: 'active' as const },
    { id: 'pacing', title: 'Pacing', description: 'Sending controls', status: 'inactive' as const }
  ]

  useEffect(() => {
    // Check if previous steps are completed
    const recipients = localStorage.getItem('recipients')
    const smtpConfig = localStorage.getItem('smtpConfig')
    
    if (!recipients) {
      navigate('/recipients')
      return
    }
    if (!smtpConfig) {
      navigate('/smtp')
      return
    }

    // Set default from address from SMTP config
    try {
      const smtp = JSON.parse(smtpConfig)
      setEmailData(prev => ({ ...prev, from: smtp.auth.user }))
    } catch (error) {
      console.error('Failed to parse SMTP config:', error)
    }
  }, [navigate])

  const handleNext = () => {
    if (!emailData.subject.trim()) {
      alert('Please enter a subject line')
      return
    }

    if (!emailData.html?.trim() && !emailData.text?.trim()) {
      alert('Please enter email content (HTML or text)')
      return
    }

    // Store email data without attachments (File objects can't be serialized)
    const emailDataForStorage = {
      ...emailData,
      attachments: attachmentFiles.map(file => ({
        filename: file.name,
        contentType: file.type,
        size: file.size
      }))
    }
    localStorage.setItem('emailData', JSON.stringify(emailDataForStorage))
    
    // Attachment files are now managed by context and will persist
    
    navigate('/pacing')
  }

  const handleAttachmentsChange = (attachments: File[]) => {
    setAttachmentFiles(attachments)
    
    // Store attachment metadata only (File objects can't be serialized)
    const processedAttachments = attachments.map(file => ({
      filename: file.name,
      content: new ArrayBuffer(0) as any, // Placeholder - actual file handled separately
      contentType: file.type
    }))
    
    setEmailData(prev => ({ ...prev, attachments: processedAttachments }))
  }

  const removeAttachment = (index: number) => {
    // Remove from both the file array and email data
    const newFiles = attachmentFiles.filter((_, i) => i !== index)
    setAttachmentFiles(newFiles)
    setEmailData(prev => ({
      ...prev,
      attachments: prev.attachments?.filter((_, i) => i !== index) || []
    }))
  }

  const mergeTags = [
    { tag: '{{email}}', description: 'Recipient email address' },
    { tag: '{{name}}', description: 'Recipient name (if provided)' },
    { tag: '{{company}}', description: 'Custom variable from CSV' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <WizardStepper steps={steps} currentStep="compose" />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
              <Mail className="w-6 h-6 mr-3 text-primary-600" />
              Compose Email
            </h2>
            <p className="text-gray-600 mt-2">
              Create your email content. Use merge tags to personalize messages for each recipient.
            </p>
          </div>

          <div className="p-6">
            {/* Email Headers */}
            <div className="grid grid-cols-1 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From *
                </label>
                <input
                  type="email"
                  value={emailData.from}
                  onChange={(e) => setEmailData(prev => ({ ...prev, from: e.target.value }))}
                  className="input w-full"
                  placeholder="sender@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                  className="input w-full"
                  placeholder="Your email subject line"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Content Area */}
              <div className="lg:col-span-3">
                {/* Content Type Tabs */}
                <div className="flex space-x-1 mb-4">
                  <button
                    onClick={() => setActiveTab('html')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      activeTab === 'html'
                        ? 'bg-primary-100 text-primary-700 border border-primary-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}
                  >
                    HTML Content
                  </button>
                  <button
                    onClick={() => setActiveTab('text')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      activeTab === 'text'
                        ? 'bg-primary-100 text-primary-700 border border-primary-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}
                  >
                    Plain Text
                  </button>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-700 border border-gray-300 ml-auto"
                  >
                    <Eye className="w-4 h-4 mr-1 inline" />
                    {showPreview ? 'Hide' : 'Show'} Preview
                  </button>
                </div>

                {/* Content Editor */}
                {activeTab === 'html' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      HTML Content
                    </label>
                    <textarea
                      value={emailData.html || ''}
                      onChange={(e) => setEmailData(prev => ({ ...prev, html: e.target.value }))}
                      className="input w-full h-96 font-mono text-sm"
                      placeholder="<h1>Hello {{name}}!</h1><p>Your email content here...</p>"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plain Text Content
                    </label>
                    <textarea
                      value={emailData.text || ''}
                      onChange={(e) => setEmailData(prev => ({ ...prev, text: e.target.value }))}
                      className="input w-full h-96"
                      placeholder="Hello {{name}}!&#10;&#10;Your email content here..."
                    />
                  </div>
                )}

                {/* Preview */}
                {showPreview && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Preview</h3>
                    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                      <div className="bg-white p-4 rounded border">
                        <div className="border-b pb-2 mb-4 text-sm text-gray-600">
                          <div><strong>From:</strong> {emailData.from}</div>
                          <div><strong>Subject:</strong> {emailData.subject}</div>
                        </div>
                        {activeTab === 'html' && emailData.html ? (
                          <div dangerouslySetInnerHTML={{ __html: emailData.html }} />
                        ) : (
                          <div className="whitespace-pre-wrap">{emailData.text}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Attachments */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Attachments</h3>
                  <AttachmentUploader onFilesChange={handleAttachmentsChange} />
                                {attachmentFiles && attachmentFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {attachmentFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Paperclip className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{file.name}</span>
                            <span className="text-xs text-gray-500">{file.type}</span>
                          </div>
                          <button
                            onClick={() => removeAttachment(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                {/* Merge Tags */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-3">Merge Tags</h4>
                  <div className="space-y-2">
                    {mergeTags.map((tag, index) => (
                      <div key={index}>
                        <button
                          onClick={() => {
                            const textarea = document.querySelector('textarea:focus') as HTMLTextAreaElement
                            if (textarea) {
                              const start = textarea.selectionStart
                              const end = textarea.selectionEnd
                              const text = textarea.value
                              const newText = text.substring(0, start) + tag.tag + text.substring(end)
                              
                              if (activeTab === 'html') {
                                setEmailData(prev => ({ ...prev, html: newText }))
                              } else {
                                setEmailData(prev => ({ ...prev, text: newText }))
                              }
                            }
                          }}
                          className="block w-full text-left p-2 text-sm bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                        >
                          <code className="text-blue-700 font-mono">{tag.tag}</code>
                          <div className="text-xs text-blue-600 mt-1">{tag.description}</div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tips */}
                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-3">💡 Tips</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Use merge tags for personalization</li>
                    <li>• Test with HTML and plain text versions</li>
                    <li>• Keep attachments under 10MB total</li>
                    <li>• Preview before sending</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => navigate('/smtp')}
                className="btn-outline"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
              
              <button
                onClick={handleNext}
                className="btn-primary"
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
