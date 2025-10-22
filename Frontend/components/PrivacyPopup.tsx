'use client'
import { X, Shield } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface PrivacyPopupProps {
  isOpen: boolean
  onClose: () => void
}

export default function PrivacyPopup({ isOpen, onClose }: PrivacyPopupProps) {
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
                      <Shield className="w-5 h-5 text-white drop-shadow-sm" />
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
                      Privacy Policy
                    </motion.h3>
                    <motion.p
                      className="text-white/60 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                    >
                      How we protect your data
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
                    <h4 className="text-lg font-semibold text-white mb-3">1. Information We Collect</h4>
                    <p className="text-sm leading-relaxed mb-3">
                      We collect information you provide directly to us, such as when you create an account, make a post, or contact us for support.
                    </p>
                    <p className="text-sm leading-relaxed">
                      This includes:
                    </p>
                    <ul className="list-disc list-inside text-sm mt-2 space-y-1 ml-4">
                      <li>Name, email address, and password</li>
                      <li>Profile information and avatar</li>
                      <li>Content you post, including text, photos, and comments</li>
                      <li>Communications you send to us</li>
                    </ul>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-white mb-3">2. How We Use Your Information</h4>
                    <p className="text-sm leading-relaxed">
                      We use the information we collect to:
                    </p>
                    <ul className="list-disc list-inside text-sm mt-2 space-y-1 ml-4">
                      <li>Provide, maintain, and improve our services</li>
                      <li>Process transactions and send related information</li>
                      <li>Send you technical notices and support messages</li>
                      <li>Communicate with you about products, services, and promotions</li>
                      <li>Monitor and analyze trends and usage</li>
                    </ul>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-white mb-3">3. Information Sharing</h4>
                    <p className="text-sm leading-relaxed mb-3">
                      We do not sell, trade, or otherwise transfer your personal information to third parties without your consent,
                      except as described in this policy.
                    </p>
                    <p className="text-sm leading-relaxed">
                      We may share your information in the following situations:
                    </p>
                    <ul className="list-disc list-inside text-sm mt-2 space-y-1 ml-4">
                      <li>With service providers who assist us in operating our platform</li>
                      <li>When required by law or to protect our rights</li>
                      <li>In connection with a merger, acquisition, or sale of assets</li>
                      <li>With your consent or at your direction</li>
                    </ul>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-white mb-3">4. Data Security</h4>
                    <p className="text-sm leading-relaxed">
                      We implement appropriate technical and organizational measures to protect your personal information against
                      unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet
                      is 100% secure.
                    </p>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-white mb-3">5. Data Retention</h4>
                    <p className="text-sm leading-relaxed">
                      We retain your personal information for as long as necessary to provide our services and fulfill the purposes
                      outlined in this policy, unless a longer retention period is required by law.
                    </p>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-white mb-3">6. Your Rights</h4>
                    <p className="text-sm leading-relaxed">
                      Depending on your location, you may have the following rights regarding your personal information:
                    </p>
                    <ul className="list-disc list-inside text-sm mt-2 space-y-1 ml-4">
                      <li>Access: Request a copy of your personal information</li>
                      <li>Correction: Request correction of inaccurate information</li>
                      <li>Deletion: Request deletion of your personal information</li>
                      <li>Portability: Request transfer of your data</li>
                      <li>Objection: Object to processing of your personal information</li>
                    </ul>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-white mb-3">7. Cookies and Tracking</h4>
                    <p className="text-sm leading-relaxed">
                      We use cookies and similar technologies to enhance your experience, analyze usage, and assist in our marketing efforts.
                      You can control cookie settings through your browser preferences.
                    </p>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-white mb-3">8. Third-Party Services</h4>
                    <p className="text-sm leading-relaxed">
                      Our service may contain links to third-party websites or services that are not owned or controlled by us.
                      We are not responsible for the privacy practices of these third parties.
                    </p>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-white mb-3">9. Children&apos;s Privacy</h4>
                    <p className="text-sm leading-relaxed">
                      Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.
                      If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information.
                    </p>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-white mb-3">10. Changes to This Policy</h4>
                    <p className="text-sm leading-relaxed">
                      We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page
                      and updating the &quot;Last updated&quot; date.
                    </p>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-white mb-3">11. Contact Us</h4>
                    <p className="text-sm leading-relaxed">
                      If you have any questions about this Privacy Policy, please contact us at privacy@gigabit.com.
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