'use client'
import { X, HelpCircle, Mail, MessageCircle, Phone, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SupportPopupProps {
  isOpen: boolean
  onClose: () => void
}

export default function SupportPopup({ isOpen, onClose }: SupportPopupProps) {
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
                      <HelpCircle className="w-5 h-5 text-white drop-shadow-sm" />
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
                      Support Center
                    </motion.h3>
                    <motion.p
                      className="text-white/60 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                    >
                      Get help and support for your account
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
                    <h4 className="text-lg font-semibold text-white mb-3">Get Help & Support</h4>
                    <p className="text-sm leading-relaxed">
                      We&apos;re here to help! Choose the best way to get support for your Gigabit account.
                    </p>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-white mb-3">Contact Methods</h4>
                    <div className="space-y-4">
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center mb-3">
                          <Mail className="w-5 h-5 text-emerald-400 mr-3" />
                          <h5 className="font-semibold text-white">Email Support</h5>
                        </div>
                        <p className="text-sm text-white/70 mb-2">Send us an email and we&apos;ll respond within 24 hours</p>
                        <p className="text-sm font-medium text-emerald-300">support@gigabit.com</p>
                      </div>

                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center mb-3">
                          <MessageCircle className="w-5 h-5 text-teal-400 mr-3" />
                          <h5 className="font-semibold text-white">Live Chat</h5>
                        </div>
                        <p className="text-sm text-white/70 mb-2">Chat with our support team in real-time</p>
                        <p className="text-sm font-medium text-teal-300">Available 24/7</p>
                      </div>

                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center mb-3">
                          <Phone className="w-5 h-5 text-cyan-400 mr-3" />
                          <h5 className="font-semibold text-white">Phone Support</h5>
                        </div>
                        <p className="text-sm text-white/70 mb-2">Speak directly with our support specialists</p>
                        <p className="text-sm font-medium text-cyan-300">1-800-GIGABIT</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-white mb-3">Support Hours</h4>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center mb-3">
                        <Clock className="w-5 h-5 text-purple-400 mr-3" />
                        <h5 className="font-semibold text-white">When We&apos;re Available</h5>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-white/70">Monday - Friday:</span>
                          <span className="text-white font-medium">9:00 AM - 9:00 PM EST</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">Saturday:</span>
                          <span className="text-white font-medium">10:00 AM - 6:00 PM EST</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">Sunday:</span>
                          <span className="text-white font-medium">12:00 PM - 5:00 PM EST</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">Emergency Support:</span>
                          <span className="text-white font-medium">24/7</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-white mb-3">Common Issues</h4>
                    <div className="space-y-3">
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <h5 className="font-semibold text-white mb-2">Account & Login Issues</h5>
                        <p className="text-sm text-white/70">Problems signing in, password reset, account verification</p>
                      </div>

                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <h5 className="font-semibold text-white mb-2">Technical Problems</h5>
                        <p className="text-sm text-white/70">App crashes, slow performance, feature not working</p>
                      </div>

                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <h5 className="font-semibold text-white mb-2">Privacy & Security</h5>
                        <p className="text-sm text-white/70">Privacy settings, data concerns, security questions</p>
                      </div>

                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <h5 className="font-semibold text-white mb-2">Billing & Payments</h5>
                        <p className="text-sm text-white/70">Subscription issues, payment problems, refunds</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-white mb-3">Help Resources</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                        <h5 className="font-semibold text-white mb-2">Help Center</h5>
                        <p className="text-sm text-white/70">Browse our comprehensive help articles</p>
                      </div>

                      <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                        <h5 className="font-semibold text-white mb-2">Community Forum</h5>
                        <p className="text-sm text-white/70">Get help from other users and experts</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-white mb-3">Before Contacting Support</h4>
                    <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl p-4 border border-emerald-400/20">
                      <p className="text-sm leading-relaxed">
                        Please check our Help Center first - you might find the answer to your question there.
                        When contacting support, please include as much detail as possible about your issue,
                        including screenshots if applicable.
                      </p>
                    </div>
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
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}