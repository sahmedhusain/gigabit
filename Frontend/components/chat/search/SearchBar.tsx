import { Search, MessageSquare, X } from 'lucide-react'
import { motion } from 'framer-motion'

interface SearchBarProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchMode: 'normal' | 'messages'
  setSearchMode: (mode: 'normal' | 'messages') => void
  placeholder: string
}

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  searchMode,
  setSearchMode,
  placeholder
}: SearchBarProps) {
  return (
    <div className="flex-1 max-w-md">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <motion.div
            animate={{ rotate: searchQuery ? 360 : 0 }}
            transition={{ duration: 0.5 }}
          >
            <Search className="w-5 h-5 text-white/40 group-focus-within:text-emerald-400 transition-colors duration-300" />
          </motion.div>
        </div>
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="relative z-50 w-full pl-12 pr-20 py-3 bg-gradient-to-r from-white/5 to-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400/50 transition-all duration-500 text-sm shadow-lg focus:shadow-xl"
        />
        {/* Enhanced Splitter */}
        <div className="absolute inset-y-0 right-10 flex items-center z-40">
          <div className="w-px h-6 bg-gradient-to-b from-transparent via-white/30 to-transparent"></div>
        </div>
        {/* Buttons Container - positioned absolutely over the input */}
        <div className="absolute inset-y-0 right-0 pr-2 flex items-center z-70 pointer-events-none">
          {searchQuery && (
            <motion.button
              onClick={() => setSearchQuery('')}
              className="text-white/40 hover:text-white transition-colors mr-2 pointer-events-auto"
              whileHover={{ scale: 1.2, rotate: 90 }}
              whileTap={{ scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
          <motion.button
            onClick={() => setSearchMode(searchMode === 'normal' ? 'messages' : 'normal')}
            className={`p-2 rounded-lg transition-all duration-200 cursor-pointer pointer-events-auto flex items-center justify-center ${
              searchMode === 'messages'
                ? 'bg-gradient-to-r from-emerald-500/40 to-teal-500/40 text-emerald-100 border border-emerald-400/60 shadow-lg shadow-emerald-500/20'
                : 'bg-transparent text-white/70 hover:text-white hover:bg-white/10'
            }`}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            title={searchMode === 'messages' ? 'Disable deep message search' : 'Enable deep message search'}
          >
            <motion.div
              animate={{ rotate: searchMode === 'messages' ? 360 : 0 }}
              transition={{ duration: 0.5 }}
            >
              <MessageSquare className="w-4 h-4" />
            </motion.div>
          </motion.button>
        </div>
        {/* Search Bar Glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-400/0 via-emerald-400/5 to-teal-400/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-xl z-30"></div>
      </div>
    </div>
  )
}