const steps = ['Account', 'Verify', 'Review']

interface StepIndicatorProps {
  currentStep: number
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      {steps.map((label, i) => {
        const isActive = i === currentStep
        const isCompleted = i < currentStep

        return (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={`h-px w-8 ${
                  i <= currentStep ? 'bg-violet-600' : 'bg-gray-300'
                }`}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                  isCompleted
                    ? 'bg-violet-600 text-white'
                    : isActive
                    ? 'border-2 border-violet-600 text-violet-600'
                    : 'border-2 border-gray-300 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-sm font-medium ${
                  isActive ? 'text-violet-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
