'use client'

/**
 * KEKTECH 3.0 - Component-Level Error Boundary
 *
 * Wraps individual components to catch errors without crashing the entire page.
 * Allows customizable fallback UI for different error scenarios.
 */

import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console (and potentially to error tracking service)
    console.error('Component error caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <Alert variant="destructive" className="my-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <AlertDescription>
                <p className="font-semibold mb-1">Error</p>
                <p className="text-sm">{this.state.error?.message || 'Something went wrong'}</p>
              </AlertDescription>
            </div>
            <Button
              onClick={this.handleReset}
              variant="outline"
              size="sm"
              className="ml-4"
            >
              Retry
            </Button>
          </div>
        </Alert>
      )
    }

    return this.props.children
  }
}
