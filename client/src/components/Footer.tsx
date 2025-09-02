import React from 'react'
import { Shield, Zap, Users } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-primary-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900">Privacy First</h3>
              <p className="text-sm text-gray-600 mt-1">
                No sign-up required. All data cleared after session.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Zap className="w-5 h-5 text-primary-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900">Lightning Fast</h3>
              <p className="text-sm text-gray-600 mt-1">
                Optimized for speed with concurrent sending and retry handling.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Users className="w-5 h-5 text-primary-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900">Bulk Ready</h3>
              <p className="text-sm text-gray-600 mt-1">
                Handle up to 2000 recipients with real-time monitoring.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          Built with React, Express, and Nodemailer • No database required
        </div>
      </div>
    </footer>
  )
}
