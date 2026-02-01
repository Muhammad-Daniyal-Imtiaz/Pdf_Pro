'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export default function LoadingSpinner({ 
  size = 'md', 
  className = '',
  text 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="flex flex-col items-center gap-2">
        <Loader2 
          className={cn(
            'animate-spin text-blue-600',
            sizeClasses[size]
          )} 
        />
        {text && (
          <p className="text-sm text-gray-600">{text}</p>
        )}
      </div>
    </div>
  )
}

// Full page loading spinner
export function FullPageLoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
}

// Inline loading spinner for buttons
export function ButtonLoadingSpinner({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  return <LoadingSpinner size={size} />
}
