import { motion } from 'framer-motion'
import { Filter, LucideIcon } from 'lucide-react'

interface FilterTab {
  key: string
  label: string
  icon: LucideIcon
  count: number
}

interface FilterTabsProps {
  filters: FilterTab[]
  filterType: 'all' | 'unread' | 'online'
  setFilterType: (type: 'all' | 'unread' | 'online') => void
}

export default function FilterTabs({
  filters,
  filterType,
  setFilterType
}: FilterTabsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
      <div className="flex items-center space-x-2 text-white/70">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          <Filter className="w-4 h-4" />
        </motion.div>
        <span className="text-sm font-medium">Filter:</span>
      </div>
      <div className="flex bg-gradient-to-r from-white/5 to-white/10 rounded-xl p-1 border border-white/10 shadow-lg">
        {filters.map(({ key, label, icon: Icon, count }) => (
          <motion.button
            key={key}
            onClick={() => setFilterType(key as 'all' | 'unread' | 'online')}
            className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-500 flex items-center space-x-2 ${
              filterType === key
                ? 'bg-gradient-to-r from-emerald-500/30 to-teal-500/30 text-emerald-200 shadow-lg border border-emerald-400/30'
                : 'text-white/60 hover:text-white hover:bg-white/10 border border-transparent'
            }`}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={filterType === key ? { rotate: 360 } : {}}
              transition={{ duration: 0.5 }}
            >
              <Icon className="w-4 h-4" />
            </motion.div>
            <span>{label}</span>
            {count > 0 && (
              <motion.span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  filterType === key
                    ? 'bg-emerald-400/40 text-emerald-100'
                    : 'bg-white/15 text-white/80'
                }`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                {count}
              </motion.span>
            )}
            {filterType === key && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-lg blur-sm"
                layoutId="activeFilterGlow"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            {filterType === key && (
              <motion.div
                className="absolute inset-0 bg-emerald-500/20 rounded-lg"
                layoutId="activeFilter"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}