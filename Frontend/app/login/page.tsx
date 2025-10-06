'use client'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react'

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
              <p className="text-xl lg:text-2xl text-white/80 font-light leading-relaxed">
                Sign in to continue your journey and connect with your community.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-white/70 text-sm">Real-time messaging</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                <span className="text-white/70 text-sm">Smart communities</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                <span className="text-white/70 text-sm">Event planning</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="text-white/70 text-sm">Privacy first</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center px-8 lg:px-16 xl:px-24">
          <div className="w-full max-w-md">
            <div className="relative group">
              {/* Glassmorphism Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl shadow-black/20"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-3xl"></div>
              
              <div className="relative p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Form Header */}
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">Sign In</h2>
                    <p className="text-white/60">Enter your credentials to continue</p>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4 mb-6">
                      <p className="text-red-300 text-sm text-center">{error}</p>
                    </div>
                  )}

                  {/* Email Input */}
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <Mail className="h-5 w-5 text-white/70 group-focus-within:text-emerald-400 transition-colors" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl placeholder-white/50 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 focus:bg-white/15 transition-all duration-300 backdrop-blur-sm"
                      placeholder="Email address"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Password Input */}
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <Lock className="h-5 w-5 text-white/70 group-focus-within:text-emerald-400 transition-colors" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-2xl placeholder-white/50 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 focus:bg-white/15 transition-all duration-300 backdrop-blur-sm"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center z-10"
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
                    className="group relative w-full flex justify-center items-center py-4 px-6 text-lg font-semibold rounded-2xl text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-teal-400/50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-teal-500/25 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <span className="relative flex items-center">
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Signing you in...
                        </>
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </span>
                  </button>

                  {/* Terms */}
                  <div className="text-center text-sm text-white/60 mb-4">
                    By signing in, you agree to our{' '}
                    <button className="text-emerald-300 hover:text-emerald-200 hover:underline transition-colors">
                      Terms of Service
                    </button>{' '}
                    and{' '}
                    <button className="text-emerald-300 hover:text-emerald-200 hover:underline transition-colors">
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
          <button className="hover:text-white/60 transition-colors">Terms</button>
          <button className="hover:text-white/60 transition-colors">Privacy</button>
          <button className="hover:text-white/60 transition-colors">© 2025 Gigabit</button>
        </div>
      </div>
    </div>
  )
}

export default dynamic(() => Promise.resolve(LoginPage), { ssr: false })
