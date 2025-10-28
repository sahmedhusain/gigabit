import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { DeleteChatDialogProps } from '@/types/chat';

export default function DeleteChatDialog({ isOpen, onClose, onConfirm }: DeleteChatDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-sm mx-4"
            onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
              e.stopPropagation();
              (e.nativeEvent as Event)?.stopImmediatePropagation?.();
            }}
            onClick={(e: React.MouseEvent<HTMLDivElement>) => {
              e.stopPropagation();
              (e.nativeEvent as Event)?.stopImmediatePropagation?.();
            }}
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-400/30">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">Delete Conversation</h3>
              <p className="text-white/70 text-sm mb-6">
                Are you sure you want to delete this conversation? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <motion.button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 text-white rounded-2xl border border-white/20 hover:border-white/30 transition-all duration-300 shadow-lg hover:shadow-white/10"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={onConfirm}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl border border-red-400/30 hover:border-red-500/50 transition-all duration-300 shadow-lg hover:shadow-red-500/25"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Delete
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}