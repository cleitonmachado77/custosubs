import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Step {
  number: number
  title: string
  icon: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
  completedSteps: Set<number>
}

export function StepIndicator({ steps, currentStep, completedSteps }: StepIndicatorProps) {
  return (
    <div className="w-full">
      {/* Mobile: compact */}
      <div className="flex items-center justify-between sm:hidden px-2 py-3">
        <span className="text-sm font-medium text-gray-700">
          Etapa {currentStep} de {steps.length}
        </span>
        <span className="text-sm text-gray-500">{steps[currentStep - 1]?.title}</span>
      </div>

      {/* Desktop: full */}
      <div className="hidden sm:flex items-center">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(step.number)
          const isCurrent = step.number === currentStep
          const isUpcoming = step.number > currentStep && !isCompleted

          return (
            <div key={step.number} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200',
                    isCompleted && 'bg-green-500 text-white',
                    isCurrent && 'bg-blue-600 text-white ring-4 ring-blue-100',
                    isUpcoming && 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span>{step.icon}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium whitespace-nowrap',
                    isCurrent && 'text-blue-700',
                    isCompleted && 'text-green-600',
                    isUpcoming && 'text-gray-400'
                  )}
                >
                  {step.title}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 mb-5 transition-colors duration-200',
                    completedSteps.has(step.number) ? 'bg-green-400' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile progress bar */}
      <div className="sm:hidden h-1.5 bg-gray-200 rounded-full mx-2">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  )
}
