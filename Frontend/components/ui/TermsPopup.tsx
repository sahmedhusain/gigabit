'use client'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { TermsPopupProps } from '@/types/ui'

export default function TermsPopup({ isOpen, onClose }: TermsPopupProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-xl z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="relative w-full max-w-2xl h-[80vh] flex flex-col bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* Header */}
            <motion.div
              className="relative flex-shrink-0 p-6 pb-4 bg-gradient-to-r from-white/10 to-white/5 border-b border-white/20"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <motion.div
                      className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                    />
                  </motion.div>
                  <div>
                    <motion.h3
                      className="text-xl font-bold text-white mb-1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                    >
                      Terms of Service
                    </motion.h3>
                    <motion.p
                      className="text-white/60 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                    >
                      Please read our terms carefully
                    </motion.p>
                  </div>
                </div>
                <motion.button
                  onClick={onClose}
                  className="group p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                  title="Close"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                </motion.button>
              </div>
            </motion.div>

            {/* Scrollable Content Area */}
            <motion.div
              className="relative flex-1 overflow-y-auto px-6 py-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <div className="prose prose-invert max-w-none">
                <motion.div
                  className="space-y-6 text-white/80"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <section>
                    <h4 className="text-lg font-semibold text-white mb-3">1. Acceptance of Terms</h4>
                    <p className="text-sm leading-relaxed">
                      By accessing and using Gigabit, you accept and agree to be bound by the terms and provision of this agreement.
                    </p>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-white mb-3">2. Use License</h4>
                    <p className="text-sm leading-relaxed mb-3">
                      Permission is granted to temporarily download one copy of the materials on Gigabit&apos;s website for personal, non-commercial transitory viewing only.
                    </p>
                    <p className="text-sm leading-relaxed">
                      This is the grant of a license, not a transfer of title, and under this license you may not:
                    </p>
                    <ul className="list-disc list-inside text-sm mt-2 space-y-1 ml-4">
                      <li>modify or copy the materials</li>
                      <li>use the materials for any commercial purpose or for any public display</li>
                      <li>attempt to reverse engineer any software contained on the website</li>
                      <li>remove any copyright or other proprietary notations from the materials</li>
                    </ul>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-white mb-3">3. User Accounts</h4>
                    <p className="text-sm leading-relaxed">
                      When you create an account with us, you must provide information that is accurate, complete, and current at all times.
                      You are responsible for safeguarding the password and for all activities that occur under your account.
                    </p>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-white mb-3">4. Content</h4>
                    <p className="text-sm leading-relaxed mb-3">
                      Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, or other material.
                    </p>
                    <p className="text-sm leading-relaxed">
                      You are responsible for content that you post to the Service, including its legality, reliability, and appropriateness.
                    </p>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-white mb-3">5. Prohibited Uses</h4>
                    <p className="text-sm leading-relaxed">
                      You may not use our Service:
                    </p>
                    <ul className="list-disc list-inside text-sm mt-2 space-y-1 ml-4">
                      <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
                      <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                      <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                      <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                      <li>To submit false or misleading information</li>
                    </ul>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-white mb-3">6. Termination</h4>
                    <p className="text-sm leading-relaxed">
                      We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever,
                      including without limitation if you breach the Terms.
                    </p>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-white mb-3">7. Limitation of Liability</h4>
                    <p className="text-sm leading-relaxed">
                      In no event shall Gigabit, nor its directors, employees, partners, agents, suppliers, or affiliates,
                      be liable for any indirect, incidental, special, consequential, or punitive damages.
                    </p>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-white mb-3">8. Changes</h4>
                    <p className="text-sm leading-relaxed">
                      We reserve the right, at our sole discretion, to modify or replace these Terms at any time.
                      If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
                    </p>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-white mb-3">9. Contact Us</h4>
                    <p className="text-sm leading-relaxed">
                      If you have any questions about these Terms of Service, please contact us at support@gigabit.com.
                    </p>
                  </section>
                </motion.div>
              </div>
            </motion.div>

            {/* Footer */}
            <motion.div
              className="relative flex-shrink-0 p-6 pt-4 bg-gradient-to-r from-white/5 to-white/10 border-t border-white/20"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <div className="flex justify-end">
                <motion.button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl text-white font-semibold text-sm transition-all duration-300 shadow-lg bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-600 hover:via-teal-700 hover:to-cyan-700 shadow-emerald-500/25"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  I Understand
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}