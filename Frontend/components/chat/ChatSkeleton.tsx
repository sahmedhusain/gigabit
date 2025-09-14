import { motion } from 'framer-motion';

export default function ChatSkeleton() {
  return (
    <motion.div
      className="flex items-center space-x-4 p-4 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 shadow-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative w-14 h-14">
        <div className="w-14 h-14 bg-gray-700 rounded-full animate-pulse"></div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="w-3/4 h-6 bg-gray-700 rounded animate-pulse"></div>
          <div className="w-1/4 h-4 bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="w-1/2 h-4 bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    </motion.div>
  );
}
