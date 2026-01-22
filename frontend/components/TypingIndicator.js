import { motion } from 'framer-motion'

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotateX: -20 }}
      animate={{ opacity: 1, scale: 1, rotateX: 0 }}
      exit={{ opacity: 0, scale: 0.8, rotateX: 20 }}
      transition={{ duration: 0.3 }}
      className="flex justify-start mb-4"
      style={{ transformStyle: 'preserve-3d' }}
    >
      <motion.div
        className="bg-gray-100 px-3 md:px-4 py-2 md:py-3 rounded-lg rounded-bl-none border border-gray-200/50 backdrop-blur-sm"
        style={{
          transform: 'translateZ(5px)',
          boxShadow: '0 8px 20px -5px rgba(0, 0, 0, 0.08), 0 8px 8px -5px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
          transformStyle: 'preserve-3d'
        }}
        animate={{
          boxShadow: [
            '0 8px 20px -5px rgba(0, 0, 0, 0.08), 0 8px 8px -5px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
            '0 12px 28px -5px rgba(0, 0, 0, 0.12), 0 12px 12px -5px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
            '0 8px 20px -5px rgba(0, 0, 0, 0.08), 0 8px 8px -5px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="flex space-x-1" style={{ transform: 'translateZ(2px)' }}>
          <motion.div
            className="w-2 h-2 bg-white rounded-full"
            animate={{
              y: [0, -12, 0],
              scale: [1, 1.2, 1],
              rotateX: [0, 180, 0]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: 0,
              ease: 'easeInOut'
            }}
            style={{
              transformStyle: 'preserve-3d',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
            }}
          />
          <motion.div
            className="w-2 h-2 bg-white rounded-full"
            animate={{
              y: [0, -12, 0],
              scale: [1, 1.2, 1],
              rotateX: [0, 180, 0]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: 0.2,
              ease: 'easeInOut'
            }}
            style={{
              transformStyle: 'preserve-3d',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
            }}
          />
          <motion.div
            className="w-2 h-2 bg-white rounded-full"
            animate={{
              y: [0, -12, 0],
              scale: [1, 1.2, 1],
              rotateX: [0, 180, 0]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: 0.4,
              ease: 'easeInOut'
            }}
            style={{
              transformStyle: 'preserve-3d',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  )
}
