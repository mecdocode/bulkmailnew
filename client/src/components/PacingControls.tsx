import { PacingConfig } from '@bulk-email/shared'

interface PacingControlsProps {
  config: PacingConfig
  onChange: (config: PacingConfig) => void
}

export function PacingControls({ config, onChange }: PacingControlsProps) {
  const delayOptions = [
    { value: 500, label: '0.5 seconds (Fast)' },
    { value: 1000, label: '1 second' },
    { value: 2000, label: '2 seconds (Recommended)' },
    { value: 3000, label: '3 seconds' },
    { value: 5000, label: '5 seconds' },
    { value: 10000, label: '10 seconds (Conservative)' }
  ]

  const concurrencyOptions = [
    { value: 1, label: '1 connection (Safest)' },
    { value: 2, label: '2 connections' },
    { value: 3, label: '3 connections' },
    { value: 4, label: '4 connections' },
    { value: 5, label: '5 connections (Aggressive)' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Delay Between Emails
        </label>
        <div className="space-y-2">
          {delayOptions.map((option) => (
            <label key={option.value} className="flex items-center">
              <input
                type="radio"
                name="delay"
                value={option.value}
                checked={config.delayMs === option.value}
                onChange={(e) => onChange({ ...config, delayMs: parseInt(e.target.value) })}
                className="mr-3 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Concurrent Connections
        </label>
        <div className="space-y-2">
          {concurrencyOptions.map((option) => (
            <label key={option.value} className="flex items-center">
              <input
                type="radio"
                name="concurrency"
                value={option.value}
                checked={config.concurrency === option.value}
                onChange={(e) => onChange({ ...config, concurrency: parseInt(e.target.value) })}
                className="mr-3 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Current Settings</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <div>Delay: {config.delayMs / 1000} seconds</div>
          <div>Concurrency: {config.concurrency} connections</div>
          <div>Rate: ~{Math.round(60000 / (config.delayMs + 1000)) * config.concurrency} emails/minute</div>
        </div>
      </div>
    </div>
  )
}
