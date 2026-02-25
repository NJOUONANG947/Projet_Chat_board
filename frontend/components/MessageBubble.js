import { motion } from 'framer-motion'

export default function MessageBubble({ message, isUser }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotateX: -15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{
        duration: 0.4,
        type: 'spring',
        stiffness: 200,
        damping: 20
      }}
      whileHover={{
        scale: 1.02,
        rotateX: isUser ? -2 : 2,
        z: 10
      }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <motion.div
        className={`max-w-xs md:max-w-sm lg:max-w-md px-3 md:px-4 py-2 md:py-3 rounded-lg backdrop-blur-sm cursor-pointer chat-mobile-text ${
          isUser
            ? 'bg-blue-900/80 text-white rounded-br-none border border-blue-800/50'
            : 'bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200/50'
        }`}
        style={{
          transform: 'translateZ(5px)',
          boxShadow: isUser
            ? '0 8px 20px -5px rgba(37, 99, 235, 0.4), 0 8px 8px -5px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            : '0 8px 20px -5px rgba(0, 0, 0, 0.08), 0 8px 8px -5px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
          transformStyle: 'preserve-3d'
        }}
        whileHover={{
          boxShadow: isUser
            ? '0 16px 32px -8px rgba(37, 99, 235, 0.5), 0 16px 16px -8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
            : '0 16px 32px -8px rgba(0, 0, 0, 0.12), 0 16px 16px -8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.7)'
        }}
      >
        <p className="text-sm leading-relaxed" style={{ transform: 'translateZ(2px)' }}>
          {message.content}
        </p>
        <p className="text-xs opacity-70 mt-2" style={{ transform: 'translateZ(1px)' }}>
          {new Date(message.createdAt).toLocaleTimeString()}
        </p>
      </motion.div>
    </motion.div>
  )
}
