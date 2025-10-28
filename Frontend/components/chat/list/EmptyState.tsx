import { motion } from 'framer-motion'
import { User, Users } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description: string
  buttonText?: string
  showDiscoverButtons?: boolean
  icon: LucideIcon
  iconColor: string
  onCreateDirectMessage?: () => void
  onCreateGroup?: () => void
}

export default function EmptyState({
  title,
  description,
  buttonText,
  showDiscoverButtons,
  icon: Icon,
  iconColor,
  onCreateDirectMessage,
  onCreateGroup
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <Icon className={`w-16 h-16 ${iconColor} mb-4`} />
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/60 mb-6 max-w-md">{description}</p>

      <div className="flex flex-col space-y-3">
        {buttonText && (
          <motion.button
            onClick={() => {
              if (onCreateDirectMessage) {
                onCreateDirectMessage()
              } else if (onCreateGroup) {
                onCreateGroup()
              }
            }}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
          >
            {buttonText}
          </motion.button>
        )}

        {showDiscoverButtons && (
          <div className="flex space-x-3">
            <motion.button
              onClick={() => {
                
                window.location.href = '/discover'
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 text-blue-300 rounded-lg border border-blue-400/30 hover:border-blue-400/50 transition-all duration-300 flex items-center space-x-2"
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
            >
              <User className="w-4 h-4" />
              <span>Discover People</span>
            </motion.button>

            <motion.button
              onClick={() => {
                
                window.location.href = '/discover?tab=groups'
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 text-blue-300 rounded-lg border border-blue-400/30 hover:border-blue-400/50 transition-all duration-300 flex items-center space-x-2"
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Users className="w-4 h-4" />
              <span>Discover Groups</span>
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  )
}