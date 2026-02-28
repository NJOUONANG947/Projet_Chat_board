'use client'

export default function PageContainer({ children, className = '' }) {
  return (
    <div className={`w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 ${className}`}>
      {children}
    </div>
  )
}
