import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, AlertCircle } from 'lucide-react'

interface AttachmentUploaderProps {
  onFilesChange: (files: File[]) => void
}

export function AttachmentUploader({ onFilesChange }: AttachmentUploaderProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Check total size (10MB limit)
    const totalSize = acceptedFiles.reduce((sum, file) => sum + file.size, 0)
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (totalSize > maxSize) {
      alert('Total attachment size cannot exceed 10MB')
      return
    }

    onFilesChange(acceptedFiles)
  }, [onFilesChange])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    maxSize: 10 * 1024 * 1024, // 10MB per file
    maxFiles: 5
  })

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
        ${isDragActive && !isDragReject ? 'border-primary-400 bg-primary-50' : ''}
        ${isDragReject ? 'border-red-400 bg-red-50' : ''}
        ${!isDragActive ? 'border-gray-300 hover:border-gray-400' : ''}
      `}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center space-y-3">
        {isDragReject ? (
          <AlertCircle className="w-8 h-8 text-red-500" />
        ) : (
          <Upload className="w-8 h-8 text-gray-400" />
        )}
        
        <div>
          {isDragActive ? (
            isDragReject ? (
              <p className="text-red-600 font-medium">
                File too large or invalid type
              </p>
            ) : (
              <p className="text-primary-600 font-medium">
                Drop files here...
              </p>
            )
          ) : (
            <>
              <p className="text-gray-600 font-medium">
                Drag & drop files here, or click to browse
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Max 5 files, 10MB total
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
