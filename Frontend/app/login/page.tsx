'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Eye, EyeOff, Mail, Lock, User, Calendar, Camera, Edit3, ArrowRight, Sparkles, Upload, Chrome, Apple as AppleIcon, GithubIcon } from 'lucide-react'

export default function LoginPage() {
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

      // Redirect to dashboard on success
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>
      
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          >
            <Sparkles className="w-2 h-2 text-white/30" />
          </div>
        ))}
      </div>

      <div className="relative min-h-screen flex flex-col justify-center py-6 px-4 sm:py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center p-2 mb-4">
            
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-emerald-100 to-teal-200 bg-clip-text text-transparent mb-3 tracking-tight">
            SocialConnect
          </h1>
          <p className="text-base sm:text-lg text-white/80 font-light">
            Step into tomorrow's social experience
          </p>
        </div>

        {/* Main Form Container */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="relative group">
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl shadow-black/20"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-3xl"></div>
            
            <div className="relative p-6 sm:p-8">
              <div className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4 mb-4">
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
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl placeholder-white/50 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 focus:bg-white/15 transition-all duration-300 backdrop-blur-sm text-lg"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400/0 via-emerald-400/0 to-emerald-400/0 group-focus-within:from-emerald-400/10 group-focus-within:via-emerald-400/5 group-focus-within:to-teal-400/10 transition-all duration-500 pointer-events-none"></div>
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
                    className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-2xl placeholder-white/50 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 focus:bg-white/15 transition-all duration-300 backdrop-blur-sm text-lg"
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
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400/0 via-emerald-400/0 to-emerald-400/0 group-focus-within:from-emerald-400/10 group-focus-within:via-emerald-400/5 group-focus-within:to-teal-400/10 transition-all duration-500 pointer-events-none"></div>
                </div>

                {/* Login Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={handleSubmit}
                    className="group relative w-full flex justify-center items-center py-4 px-6 border-0 text-lg font-semibold rounded-2xl text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-teal-500/25 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
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
                </div>

                {/* Forgot Password */}
                <div className="text-center">
                  <button className="text-sm text-white/70 hover:text-white hover:underline transition-colors font-medium">
                    Forgot your password?
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-transparent text-white/60 font-medium">or continue with</span>
                  </div>
                </div>
              </div>

              {/* Social Login */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button className="group relative flex justify-center items-center py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white/80 hover:text-white transition-all duration-200 backdrop-blur-sm">
                  <Chrome className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Google</span>
                </button>
                <button className="group relative flex justify-center items-center py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white/80 hover:text-white transition-all duration-200 backdrop-blur-sm">
                                  <GithubIcon className="w-4 h-4 mr-2" />

                  <span className="text-sm font-medium">GitHub</span>
                </button>
              </div>

              {/* Create Account */}
              <div className="mt-8">
                <Link
    href="/register"
    className="w-full flex justify-center items-center py-4 px-6 border border-white/30 rounded-2xl text-lg font-semibold text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 backdrop-blur-sm hover:border-white/50"
  >
    Create New Account
  </Link>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center space-y-2">
            <div className="flex justify-center space-x-6 text-xs text-white/50">
              <button className="hover:text-white/80 transition-colors">Terms</button>
              <button className="hover:text-white/80 transition-colors">Privacy</button>
              <button className="hover:text-white/80 transition-colors">Cookies</button>
            </div>
            <p className="text-xs text-white/40">
              SocialConnect © 2025 • Crafted with ✨
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}