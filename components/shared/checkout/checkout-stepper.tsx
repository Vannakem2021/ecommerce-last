'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StepStatus = 'completed' | 'active' | 'pending'

export interface Step {
  id: number
  label: string
  sublabel?: string
  icon: React.ComponentType<{ className?: string }>
  status: StepStatus
}

interface CheckoutStepperProps {
  steps: Step[]
  onStepClick?: (stepId: number) => void
}

export default function CheckoutStepper({ steps, onStepClick }: CheckoutStepperProps) {
  return (
    <div className='w-full'>
      {/* Desktop/Tablet: Horizontal Stepper */}
      <div className='hidden sm:block'>
        <div className='flex items-center justify-between'>
          {steps.map((step, index) => {
            const Icon = step.icon
            const isLast = index === steps.length - 1
            const isCompleted = step.status === 'completed'
            const isActive = step.status === 'active'
            const isPending = step.status === 'pending'
            const isClickable = isCompleted && onStepClick

            return (
              <div key={step.id} className='flex items-center flex-1'>
                {/* Step Circle */}
                <button
                  onClick={() => isClickable && onStepClick(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    'flex flex-col items-center gap-2 group',
                    isClickable && 'cursor-pointer hover:opacity-80',
                    !isClickable && 'cursor-default'
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300',
                      isCompleted && 'bg-green-600 border-green-600 text-white',
                      isActive && 'bg-primary border-primary text-primary-foreground',
                      isPending && 'bg-muted border-muted-foreground/30 text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <Check className='w-6 h-6' />
                    ) : (
                      <Icon className='w-6 h-6' />
                    )}
                  </div>

                  {/* Step Label */}
                  <div className='text-center'>
                    <div
                      className={cn(
                        'text-sm font-semibold',
                        isCompleted && 'text-green-600',
                        isActive && 'text-primary',
                        isPending && 'text-muted-foreground'
                      )}
                    >
                      {step.label}
                    </div>
                    {step.sublabel && (
                      <div
                        className={cn(
                          'text-xs',
                          isCompleted && 'text-green-600/80',
                          isActive && 'text-primary/80',
                          isPending && 'text-muted-foreground/70'
                        )}
                      >
                        {step.sublabel}
                      </div>
                    )}
                  </div>
                </button>

                {/* Connector Line */}
                {!isLast && (
                  <div className='flex-1 h-0.5 mx-4'>
                    <div
                      className={cn(
                        'h-full transition-all duration-300',
                        isCompleted && 'bg-green-600',
                        (isActive || isPending) && 'bg-muted-foreground/30'
                      )}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile: Vertical Compact Stepper */}
      <div className='block sm:hidden'>
        <div className='space-y-2'>
          {steps.map((step, index) => {
            const Icon = step.icon
            const isLast = index === steps.length - 1
            const isCompleted = step.status === 'completed'
            const isActive = step.status === 'active'
            const isPending = step.status === 'pending'

            return (
              <div key={step.id} className='flex items-start gap-3'>
                {/* Left side: Circle + Line */}
                <div className='flex flex-col items-center'>
                  <div
                    className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300',
                      isCompleted && 'bg-green-600 border-green-600 text-white',
                      isActive && 'bg-primary border-primary text-primary-foreground',
                      isPending && 'bg-muted border-muted-foreground/30 text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <Check className='w-5 h-5' />
                    ) : (
                      <Icon className='w-5 h-5' />
                    )}
                  </div>
                  {!isLast && (
                    <div className='w-0.5 h-8 mt-1'>
                      <div
                        className={cn(
                          'h-full transition-all duration-300',
                          isCompleted && 'bg-green-600',
                          (isActive || isPending) && 'bg-muted-foreground/30'
                        )}
                      />
                    </div>
                  )}
                </div>

                {/* Right side: Labels */}
                <div className='flex-1 pt-2'>
                  <div
                    className={cn(
                      'text-sm font-semibold',
                      isCompleted && 'text-green-600',
                      isActive && 'text-primary',
                      isPending && 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                    {step.sublabel && <span> {step.sublabel}</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
