import { Check, ChevronRight } from 'lucide-react'

interface Step {
  id: string
  title: string
  description: string
  status: 'completed' | 'active' | 'inactive'
}

interface WizardStepperProps {
  steps: Step[]
  currentStep: string
}

export function WizardStepper({ steps }: WizardStepperProps) {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <ol className="flex items-center space-x-4 w-full">
            {steps.map((step, index) => (
              <li key={step.id} className="flex items-center">
                <div className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full border-2 
                    ${step.status === 'completed' 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : step.status === 'active'
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'bg-white border-gray-300 text-gray-500'
                    }
                  `}>
                    {step.status === 'completed' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      step.status === 'active' ? 'text-primary-600' : 
                      step.status === 'completed' ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-4" />
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </nav>
  )
}
