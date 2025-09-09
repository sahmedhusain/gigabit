'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getAvatarOptions } from '@/utils/avatarUtils'

import { Eye, EyeOff, Mail, Lock, User, Calendar, Camera, Edit3, ArrowRight, Sparkles, Upload, Chrome, Apple as AppleIcon, GithubIcon } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nickname: '',
    aboutMe: '',
    avatar: '/avatars/defaultM.png' // Set default avatar value
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>('/avatars/defaultM.png') // Default avatar
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value.trim()
    })
  }

  const handleAvatarSelect = (avatarId: string) => {
    const selectedAvatar = getAvatarOptions().find(avatar => avatar.id === avatarId);
    setFormData({ ...formData, avatar: selectedAvatar?.imageUrl || avatarId })
    
    // Set preview to the selected avatar's image URL or ID for fallback
    setAvatarPreview(selectedAvatar?.imageUrl || avatarId)
  }


  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.dateOfBirth) {
        throw new Error('Please fill in all required fields')
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address')
      }

      // Validate password length
      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long')
      }

      console.log("Form data before sending:", {
        ...formData, 
        avatar: formData.avatar ? `${formData.avatar.substring(0, 50)}...` : 'No Avatar'
      })

      // Call register function from auth context
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        nickname: formData.nickname,
        aboutMe: formData.aboutMe,
        avatar: formData.avatar,
      })

      // Redirect to dashboard on success
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
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
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          >
            <Sparkles className="w-2 h-2 text-white/20" />
          </div>
        ))}
      </div>

      <div className="relative min-h-screen flex flex-col justify-center py-6 px-4 sm:py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center p-2 mb-4">

          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-emerald-100 to-teal-200 bg-clip-text text-transparent mb-3 tracking-tight">
            Join Gigabit
          </h1>
          <p className="text-base sm:text-lg text-white/80 font-light">
            Create your account and start connecting
          </p>
        </div>

        {/* Main Form Container */}
        <div className="sm:mx-auto sm:w-full sm:max-w-lg">
          <div className="relative group">
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl shadow-black/20"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-3xl"></div>

            <div className="relative p-6 sm:p-8">
              <div className="space-y-6">
                {/* Avatar Selection */}
                <div className="flex flex-col items-center mb-6 space-y-6">
                  {/* Current Avatar Preview with Label */}
                  <div className="text-center space-y-3">
                    <h3 className="text-sm font-medium text-white/80 mb-2">Your Avatar</h3>
                    <div className="relative group">
                      <div className="w-28 h-28 rounded-full bg-white/10 border-2 border-emerald-400/50 shadow-lg shadow-emerald-400/20 flex items-center justify-center overflow-hidden backdrop-blur-sm">
                        {avatarPreview ? (
                          avatarPreview.startsWith('/') || avatarPreview.startsWith('data:') ? (
                            <img src={avatarPreview} alt="Selected Avatar" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            // Show gradient for selected avatar ID
                            (() => {
                              const selectedAvatar = getAvatarOptions().find(avatar => avatar.id === avatarPreview);
                              return selectedAvatar ? (
                                <div className={`w-full h-full rounded-full bg-gradient-to-r ${selectedAvatar.gradient} flex items-center justify-center`}>
                                  <span className="text-white font-semibold text-2xl drop-shadow-lg">
                                    {selectedAvatar.label}
                                  </span>
                                </div>
                              ) : (
                                <Camera className="w-8 h-8 text-white/50" />
                              );
                            })()
                          )
                        ) : (
                          <Camera className="w-8 h-8 text-white/50" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Avatar Options with Label */}
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="h-px w-8 bg-white/20"></div>
                      <h4 className="text-sm font-medium text-white/70">Choose an Avatar</h4>
                      <div className="h-px w-8 bg-white/20"></div>
                    </div>
                    <div className="flex space-x-4">
                      {getAvatarOptions().map((avatar) => (
                        <div
                          key={avatar.id}
                          onClick={() => handleAvatarSelect(avatar.id)}
                          className={`relative w-20 h-20 rounded-full border-2 cursor-pointer hover:scale-110 transition-all duration-300 flex items-center justify-center backdrop-blur-sm overflow-hidden group ${
                            formData.avatar === avatar.id
                              ? 'border-emerald-400 shadow-lg shadow-emerald-400/30 ring-2 ring-emerald-400/20'
                              : 'border-white/30 hover:border-emerald-400/60 hover:shadow-md hover:shadow-emerald-400/20'
                          }`}
                        >
                          {/* Image layer */}
                          <img 
                            src={avatar.imageUrl} 
                            alt={`Avatar option ${avatar.label}`}
                            className="w-full h-full object-cover absolute inset-0 z-10 rounded-full"
                            onError={(e) => {
                              // Hide image on error, showing gradient fallback
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          {/* Gradient fallback layer */}
                          <div className={`w-full h-full rounded-full bg-gradient-to-r ${avatar.gradient} flex items-center justify-center absolute inset-0 z-0`}>
                            <span className="text-white font-semibold text-lg drop-shadow-lg">
                              {avatar.label}
                            </span>
                          </div>
                          
                          {/* Selected indicator */}
                          {formData.avatar === avatar.id && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full flex items-center justify-center shadow-lg z-20">
                              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                            </div>
                          )}
                          
                          {/* Hover overlay */}
                          <div className="absolute inset-0 rounded-full bg-emerald-400/0 group-hover:bg-emerald-400/10 transition-all duration-200 z-10"></div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-white/50">Click on any avatar to select it</p>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4 mb-4">
                    <p className="text-red-300 text-sm text-center">{error}</p>
                  </div>
                )}

                {/* Name Fields Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <User className="h-5 w-5 text-white/70 group-focus-within:text-emerald-400 transition-colors" />
                    </div>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl placeholder-white/50 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 focus:bg-white/15 transition-all duration-300 backdrop-blur-sm text-base"
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                    />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400/0 via-emerald-400/0 to-emerald-400/0 group-focus-within:from-emerald-400/10 group-focus-within:via-emerald-400/5 group-focus-within:to-teal-400/10 transition-all duration-500 pointer-events-none"></div>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <User className="h-5 w-5 text-white/70 group-focus-within:text-emerald-400 transition-colors" />
                    </div>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl placeholder-white/50 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 focus:bg-white/15 transition-all duration-300 backdrop-blur-sm text-base"
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={handleInputChange}
                    />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400/0 via-emerald-400/0 to-emerald-400/0 group-focus-within:from-emerald-400/10 group-focus-within:via-emerald-400/5 group-focus-within:to-teal-400/10 transition-all duration-500 pointer-events-none"></div>
                  </div>
                </div>

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
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl placeholder-white/50 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 focus:bg-white/15 transition-all duration-300 backdrop-blur-sm text-base"
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
                    autoComplete="new-password"
                    required
                    className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-2xl placeholder-white/50 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 focus:bg-white/15 transition-all duration-300 backdrop-blur-sm text-base"
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

                {/* Date of Birth */}
                <div className="relative group">
                  <label htmlFor="dateOfBirth" className="sr-only">Date of Birth</label>
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <Calendar className="h-5 w-5 text-white/70 group-focus-within:text-emerald-400 transition-colors" />
                  </div>
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    required
                    title="Date of Birth"
                    aria-label="Date of Birth"
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl placeholder-white/50 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 focus:bg-white/15 transition-all duration-300 backdrop-blur-sm text-base [color-scheme:dark]"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400/0 via-emerald-400/0 to-emerald-400/0 group-focus-within:from-emerald-400/10 group-focus-within:via-emerald-400/5 group-focus-within:to-teal-400/10 transition-all duration-500 pointer-events-none"></div>
                </div>

                {/* Nickname (Optional) */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <Edit3 className="h-5 w-5 text-white/70 group-focus-within:text-emerald-400 transition-colors" />
                  </div>
                  <input
                    id="nickname"
                    name="nickname"
                    type="text"
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl placeholder-white/50 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 focus:bg-white/15 transition-all duration-300 backdrop-blur-sm text-base"
                    placeholder="Nickname (Optional)"
                    value={formData.nickname}
                    onChange={handleInputChange}
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400/0 via-emerald-400/0 to-emerald-400/0 group-focus-within:from-emerald-400/10 group-focus-within:via-emerald-400/5 group-focus-within:to-teal-400/10 transition-all duration-500 pointer-events-none"></div>
                </div>

                {/* About Me (Optional) */}
                <div className="relative group">
                  <div className="absolute top-4 left-0 pl-4 flex items-start pointer-events-none z-10">
                    <Edit3 className="h-5 w-5 text-white/70 group-focus-within:text-emerald-400 transition-colors mt-0.5" />
                  </div>
                  <textarea
                    id="aboutMe"
                    name="aboutMe"
                    rows={3}
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl placeholder-white/50 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 focus:bg-white/15 transition-all duration-300 backdrop-blur-sm text-base resize-none"
                    placeholder="Tell us about yourself (Optional)"
                    value={formData.aboutMe}
                    onChange={handleInputChange}
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400/0 via-emerald-400/0 to-emerald-400/0 group-focus-within:from-emerald-400/10 group-focus-within:via-emerald-400/5 group-focus-within:to-teal-400/10 transition-all duration-500 pointer-events-none"></div>
                </div>

                {/* Register Button */}
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
                          Creating your account...
                        </>
                      ) : (
                        <>
                          Create Account
                          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </span>
                  </button>
                </div>

                {/* Terms */}
                <div className="text-center text-sm text-white/60">
                  By creating an account, you agree to our{' '}
                  <button className="text-emerald-300 hover:text-emerald-200 hover:underline transition-colors">
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button className="text-emerald-300 hover:text-emerald-200 hover:underline transition-colors">
                    Privacy Policy
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
                    <span className="px-4 bg-transparent text-white/60 font-medium">or sign up with</span>
                  </div>
                </div>
              </div>

              {/* Social Register */}
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

              {/* Login Link */}
              <div className="mt-8 text-center">
                <p className="text-white/70">
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    className="text-emerald-300 hover:text-emerald-200 hover:underline transition-colors font-medium">
                    Sign In

                  </Link>
                </p>
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
              Gigabit © 2025 All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
