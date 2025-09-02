import { SMTPConfig } from '@bulk-email/shared'

interface SMTPFormProps {
  config: SMTPConfig
  onChange: (config: SMTPConfig) => void
}

export function SMTPForm({ config, onChange }: SMTPFormProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          SMTP Host *
        </label>
        <input
          type="text"
          value={config.host}
          onChange={(e) => onChange({ ...config, host: e.target.value })}
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
          value={config.port}
          onChange={(e) => onChange({ ...config, port: parseInt(e.target.value) })}
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
          value={config.auth.user}
          onChange={(e) => onChange({ 
            ...config, 
            auth: { ...config.auth, user: e.target.value }
          })}
          className="input w-full"
          placeholder="your-email@gmail.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Password/App Password *
        </label>
        <input
          type="password"
          value={config.auth.pass}
          onChange={(e) => onChange({ 
            ...config, 
            auth: { ...config.auth, pass: e.target.value }
          })}
          className="input w-full"
          placeholder="your-app-password"
        />
      </div>

      <div className="md:col-span-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={config.secure}
            onChange={(e) => onChange({ ...config, secure: e.target.checked })}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="ml-2 text-sm text-gray-700">
            Use SSL/TLS (port 465)
          </span>
        </label>
      </div>
    </div>
  )
}
