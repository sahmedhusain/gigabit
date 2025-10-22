'use client'
/* eslint-disable react/style-prop-object, @typescript-eslint/no-explicit-any */
import dynamic from 'next/dynamic'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getAvatarOptions } from '@/utils/avatarUtils'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

import { Eye, EyeOff, Mail, Lock, User, Calendar, Camera, Edit3, ArrowRight, Sparkles, ChevronDown, ChevronUp, X, Palette, Check } from 'lucide-react'
import TermsPopup from '@/components/TermsPopup'
import PrivacyPopup from '@/components/PrivacyPopup'

function validatePassword(password: string) {

  const upper = /[A-Z]/
  const lower = /[a-z]/
  const number = /[0-9]/
  const space = /\s/
  // Allow only ASCII printable characters (excluding space, but including common symbols)
  const allowedChars = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]+$/

  const errors = []

  if (password.length < 8 || password.length > 32) {
    errors.push("be between 8 and 32 characters long")
  }

  if (!upper.test(password)) {
    errors.push("contain at least one uppercase letter")
  }

  if (!lower.test(password)) {
    errors.push("contain at least one lowercase letter")
  }

  if (!number.test(password)) {
    errors.push("contain at least one number")
  }

  if (space.test(password)) {
    errors.push("not contain any spaces")
  }

  if (!allowedChars.test(password)) {
    errors.push("only contain English letters, numbers, and common symbols (no emojis or special characters)")
  }

  // combine errors into a single message
  if (errors.length > 0) {
    const lastError = errors.pop() // for adding 'and' before the last error
    return "Password must " + (errors.length ? errors.join(", ") + ", and " + lastError : lastError)
  }

  return null
}

function validateNickname(nickname: string) {
  if (!nickname) return null // nickname is optional
  
  // Allow only English letters (a-z, A-Z), numbers (0-9), underscore (_), hyphen (-), and dot (.)
  const allowedCharsRegex = /^[a-zA-Z0-9._-]+$/
  
  if (!allowedCharsRegex.test(nickname)) {
    return "Nickname can only contain English letters, numbers, underscore (_), hyphen (-), and dot (.)"
  }
  
  // Must start with a letter or number (not special characters)
  const startsWithAlphanumeric = /^[a-zA-Z0-9]/
  if (!startsWithAlphanumeric.test(nickname)) {
    return "Nickname must start with a letter or number"
  }
  
  // Must end with a letter or number (not special characters)
  const endsWithAlphanumeric = /[a-zA-Z0-9]$/
  if (!endsWithAlphanumeric.test(nickname)) {
    return "Nickname must end with a letter or number"
  }
  
  return null
}


function RegisterPage() {
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
    avatar: '',
    gender: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showOptionalFields, setShowOptionalFields] = useState(false)
  const [showAvatarPopup, setShowAvatarPopup] = useState(false)
  const [nicknameError, setNicknameError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    setFormData({
      ...formData,
      [name]: value
    })

    // Clear password error when user starts typing again
    if (name === 'password') {
      setPasswordError(null)
    }

    // Real-time validation for nickname
    if (name === 'nickname') {
      const validation = validateNickname(value)
      setNicknameError(validation)
    }
  }

  const handleGenderSelect = (gender: 'male' | 'female') => {
    setFormData({
      ...formData,
      gender: gender,
      avatar: ''
    })
    setAvatarPreview(null)
  }

  const handleAvatarSelect = (avatarId: string) => {
    const selectedAvatar = getAvatarOptions(formData.gender as 'male' | 'female').find(avatar => avatar.id === avatarId);
    if (selectedAvatar) {
      // Always store the imageUrl for consistency
      setFormData({ ...formData, avatar: selectedAvatar.imageUrl })
      setAvatarPreview(selectedAvatar.imageUrl)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        // Overwrite any existing avatar selection with uploaded image
        setFormData({ ...formData, avatar: result });
        setAvatarPreview(result);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }


  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)
    setPasswordError(null)

    try {
      // Validate required fields
      if (!formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.dateOfBirth) {
        throw new Error('Please fill in all required fields')
      }

      if (formData.firstName.length < 3) {
        throw new Error('First name must be at least 3 characters long')
      }

      if (formData.firstName.length > 16) {
        throw new Error('First name is too long')
      }

      if (formData.lastName.length < 3) {
        throw new Error('Last name must be at least 3 characters long')
      }

      if (formData.lastName.length > 16) {
        throw new Error('Last name is too long')
      }

      // Validate email format
      const emailRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~]+(\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address')
      }

      // Validate password and set specific error
      const passwordValidation = validatePassword(formData.password)
      if (passwordValidation) {
        setPasswordError(passwordValidation)
        setIsLoading(false)
        return // Don't proceed with submission
      }

      if (formData.nickname && formData.nickname.length > 16) {
        throw new Error('Nickname is too long')
      }

      const nicknameValidation = validateNickname(formData.nickname)
      if (nicknameValidation) {
        throw new Error(nicknameValidation)
      }

      // Validate date of birth
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      // Adjust age if birthday hasn't occurred this year
      const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
        ? age - 1 
        : age;
      
      if (adjustedAge < 13) {
        throw new Error('You must be at least 13 years old');
      } else if (adjustedAge > 150) {
        throw new Error('Please enter a valid date of birth');
      } else if (birthDate > today) {
        throw new Error('Date of birth must be less than today');
      }

      if (formData.aboutMe.length > 128) {
        throw new Error('Your bio is too long');
      }

      console.log("Form data before sending:", {
        ...formData,
        avatar: formData.avatar ? `${formData.avatar.substring(0, 50)}...` : 'No Avatar'
      })

      // Call register function from auth context
      await register({
        email: formData.email.trim(),
        password: formData.password.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        dateOfBirth: formData.dateOfBirth.trim(),
        nickname: formData.nickname,
        aboutMe: formData.aboutMe,
        avatar: formData.avatar.trim(),
      })

      // Redirect to feed on success
      router.push('/feed/all')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Registration failed. Please try again.')
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                left: `${left}%`,
                top: `${top}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`
              } as any}
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
                Join Gigabit
              </h1>
              <p className="text-xl lg:text-2xl text-white/80 font-light leading-relaxed">
                Create your account and start connecting with amazing
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="group p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 hover:border-emerald-400/30 transition-all duration-300">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full group-hover:animate-bounce"></div>
                  <span className="text-white/80 text-sm font-medium">Personalized avatars</span>
                </div>
                <p className="text-white/60 text-xs">Express yourself with custom avatars</p>
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

        {/* Right Side - Register Form */}
        <div className="flex-1 flex items-center justify-center px-8 lg:px-16 xl:px-24">
          {/* Enhanced Professional Form Container */}
          <div className="w-full max-w-full">
            <div className="relative group h-[80vh] rounded-3xl">
              {/* Glassmorphism Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl shadow-black/20"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-3xl"></div>

              {/* Fixed Header */}
              <div className="relative p-6 pb-4">
                <div className="text-center">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-emerald-100 to-teal-200 bg-clip-text text-transparent mb-2">Create Account</h2>
                  <p className="text-white/60 text-sm">Fill in your details to get started</p>
                </div>
              </div>

              {/* Error Message Below Header */}
              {error && (
                <div className="relative px-6 pb-4">
                  <motion.div
                    className="bg-gradient-to-br from-red-500/10 via-pink-500/10 to-rose-500/10 backdrop-blur-sm rounded-3xl p-4 border border-red-400/30 shadow-xl shadow-red-500/20"
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
                </div>
              )}

              {/* Scrollable Content */}
              <div className="relative h-[calc(100%-9.5rem)] overflow-y-auto px-6 pb-1 custom-scrollbar">
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">

                  {/* Two Container Layout - Side by Side */}
                  <div className="flex gap-6">
                    {/* Left Container - Required Fields */}
                    <div className="flex-1 space-y-4">
                      {/* Name Fields Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative group">
                          <label htmlFor="firstName" className="block text-xs font-semibold text-white/90 mb-2 uppercase tracking-wide">
                            First Name
                          </label>
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10 top-7">
                            <User className="h-4 w-4 text-emerald-400/70 group-focus-within:text-emerald-400 transition-colors" />
                          </div>
                          <input
                            id="firstName"
                            name="firstName"
                            type="text"
                            required
                            className="w-full pl-11 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl placeholder-white/40 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 focus:bg-white/15 transition-all duration-300 backdrop-blur-sm hover:border-white/30"
                            placeholder="First name"
                            value={formData.firstName}
                            onChange={handleInputChange}
                          />
                        </div>

                        <div className="relative group">
                          <label htmlFor="lastName" className="block text-xs font-semibold text-white/90 mb-2 uppercase tracking-wide">
                            Last Name
                          </label>
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10 top-7">
                            <User className="h-4 w-4 text-emerald-400/70 group-focus-within:text-emerald-400 transition-colors" />
                          </div>
                          <input
                            id="lastName"
                            name="lastName"
                            type="text"
                            required
                            className="w-full pl-11 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl placeholder-white/40 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 focus:bg-white/15 transition-all duration-300 backdrop-blur-sm hover:border-white/30"
                            placeholder="Last name"
                            value={formData.lastName}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      {/* Email Input */}
                      <div className="relative group">
                        <label htmlFor="email" className="block text-xs font-semibold text-white/90 mb-2 uppercase tracking-wide">
                          Email Address
                        </label>
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10 top-7">
                          <Mail className="h-4 w-4 text-emerald-400/70 group-focus-within:text-emerald-400 transition-colors" />
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
                          <Lock className={`h-4 w-4 ${passwordError ? 'text-red-400' : 'text-emerald-400/70 group-focus-within:text-emerald-400'} transition-colors`} />
                        </div>
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          required
                          className={`w-full pl-11 pr-12 py-3.5 bg-white/10 border ${passwordError ? 'border-red-400/50' : 'border-white/20'} rounded-xl placeholder-white/40 text-white focus:outline-none focus:ring-2 ${passwordError ? 'focus:ring-red-400/50 focus:border-red-400/50' : 'focus:ring-emerald-400/50 focus:border-emerald-400/50'} focus:bg-white/15 transition-all duration-300 backdrop-blur-sm hover:border-white/30`}
                          placeholder="Create a strong password"
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
                        {passwordError && (
                          <motion.div
                            className="mt-2 flex items-start space-x-2 bg-gradient-to-r from-red-500/10 to-pink-500/10 backdrop-blur-sm rounded-xl p-3 border border-red-400/20"
                            initial={{ opacity: 0, y: -5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          >
                            <div className="w-4 h-4 rounded-full bg-red-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <X className="w-3 h-3 text-red-400" />
                            </div>
                            <p className="text-red-300/90 text-xs leading-relaxed">{passwordError}</p>
                          </motion.div>
                        )}
                      </div>

                      {/* Date of Birth */}
                      <div className="relative group">
                        <label htmlFor="dateOfBirth" className="block text-xs font-semibold text-white/90 mb-2 uppercase tracking-wide">Date of Birth</label>
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10 top-7">
                          <Calendar className="h-4 w-4 text-emerald-400/70 group-focus-within:text-emerald-400 transition-colors" />
                        </div>
                        <input
                          id="dateOfBirth"
                          name="dateOfBirth"
                          type="date"
                          required
                          title="Date of Birth"
                          aria-label="Date of Birth"
                          className="w-full pl-11 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl placeholder-white/40 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 focus:bg-white/15 transition-all duration-300 backdrop-blur-sm hover:border-white/30 [color-scheme:dark]"
                          value={formData.dateOfBirth}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    {/* Right Container - Optional Fields */}
                    <div className="flex-1 space-y-4">
                      {/* Avatar Selection - Clickable Circle */}
                      <div className="text-center space-y-3">
                        <h4 className="text-xs font-semibold text-white/90 uppercase tracking-wide">Choose Your Avatar</h4>
                        <div className="relative group cursor-pointer hover:scale-105 transition-transform duration-300" onClick={() => setShowAvatarPopup(true)}>
                          <div className="w-28 h-28 rounded-full bg-white/10 border-2 border-emerald-400/50 shadow-lg shadow-emerald-400/20 flex items-center justify-center overflow-hidden backdrop-blur-sm mx-auto hover:border-emerald-400 hover:shadow-emerald-400/40 transition-all duration-300">
                            {avatarPreview ? (
                              avatarPreview.startsWith('/') || avatarPreview.startsWith('data:') ? (
                                <Image src={avatarPreview} alt="Selected Avatar" width={112} height={112} className="w-full h-full object-cover rounded-full" />
                              ) : (
                                // Show gradient for selected avatar ID
                                (() => {
                                  const selectedAvatar = getAvatarOptions(formData.gender as 'male' | 'female').find(avatar => avatar.id === avatarPreview);
                                  return selectedAvatar ? (
                                    <div className={`w-full h-full rounded-full bg-gradient-to-r ${selectedAvatar.gradient} flex items-center justify-center`}>
                                      <span className="text-white font-semibold text-3xl drop-shadow-lg">
                                        {selectedAvatar.label}
                                      </span>
                                    </div>
                                  ) : (
                                    <Camera className="w-12 h-12 text-white/50" />
                                  );
                                })()
                              )
                            ) : (
                              // Show initials when no avatar is selected
                              formData.firstName && formData.lastName ? (
                                <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center">
                                  <span className="text-white font-bold text-2xl drop-shadow-lg">
                                    {formData.firstName.charAt(0).toUpperCase()}{formData.lastName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              ) : (
                                <Camera className="w-12 h-12 text-white/50" />
                              )
                            )}
                          </div>
                          {/* Click indicator */}
                          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center shadow-lg">
                            <Edit3 className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <p className="text-xs text-white/60">Click to customize your avatar</p>
                      </div>

                      {/* Nickname (Optional) */}
                      <div className="relative group">
                        <label htmlFor="nickname" className="block text-xs font-semibold text-white/90 mb-2 uppercase tracking-wide">
                          Nickname <span className="text-white/40 text-[10px] normal-case">(Optional)</span>
                        </label>
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10 top-7">
                          <Edit3 className={`h-4 w-4 ${nicknameError ? 'text-red-400' : 'text-emerald-400/70 group-focus-within:text-emerald-400'} transition-colors`} />
                        </div>
                        <input
                          id="nickname"
                          name="nickname"
                          type="text"
                          className={`w-full pl-11 pr-4 py-3.5 bg-white/10 border ${nicknameError ? 'border-red-400/50' : 'border-white/20'} rounded-xl placeholder-white/40 text-white focus:outline-none focus:ring-2 ${nicknameError ? 'focus:ring-red-400/50 focus:border-red-400/50' : 'focus:ring-emerald-400/50 focus:border-emerald-400/50'} focus:bg-white/15 transition-all duration-300 backdrop-blur-sm hover:border-white/30`}
                          placeholder="Choose a unique nickname"
                          value={formData.nickname}
                          onChange={handleInputChange}
                        />
                        {nicknameError && (
                          <motion.div
                            className="mt-2 flex items-start space-x-2 bg-gradient-to-r from-red-500/10 to-pink-500/10 backdrop-blur-sm rounded-xl p-3 border border-red-400/20"
                            initial={{ opacity: 0, y: -5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          >
                            <div className="w-4 h-4 rounded-full bg-red-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <X className="w-3 h-3 text-red-400" />
                            </div>
                            <p className="text-red-300/90 text-xs leading-relaxed">{nicknameError}</p>
                          </motion.div>
                        )}
                        {!nicknameError && formData.nickname && (
                          <motion.div
                            className="mt-2 flex items-start space-x-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 backdrop-blur-sm rounded-xl p-3 border border-emerald-400/20"
                            initial={{ opacity: 0, y: -5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          >
                            <div className="w-4 h-4 rounded-full bg-emerald-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="w-3 h-3 text-emerald-400" />
                            </div>
                            <p className="text-emerald-300/90 text-xs leading-relaxed">Valid nickname</p>
                          </motion.div>
                        )}
                      </div>

                      {/* About Me (Optional) */}
                      <div className="relative group">
                        <label htmlFor="aboutMe" className="block text-xs font-semibold text-white/90 mb-2 uppercase tracking-wide">
                          About Me <span className="text-white/40 text-[10px] normal-case">(Optional)</span>
                        </label>
                        <div className="absolute top-7 left-0 pl-3.5 flex items-start pointer-events-none z-10">
                          <Edit3 className="h-4 w-4 text-emerald-400/70 group-focus-within:text-emerald-400 transition-colors mt-3.5" />
                        </div>
                        <textarea
                          id="aboutMe"
                          name="aboutMe"
                          rows={3}
                          className="w-full pl-11 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl placeholder-white/40 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 focus:bg-white/15 transition-all duration-300 backdrop-blur-sm hover:border-white/30 resize-none"
                          placeholder="Tell us about yourself..."
                          value={formData.aboutMe}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Avatar Selection Popup */}
                  <AnimatePresence>
                    {showAvatarPopup && (
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
                          {/* Enhanced Compact Header */}
                          <motion.div
                            className="relative flex-shrink-0 p-6 lg:p-8 pb-4 bg-gradient-to-r from-white/10 to-white/5 border-b border-white/20"
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1, duration: 0.3 }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 rounded-t-3xl"></div>
                            <div className="relative flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <motion.div
                                  className="relative"
                                  whileHover={{ scale: 1.05 }}
                                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                >
                                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <Sparkles className="w-6 h-6 text-white drop-shadow-sm" />
                                  </div>
                                  <motion.div
                                    className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
                                    animate={{ scale: [1, 1.2, 1] }}
                                  />
                                </motion.div>
                                <div>
                                  <motion.h3
                                    className="text-xl lg:text-2xl font-bold text-white leading-tight"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2, duration: 0.3 }}
                                  >
                                    Customize Your Avatar
                                  </motion.h3>
                                  <motion.p
                                    className="text-white/70 text-xs leading-tight"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3, duration: 0.3 }}
                                  >
                                    Choose or upload your perfect avatar
                                  </motion.p>
                                </div>
                              </div>
                              <motion.button
                                onClick={() => setShowAvatarPopup(false)}
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

                          {/* Enhanced Compact Content */}
                          <motion.div
                            className="relative flex-1 overflow-y-auto px-6 lg:px-8 py-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                          >

                            {/* Avatar Preview at Top */}
                            <motion.div
                              className="text-center py-4"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.3, duration: 0.4 }}
                            >
                              {/* Enhanced Compact Separator */}
                              <div className="flex items-center justify-center mb-4">
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-violet-400/30 to-violet-500/50"></div>
                                <motion.div
                                  className="mx-3 px-3 py-1.5 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 rounded-full border border-violet-400/20 backdrop-blur-sm"
                                  whileHover={{ scale: 1.05 }}
                                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                >
                                  <div className="flex items-center space-x-1.5">
           
                                      <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  
                                    <span className="text-xs font-bold bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent">
                                      Avatar Preview
                                    </span>
                                  </div>
                                </motion.div>
                                <div className="flex-1 h-px bg-gradient-to-l from-transparent via-fuchsia-400/30 to-fuchsia-500/50"></div>
                              </div>

                              {/* Enhanced Avatar Container */}
                              <div className="flex justify-center">
                                <motion.div
                                  className="relative group"
                                  whileHover={{ scale: 1.08 }}
                                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                >
                                  {/* Main avatar container */}
                                  <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-white/20 via-white/15 to-white/10 border-4 border-white/30 flex items-center justify-center overflow-hidden backdrop-blur-md transition-all duration-500">
                                    {avatarPreview ? (
                                      avatarPreview.startsWith('/') || avatarPreview.startsWith('data:') ? (
                                        <Image src={avatarPreview} alt="Selected Avatar" width={112} height={112} className="w-full h-full object-cover rounded-full" />
                                      ) : (
                                        // Show gradient for selected avatar ID
                                        (() => {
                                          const selectedAvatar = getAvatarOptions(formData.gender as 'male' | 'female').find(avatar => avatar.id === avatarPreview);
                                          return selectedAvatar ? (
                                            <div className={`w-full h-full rounded-full bg-gradient-to-r ${selectedAvatar.gradient} flex items-center justify-center shadow-inner`}>
                                              <span className="text-white font-bold text-xl drop-shadow-lg">
                                                {selectedAvatar.label}
                                              </span>
                                            </div>
                                          ) : (
                                            <Camera className="w-8 h-8 text-white/60" />
                                          );
                                        })()
                                      )
                                    ) : (
                                      // Show initials when no avatar is selected
                                      formData.firstName && formData.lastName ? (
                                        <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center">
                                          <span className="text-white font-bold text-xl drop-shadow-lg">
                                            {formData.firstName.charAt(0).toUpperCase()}{formData.lastName.charAt(0).toUpperCase()}
                                          </span>
                                        </div>
                                      ) : (
                                        <Camera className="w-8 h-8 text-white/60" />
                                      )
                                    )}
                                  </div>
                                </motion.div>
                              </div>
                            </motion.div>

                            {/* Gender Selection and Pre-made Avatars */}
                            <div className="flex flex-col gap-6">
                              {/* Gender Selection */}
                              <div>
                                <motion.div
                                  className="px-2"
                                  initial={{ opacity: 0, y: 30 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.4, duration: 0.4 }}
                                >
                                  {/* Enhanced Compact Separator */}
                                  <div className="flex items-center justify-center mb-4">
                                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-emerald-500/50"></div>
                                    <motion.div
                                      className="mx-3 px-3 py-1.5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 rounded-full border border-emerald-400/20 backdrop-blur-sm"
                                      whileHover={{ scale: 1.05 }}
                                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                    >
                                      <div className="flex items-center space-x-1.5">
                                        <User className="w-3.5 h-3.5 text-emerald-400" />
                                        <span className="text-xs font-bold bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                                          Select your Gender
                                        </span>
                                      </div>
                                    </motion.div>
                                    <div className="flex-1 h-px bg-gradient-to-l from-transparent via-cyan-400/30 to-cyan-500/50"></div>
                                  </div>

                                  {/* Enhanced Gender Buttons */}
                                  <div className="flex justify-center space-x-4">
                                    <motion.button
                                      type="button"
                                      onClick={() => handleGenderSelect('male')}
                                      className={`group relative px-6 py-4 rounded-xl border-2 transition-all duration-500 transform hover:scale-110 hover:-translate-y-1 ${
                                        formData.gender === 'male'
                                          ? 'border-blue-400 bg-gradient-to-br from-blue-500/30 to-blue-600/20 text-blue-100 shadow-2xl shadow-blue-500/40 ring-4 ring-blue-400/30'
                                          : 'border-white/30 text-white/80 hover:border-blue-400/70 hover:text-white hover:shadow-xl hover:shadow-blue-500/30 bg-gradient-to-br from-white/10 to-white/5'
                                      } backdrop-blur-sm`}
                                      whileHover={{ scale: 1.1, y: -4 }}
                                      whileTap={{ scale: 0.95 }}
                                      initial={{ opacity: 0, x: -30 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 0.5, duration: 0.4 }}
                                    >
                                      {/* Enhanced background effects */}
                                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-blue-500/10 rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>

                                      <div className="relative flex flex-row items-center space-x-2">
                                        {/* Icon with enhanced styling */}
                                        <motion.div
                                          className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400/40 to-blue-500/40 flex items-center justify-center shadow-lg group-hover:shadow-blue-500/50 transition-all duration-300"
                                          whileHover={{ rotate: [0, -10, 10, 0] }}
                                          transition={{ duration: 0.5 }}
                                        >
                                          <span className="text-blue-200 font-bold text-sm group-hover:scale-110 transition-transform">♂</span>
                                        </motion.div>

                                        {/* Text */}
                                        <div className="text-center">
                                          <span className="font-bold text-xs">Male</span>
                                        </div>
                                      </div>
                                    </motion.button>

                                    <motion.button
                                      type="button"
                                      onClick={() => handleGenderSelect('female')}
                                      className={`group relative px-6 py-4 rounded-xl border-2 transition-all duration-500 transform hover:scale-110 hover:-translate-y-1 ${
                                        formData.gender === 'female'
                                          ? 'border-pink-400 bg-gradient-to-br from-pink-500/30 to-pink-600/20 text-pink-100 shadow-2xl shadow-pink-500/40 ring-4 ring-pink-400/30'
                                          : 'border-white/30 text-white/80 hover:border-pink-400/70 hover:text-white hover:shadow-xl hover:shadow-pink-500/30 bg-gradient-to-br from-white/10 to-white/5'
                                      } backdrop-blur-sm`}
                                      whileHover={{ scale: 1.1, y: -4 }}
                                      whileTap={{ scale: 0.95 }}
                                      initial={{ opacity: 0, x: 30 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 0.6, duration: 0.4 }}
                                    >
                                      {/* Enhanced background effects */}
                                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-pink-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                      <div className="absolute inset-0 bg-gradient-to-r from-pink-400/10 to-pink-500/10 rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>

                                      <div className="relative flex flex-row items-center space-x-2">
                                        {/* Icon with enhanced styling */}
                                        <motion.div
                                          className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-400/40 to-pink-500/40 flex items-center justify-center shadow-lg group-hover:shadow-pink-500/50 transition-all duration-300"
                                          whileHover={{ rotate: [0, 10, -10, 0] }}
                                          transition={{ duration: 0.5 }}
                                        >
                                          <span className="text-pink-200 font-bold text-sm group-hover:scale-110 transition-transform">♀</span>
                                        </motion.div>

                                        {/* Text */}
                                        <div className="text-center">
                                          <span className="font-bold text-xs">Female</span>
                                        </div>
                                      </div>
                                    </motion.button>
                                  </div>

                                  {/* Enhanced hint text */}
                                  {!formData.gender && (
                                    <motion.div
                                      className="flex items-center justify-center space-x-2 mt-4 text-white/60 text-xs"
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ delay: 0.7, duration: 0.4 }}
                                    >
                                      <motion.div
                                        className="w-1.5 h-1.5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
                                        animate={{ scale: [1, 1.5, 1] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                      />
                                      <span className="font-medium">Select your preferred style to continue</span>
                                    </motion.div>
                                  )}
                                </motion.div>
                              </div>

                              {/* Pre-made Avatars */}
                              {formData.gender && (
                                <div>
                                  <motion.div
                                    className="px-2"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8, duration: 0.4 }}
                                  >
                                    {/* Enhanced Compact Separator */}
                                    <div className="flex items-center justify-center mb-4">
                                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-indigo-500/50"></div>
                                      <motion.div
                                        className="mx-3 px-3 py-1.5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-full border border-indigo-400/20 backdrop-blur-sm"
                                        whileHover={{ scale: 1.05 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                      >
                                        <div className="flex items-center space-x-1.5">
                                          <Palette className="w-3.5 h-3.5 text-indigo-400" />
                                          <span className="text-xs font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                                            Select Avatar
                                          </span>
                                        </div>
                                      </motion.div>
                                      <div className="flex-1 h-px bg-gradient-to-l from-transparent via-pink-400/30 to-pink-500/50"></div>
                                    </div>

                                    {/* Enhanced Avatar Grid */}
                                    <div className="flex justify-center">
                                      <div className="grid grid-cols-4 gap-4 max-w-md">
                                        {getAvatarOptions(formData.gender as 'male' | 'female').map((avatar, index) => (
                                          <motion.div
                                            key={avatar.id}
                                            onClick={() => handleAvatarSelect(avatar.id)}
                                            className="relative w-16 h-16 rounded-full border-3 cursor-pointer transition-all duration-500 flex items-center justify-center backdrop-blur-sm overflow-hidden group shadow-xl transform hover:-translate-y-2 border-white/40 hover:border-indigo-400/80 bg-gradient-to-br from-white/10 to-white/5"
                                            whileHover={{
                                              scale: 1.15,
                                              y: -8,
                                              rotateY: 5,
                                              rotateX: 5
                                            }}
                                            whileTap={{ scale: 0.95 }}
                                            initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
                                            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                                            transition={{
                                              delay: 0.9 + index * 0.1,
                                              duration: 0.5,
                                              type: 'spring',
                                              stiffness: 300
                                            }}
                                          >
                                            {/* Enhanced image layer */}
                                            <Image
                                              src={avatar.imageUrl}
                                              alt={`Avatar option ${avatar.label}`}
                                              width={64} height={64}
                                              className="w-full h-full object-cover absolute inset-0 z-10 rounded-full"
                                              onError={(e) => {
                                                // Hide image on error, showing gradient fallback
                                                e.currentTarget.style.display = 'none';
                                              }}
                                            />

                                            {/* Enhanced gradient fallback */}
                                            <div className={`w-full h-full rounded-full bg-gradient-to-br ${avatar.gradient} flex items-center justify-center absolute inset-0 z-0 shadow-inner`}>
                                              <span className="text-white font-bold text-sm drop-shadow-lg">
                                                {avatar.label}
                                              </span>
                                            </div>

                                            {/* Enhanced selected indicator */}
                                            {formData.avatar === avatar.imageUrl && (
                                              <motion.div
                                                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-xl border-3 border-white/50 flex items-center justify-center"
                                                initial={{ scale: 0 }}
                                                animate={{
                                                  scale: [1, 1.3, 1],
                                                  rotate: [0, 180, 360]
                                                }}
                                                transition={{
                                                  duration: 0.6,
                                                  ease: 'easeOut'
                                                }}
                                              >
                                                <motion.div
                                                  className="w-1.5 h-1.5 bg-white rounded-full"
                                                  animate={{ scale: [1, 1.5, 1] }}
                                                  transition={{ duration: 1, repeat: Infinity }}
                                                />
                                              </motion.div>
                                            )}

                                            {/* Enhanced hover overlay with multiple effects */}
                                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20"></div>
                                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-400/10 to-purple-400/10 opacity-0 group-hover:opacity-50 transition-all duration-300 z-30 blur-sm"></div>
                                          </motion.div>
                                        ))}
                                        <motion.div
                                          className="relative w-16 h-16 rounded-full border-3 cursor-pointer transition-all duration-500 flex items-center justify-center backdrop-blur-sm overflow-hidden group shadow-xl border-white/40 bg-gradient-to-br from-white/10 to-white/5"
                                          initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
                                          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                                          transition={{
                                            delay: 0.9 + (getAvatarOptions(formData.gender as 'male' | 'female').length) * 0.1,
                                            duration: 0.5,
                                            type: 'spring',
                                            stiffness: 300
                                          }}
                                        >
                                          <label htmlFor="avatar-upload" className="w-full h-full rounded-full flex items-center justify-center cursor-pointer">
                                            <input
                                              id="avatar-upload"
                                              type="file"
                                              accept="image/*"
                                              onChange={handleFileUpload}
                                              className="hidden"
                                              title="Upload custom avatar image"
                                            />
                                            <Camera className="w-8 h-8 text-white z-10" />
                                          </label>

                                          {/* Enhanced hover overlay with multiple effects */}
                                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 pointer-events-none"></div>
                                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-400/10 to-purple-400/10 opacity-0 group-hover:opacity-50 transition-all duration-300 z-30 blur-sm pointer-events-none"></div>
                                        </motion.div>                                      </div>
                                    </div>
                                  </motion.div>
                                </div>
                              )}
                            </div>
                          </motion.div>

                          {/* Enhanced Compact Footer */}
                          <motion.div
                            className="relative flex-shrink-0 p-6 lg:p-8 pt-4 bg-gradient-to-r from-white/5 to-white/10 border-t border-white/20"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.3 }}
                          >
                            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                              <motion.button
                                onClick={() => setShowAvatarPopup(false)}
                                className="w-full sm:w-auto px-6 py-3 border border-white/30 rounded-xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-sm lg:text-base font-medium"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                              >
                                Cancel
                              </motion.button>
                              <motion.button
                                onClick={() => setShowAvatarPopup(false)}
                                className="w-full sm:w-auto px-6 py-3 rounded-xl text-white font-semibold text-sm lg:text-base transition-all duration-300 shadow-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                              >
                                Done
                              </motion.button>
                            </div>
                          </motion.div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                </form>
              </div>

              {/* Fixed Footer */}
              <div className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-gradient-to-t from-white/5 to-transparent border-t border-white/10">
                {/* Register Button */}
                <div className="mb-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    onClick={(e) => { e.preventDefault(); handleSubmit(); }}
                    className="group relative w-full flex justify-center items-center py-4 px-6 text-lg font-semibold rounded-2xl text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-teal-400/50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-teal-500/25 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
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
                <div className="text-center text-xs text-white/60 mb-2">
                  By creating an account, you agree to our{' '}
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

                {/* Login Link */}
                <div className="text-center">
                  <p className="text-white/70">
                    Already have an account?{' '}
                    <Link
                      href="/login"
                      className="text-emerald-300 hover:text-emerald-200 hover:underline transition-colors font-medium group inline-flex items-center"
                    >
                      <span>Sign In</span>
                      <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </p>
                </div>
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

export default dynamic(() => Promise.resolve(RegisterPage), { ssr: false })
