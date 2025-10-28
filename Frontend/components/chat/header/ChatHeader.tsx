import { motion } from 'framer-motion'
import { MessageSquarePlus, Plus, X } from 'lucide-react'
import { ChatHeaderProps } from '@/types/chat'
import SearchBar from '../search/SearchBar'
import FilterTabs from '../filters/FilterTabs'

export default function ChatHeader({
  title,
  subtitle,
  icon: Icon,
  gradient,
  iconColor,
  searchPlaceholder,
  filters,
  showNewChat,
  showNewGroup,
  newChatLabel,
  newGroupLabel,
  searchQuery,
  setSearchQuery,
  searchMode,
  setSearchMode,
  filterType,
  setFilterType,
  searchResults,
  onCreateDirectMessage,
  onCreateGroup
}: ChatHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Combined Header and Search Container */}
      <motion.div
        className="relative overflow-hidden bg-gradient-to-br from-white/5 via-emerald-500/5 to-teal-500/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative z-10 space-y-6">
          {/* Title Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                className={`relative p-3 bg-gradient-to-br ${gradient} rounded-2xl border border-white/20 shadow-xl`}
                whileHover={{ scale: 1.1, rotate: 10 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                {/* Icon Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-2xl blur-md"></div>
                <Icon className={`relative w-8 h-8 ${iconColor}`} />
                {/* Activity Indicator */}
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white/20"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-full h-full bg-emerald-400 rounded-full animate-ping"></div>
                </motion.div>
              </motion.div>

              <div className="space-y-2">
                <motion.h1
                  className="text-3xl font-bold bg-gradient-to-r from-white via-emerald-100 to-teal-100 bg-clip-text text-transparent"
                  key={title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  {title}
                </motion.h1>

                <motion.p
                  className="text-white/60 text-xs leading-relaxed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {subtitle || 'Stay connected with your conversations and communities'}
                </motion.p>
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {showNewChat && (
                <motion.button
                  onClick={onCreateDirectMessage}
                  className="group relative overflow-hidden bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 text-white px-6 py-3 rounded-2xl transition-all duration-300 flex items-center space-x-3 border border-white/20 hover:border-white/30 shadow-lg hover:shadow-xl backdrop-blur-sm"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <MessageSquarePlus className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors relative z-10" />
                  <span className="font-semibold relative z-10">{newChatLabel}</span>
                </motion.button>
              )}

              {showNewGroup && (
                <motion.button
                  onClick={onCreateGroup}
                  className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 flex items-center space-x-3 shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  <Plus className="w-5 h-5 relative z-10" />
                  <span className="font-semibold relative z-10">{newGroupLabel}</span>
                </motion.button>
              )}
            </motion.div>
          </div>

          {/* Separator */}
          <div className="border-t border-white/10"></div>

          {/* Search and Filter Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6 pointer-events-auto">
              {/* Enhanced Search Bar */}
              <SearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchMode={searchMode}
                setSearchMode={setSearchMode}
                placeholder={searchPlaceholder}
              />

              {/* Enhanced Dynamic Filter Tabs */}
              <FilterTabs
                filters={filters}
                filterType={filterType}
                setFilterType={setFilterType}
              />
            </div>

            {/* Enhanced Active Filter Summary */}
            <motion.div
              initial={{ opacity: 0, height: 0, y: 20 }}
              animate={{
                opacity: (filterType !== 'all' || (searchQuery.trim() && searchResults.length > 0)) ? 1 : 0,
                height: (filterType !== 'all' || (searchQuery.trim() && searchResults.length > 0)) ? 'auto' : 0,
                y: (filterType !== 'all' || (searchQuery.trim() && searchResults.length > 0)) ? 0 : 20
              }}
              className="mt-4 pt-4 border-t border-white/15 overflow-hidden"
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            >
              <div className="flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl p-3 border border-emerald-400/20">
                <div className="flex items-center space-x-3 text-white/80 text-sm">
                  <motion.div
                    className="w-2 h-2 bg-emerald-400 rounded-full"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  {searchQuery.trim() && searchResults.length > 0 ? (
                    <>
                      <span className="font-medium">
                        Found <span className="text-emerald-300 font-bold">{searchResults.length}</span>{' '}
                        {searchResults.length === 1 ? 'conversation' : 'conversations'} matching &quot;<span className="text-emerald-300 font-bold">{searchQuery}</span>&quot;
                      </span>
                      <span className="text-white/40">•</span>
                      <span className="text-white/60">Deep message search</span>
                    </>
                  ) : filterType !== 'all' ? (
                    <>
                      <span className="font-medium">
                        Showing filtered results
                      </span>
                      <span className="text-white/40">•</span>
                      <span className="text-white/60">
                        Filter: <span className="text-emerald-300 font-semibold">
                          {filterType === 'unread' ? 'Unread messages' : filterType === 'online' ? 'Online contacts' : 'All conversations'}
                        </span>
                      </span>
                    </>
                  ) : null}
                </div>
                <motion.button
                  onClick={() => {
                    setFilterType('all')
                    if (searchQuery.trim()) {
                      setSearchQuery('')
                      setSearchMode('normal') // Reset to normal mode when clearing search
                    }
                  }}
                  className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center space-x-1 px-2 py-1 rounded-lg hover:bg-white/5 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>Clear {searchQuery.trim() ? 'search' : 'filter'}</span>
                  <motion.div
                    whileHover={{ rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-3 h-3" />
                  </motion.div>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Progress/Activity Bar */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-b-2xl"
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 1.5, delay: 0.6, ease: 'easeInOut' }}
        />
      </motion.div>
    </motion.div>
  )
}