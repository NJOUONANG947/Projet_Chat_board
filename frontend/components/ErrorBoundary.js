'use client'

import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.error('ErrorBoundary caught:', error, info?.componentStack)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4" role="alert">
          <div className="bg-zinc-800 border border-zinc-600 rounded-2xl p-8 max-w-md w-full text-center">
            <h1 className="text-xl font-semibold text-white mb-2">Une erreur est survenue</h1>
            <p className="text-zinc-400 text-sm mb-6">
              L&apos;application a rencontré un problème. Rechargez la page ou revenez plus tard.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors"
            >
              Recharger la page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
