
interface EditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'html' | 'text'
}

export function Editor({ value, onChange, placeholder, type = 'text' }: EditorProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`input w-full h-96 resize-none ${type === 'html' ? 'font-mono text-sm' : ''}`}
      placeholder={placeholder}
    />
  )
}
