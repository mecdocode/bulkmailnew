import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, AlertCircle } from 'lucide-react'
import Papa from 'papaparse'
import { Recipient } from '@bulk-email/shared'

interface CSVDropzoneProps {
  onData: (recipients: Recipient[], errors: string[]) => void
}

export function CSVDropzone({ onData }: CSVDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const recipients: Recipient[] = []
        const errors: string[] = []
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

        results.data.forEach((row: any, index: number) => {
          const email = row.email || row.Email || row.EMAIL || Object.values(row)[0]
          const name = row.name || row.Name || row.NAME || Object.values(row)[1]

          if (!email) {
            errors.push(`Row ${index + 1}: No email found`)
            return
          }

          if (!emailRegex.test(email)) {
            errors.push(`Row ${index + 1}: Invalid email format (${email})`)
            return
          }

          const recipient: Recipient = { email: email.trim() }
          if (name && typeof name === 'string') {
            recipient.name = name.trim()
          }

          // Add custom variables from other columns
          const variables: Record<string, string> = {}
          Object.entries(row).forEach(([key, value]) => {
            if (key !== 'email' && key !== 'name' && key !== 'Email' && key !== 'Name' && value) {
              variables[key] = String(value).trim()
            }
          })
          
          if (Object.keys(variables).length > 0) {
            recipient.variables = variables
          }

          recipients.push(recipient)
        })

        if (results.errors.length > 0) {
          results.errors.forEach(error => {
            errors.push(`Parse error: ${error.message}`)
          })
        }

        onData(recipients, errors)
      },
      error: (error) => {
        onData([], [`Failed to parse CSV: ${error.message}`])
      }
    })
  }, [onData])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024 // 5MB
  })

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive && !isDragReject ? 'border-primary-400 bg-primary-50' : ''}
          ${isDragReject ? 'border-red-400 bg-red-50' : ''}
          ${!isDragActive ? 'border-gray-300 hover:border-gray-400' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          {isDragReject ? (
            <AlertCircle className="w-12 h-12 text-red-500" />
          ) : (
            <Upload className="w-12 h-12 text-gray-400" />
          )}
          
          <div>
            {isDragActive ? (
              isDragReject ? (
                <p className="text-red-600 font-medium">
                  Please upload a CSV file only
                </p>
              ) : (
                <p className="text-primary-600 font-medium">
                  Drop your CSV file here...
                </p>
              )
            ) : (
              <>
                <p className="text-gray-600 font-medium">
                  Drag & drop a CSV file here, or click to browse
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Maximum file size: 5MB
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* CSV Format Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">CSV Format Guide</h4>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>Required:</strong> email column</p>
              <p><strong>Optional:</strong> name column, custom variables</p>
              <div className="bg-white border border-blue-200 rounded p-2 mt-2 font-mono text-xs">
                email,name,company<br/>
                john@example.com,John Doe,Acme Corp<br/>
                jane@example.com,Jane Smith,Tech Inc
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
