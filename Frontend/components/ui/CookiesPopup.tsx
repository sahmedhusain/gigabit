'use client'
import { X, Cookie } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface CookiesPopupProps {
  isOpen: boolean
  onClose: () => void
}

export default function CookiesPopup({ isOpen, onClose }: CookiesPopupProps) {
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
                      <Cookie className="w-5 h-5 text-white drop-shadow-sm" />
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
                      Cookie Policy
                    </motion.h3>
                    <motion.p
                      className="text-white/60 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                    >
                      How we use cookies on our platform
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
                    <h4 className="text-lg font-semibold text-white mb-3">1. What Are Cookies</h4>
                    <p className="text-sm leading-relaxed">
                      Cookies are small text files that are stored on your computer or mobile device when you visit our website.
                      They help us provide you with a better browsing experience by remembering your preferences and settings.
                    </p>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-white mb-3">2. How We Use Cookies</h4>
                    <p className="text-sm leading-relaxed mb-3">
                      We use cookies for several purposes:
                    </p>
                    <ul className="list-disc list-inside text-sm mt-2 space-y-1 ml-4">
                      <li><strong>Essential Cookies:</strong> Required for the website to function properly</li>
                      <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website</li>
                      <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                      <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements</li>
                    </ul>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-white mb-3">3. Types of Cookies We Use</h4>
                    <div className="space-y-4">
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <h5 className="font-semibold text-white mb-2">Session Cookies</h5>
                        <p className="text-sm text-white/70">Temporary cookies that expire when you close your browser</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <h5 className="font-semibold text-white mb-2">Persistent Cookies</h5>
                        <p className="text-sm text-white/70">Cookies that remain on your device for a set period or until you delete them</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <h5 className="font-semibold text-white mb-2">Third-party Cookies</h5>
                        <p className="text-sm text-white/70">Cookies set by third-party services we use, such as analytics providers</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-white mb-3">4. Managing Cookies</h4>
                    <p className="text-sm leading-relaxed mb-3">
                      You can control and manage cookies in various ways:
                    </p>
                    <ul className="list-disc list-inside text-sm mt-2 space-y-1 ml-4">
                      <li>Most web browsers allow you to control cookies through their settings</li>
                      <li>You can delete all cookies that are already on your computer</li>
                      <li>You can set most browsers to prevent cookies from being placed</li>
                      <li>Note that disabling cookies may affect the functionality of our website</li>
                    </ul>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-white mb-3">5. Third-Party Cookies</h4>
                    <p className="text-sm leading-relaxed">
                      We may use third-party services that set their own cookies. We have no control over these cookies,
                      and they are subject to the respective third party&apos;s privacy policy.
                    </p>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-white mb-3">6. Updates to This Policy</h4>
                    <p className="text-sm leading-relaxed">
                      We may update this Cookie Policy from time to time. Any changes will be posted on this page
                      with an updated revision date.
                    </p>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-white mb-3">7. Contact Us</h4>
                    <p className="text-sm leading-relaxed">
                      If you have any questions about our use of cookies, please contact us at cookies@gigabit.com.
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