'use client'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles, X } from 'lucide-react'
import { motion } from 'framer-motion'
import TermsPopup from '@/components/TermsPopup'
import PrivacyPopup from '@/components/PrivacyPopup'

function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value.trim()
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.email || !formData.password) {
        throw new Error('Please fill in all fields')
      }

      // Call login function from auth context
      await login(formData.email, formData.password)

      // Redirect to feed on success
      router.push('/feed/all')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => {
          const left = (i * 23 + 17) % 100;
          const top = (i * 31 + 41) % 100;
          const delay = (i * 0.3) % 3;
          const duration = 3 + (i * 0.2) % 2;

          return (
            <div
              key={i}
              className={`absolute animate-bounce`}
              style={{
                left: `${left}%`,
                top: `${top}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`
              }}
            >
              <Sparkles className="w-2 h-2 text-white/30" />
            </div>
          );
        })}
      </div>

      {/* Main Container - Horizontal Layout */}
      <div className="relative h-full flex">
        {/* Left Side - Welcome Content */}
        <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 xl:px-24">
          <div className="max-w-xl">
            {/* Logo */}
            <div className="mb-8">
              <div className="relative h-16 w-48">
                <Image
                  src="/logo.png"
                  alt="Gigabit Logo"
                  fill
                  sizes="192px"
                  className="object-contain drop-shadow-2xl"
                />
              </div>
            </div>

            {/* Welcome Text */}
            <div className="mb-8">
              <h1 className="text-4xl lg:text-6xl xl:text-7xl font-bold bg-gradient-to-r from-white via-emerald-100 to-teal-200 bg-clip-text text-transparent mb-6 leading-tight">
                Welcome Back
              </h1>

            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="group p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 hover:border-emerald-400/30 transition-all duration-300">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full group-hover:animate-bounce"></div>
                  <span className="text-white/80 text-sm font-medium">Real-time messaging</span>
                </div>
                <p className="text-white/60 text-xs">Connect instantly with friends</p>
              </div>
              <div className="group p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 hover:border-teal-400/30 transition-all duration-300">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-2 h-2 bg-teal-400 rounded-full group-hover:animate-bounce delay-100"></div>
                  <span className="text-white/80 text-sm font-medium">Smart communities</span>
                </div>
                <p className="text-white/60 text-xs">Join groups that matter</p>
              </div>
              <div className="group p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 hover:border-cyan-400/30 transition-all duration-300">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full group-hover:animate-bounce delay-200"></div>
                  <span className="text-white/80 text-sm font-medium">Event planning</span>
                </div>
                <p className="text-white/60 text-xs">Organize and discover events</p>
              </div>
              <div className="group p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 hover:border-purple-400/30 transition-all duration-300">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full group-hover:animate-bounce delay-300"></div>
                  <span className="text-white/80 text-sm font-medium">Privacy first</span>
                </div>
                <p className="text-white/60 text-xs">Your data stays secure</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="w-full max-w-2xl">
            <div className="relative group">
              {/* Glassmorphism Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl shadow-black/20"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-3xl"></div>

              <div className="relative p-6 sm:p-8 lg:p-10 xl:p-12">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Form Header */}
                  <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-emerald-100 to-teal-200 bg-clip-text text-transparent mb-2">Sign In</h2>
                    <p className="text-white/60 text-sm">Enter your credentials to continue</p>
                  </div>

                  {/* Error Message Below Header */}
                  {error && (
                    <motion.div
                      className="bg-gradient-to-br from-red-500/10 via-pink-500/10 to-rose-500/10 backdrop-blur-sm rounded-3xl p-4 border border-red-400/30 shadow-xl shadow-red-500/20 mb-6"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-pink-500/5 to-rose-500/5 rounded-3xl"></div>
                      <div className="relative flex items-start space-x-4">
                        <motion.div
                          className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-red-400/20 to-pink-400/20 flex items-center justify-center border border-red-400/30"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 17 }}
                        >
                          <X className="w-4 h-4 text-red-400" />
                        </motion.div>
                        <div className="flex-1">
                          <motion.p
                            className="text-red-200/90 text-sm leading-relaxed"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                          >
                            {error}
                          </motion.p>
                        </div>
                      </div>
                      <div className="absolute top-3 right-3">
                        <motion.div
                          className="w-2 h-2 bg-red-400 rounded-full animate-pulse"
                          initial={{ scale: 0 }}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ delay: 0.3, duration: 1.5, repeat: Infinity }}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Email Input */}
                  <div className="relative group">
                    <label htmlFor="email" className="block text-xs font-semibold text-white/90 mb-2 uppercase tracking-wide">
                      Email Address
                    </label>
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10 top-7">
                      <Mail className="h-4 w-4 text-emerald-400/70 group-focus-within:text-emerald-400 transition-colors duration-300" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="w-full pl-11 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl placeholder-white/40 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 focus:bg-white/15 transition-all duration-300 backdrop-blur-sm hover:border-white/30"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Password Input */}
                  <div className="relative group">
                    <label htmlFor="password" className="block text-xs font-semibold text-white/90 mb-2 uppercase tracking-wide">
                      Password
                    </label>
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10 top-7">
                      <Lock className="h-4 w-4 text-emerald-400/70 group-focus-within:text-emerald-400 transition-colors duration-300" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      className="w-full pl-11 pr-12 py-3.5 bg-white/10 border border-white/20 rounded-xl placeholder-white/40 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 focus:bg-white/15 transition-all duration-300 backdrop-blur-sm hover:border-white/30"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center z-10 top-7 hover:scale-110 transition-transform duration-200"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-white/70 hover:text-white/90 transition-colors" />
                      ) : (
                        <Eye className="h-5 w-5 text-white/70 hover:text-white/90 transition-colors" />
                      )}
                    </button>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full flex justify-center items-center py-4 px-6 text-lg font-semibold rounded-2xl text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-teal-400/50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-teal-500/25 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative flex items-center z-10">
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Signing you in...
                        </>
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                        </>
                      )}
                    </span>
                  </button>

                  {/* Terms */}
                  <div className="text-center text-sm text-white/60 mb-4">
                    By signing in, you agree to our{' '}
                    <button
                      onClick={() => setShowTerms(true)}
                      className="text-emerald-300 hover:text-emerald-200 hover:underline transition-colors"
                    >
                      Terms of Service
                    </button>{' '}
                    and{' '}
                    <button
                      onClick={() => setShowPrivacy(true)}
                      className="text-emerald-300 hover:text-emerald-200 hover:underline transition-colors"
                    >
                      Privacy Policy
                    </button>
                  </div>

                  {/* Sign Up Link */}
                  <div className="text-center">
                    <p className="text-white/70">
                      Don&apos;t have an account?{' '}
                      <Link
                        href="/register"
                        className="text-emerald-300 hover:text-emerald-200 hover:underline transition-colors font-medium group inline-flex items-center"
                      >
                        <span>Sign Up</span>
                        <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center space-x-6 text-xs text-white/40">
          <button onClick={() => setShowTerms(true)} className="hover:text-white/60 transition-colors">Terms</button>
          <button onClick={() => setShowPrivacy(true)} className="hover:text-white/60 transition-colors">Privacy</button>
          <button className="hover:text-white/60 transition-colors">© 2025 Gigabit</button>
        </div>
      </div>

      {/* Popups */}
      <TermsPopup isOpen={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyPopup isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </div>
  )
}

export default dynamic(() => Promise.resolve(LoginPage), { ssr: false })
