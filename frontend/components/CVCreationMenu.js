'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function CVCreationMenu({ onClose, onOpenCVBuilder, onOpenDocumentManager }) {
  const [isOpen, setIsOpen] = useState(true)

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(onClose, 300)
  }

  const options = [
    {
      id: 'manual',
      title: 'Créer un CV Manuellement',
      description: 'Remplissez un formulaire pour créer votre CV étape par étape',
      icon: '✍️',
      action: () => {
        handleClose()
        onOpenCVBuilder()
      }
    },
    {
      id: 'from_documents',
      title: 'Générer CV à partir de Documents',
      description: 'Utilisez vos CV et offres d\'emploi uploadés pour créer un CV optimisé',
      icon: '🎨',
      action: () => {
        handleClose()
        onOpenDocumentManager()
      }
    }
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-zinc-900 border-b border-zinc-700 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">Créer un CV</h2>
                    <p className="text-zinc-400 text-sm mt-1">Choisissez votre méthode</p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-xl hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-white"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="p-6 space-y-4">
                {options.map((option, index) => (
                  <motion.button
                    key={option.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={option.action}
                    className="w-full p-4 bg-zinc-800/60 hover:bg-zinc-700/80 border border-zinc-600/40 hover:border-blue-800/50 rounded-xl transition-all text-left group"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="text-2xl flex-shrink-0">{option.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white group-hover:text-blue-200 transition-colors">
                          {option.title}
                        </h3>
                        <p className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors mt-1">
                          {option.description}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-zinc-500 group-hover:text-blue-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 pb-6">
                <div className="text-center">
                  <p className="text-xs text-zinc-500">
                    Vous pouvez changer d'avis à tout moment
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
