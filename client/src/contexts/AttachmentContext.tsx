import { createContext, useContext, useState, ReactNode } from 'react'

interface AttachmentContextType {
  attachmentFiles: File[]
  setAttachmentFiles: (files: File[]) => void
  clearAttachments: () => void
}

const AttachmentContext = createContext<AttachmentContextType | undefined>(undefined)

export function AttachmentProvider({ children }: { children: ReactNode }) {
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([])

  const clearAttachments = () => {
    setAttachmentFiles([])
  }

  return (
    <AttachmentContext.Provider value={{
      attachmentFiles,
      setAttachmentFiles,
      clearAttachments
    }}>
      {children}
    </AttachmentContext.Provider>
  )
}

export function useAttachments() {
  const context = useContext(AttachmentContext)
  if (context === undefined) {
    throw new Error('useAttachments must be used within an AttachmentProvider')
  }
  return context
}
