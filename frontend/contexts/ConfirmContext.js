'use client'

import { createContext, useContext, useState, useCallback } from 'react'

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null)

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setState({
        title: options.title || 'Confirmer',
        message: options.message || '',
        confirmLabel: options.confirmLabel || 'Confirmer',
        cancelLabel: options.cancelLabel || 'Annuler',
        danger: options.danger === true,
        onConfirm: () => { setState(null); resolve(true) },
        onCancel: () => { setState(null); resolve(false) }
      })
    })
  }, [])

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="bg-zinc-800 border border-zinc-600 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 id="confirm-title" className="text-lg font-semibold text-white mb-2">{state.title}</h2>
            {state.message && <p className="text-zinc-300 text-sm mb-6">{state.message}</p>}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={state.onCancel}
                className="px-4 py-2.5 rounded-xl bg-zinc-600/80 text-zinc-200 hover:bg-zinc-600 transition-colors font-medium"
              >
                {state.cancelLabel}
              </button>
              <button
                type="button"
                onClick={state.onConfirm}
                className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${state.danger ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) return () => Promise.resolve(false)
  return ctx.confirm
}
