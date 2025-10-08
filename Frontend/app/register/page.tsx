'use client'
/* eslint-disable react/style-prop-object, @typescript-eslint/no-explicit-any */
import dynamic from 'next/dynamic'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getAvatarOptions } from '@/utils/avatarUtils'
import Image from 'next/image'

import { Eye, EyeOff, Mail, Lock, User, Calendar, Camera, Edit3, ArrowRight, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'

function validatePassword(password: string) {

  const upper = /[A-Z]/
  const lower = /[a-z]/
  const number = /[0-9]/
  const space = /\s/

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

  // combine errors into a single message
  if (errors.length > 0) {
    const lastError = errors.pop() // for adding 'and' before the last error
    return "Password must " + (errors.length ? errors.join(", ") + ", and " + lastError : lastError)
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
    avatar: '/avatars/defaultM.png',
    gender: 'male'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>('/avatars/defaultM.png')
  const [error, setError] = useState<string | null>(null)
  const [showOptionalFields, setShowOptionalFields] = useState(false)
  const [showAvatarPopup, setShowAvatarPopup] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleGenderSelect = (gender: 'male' | 'female') => {
    const defaultAvatar = gender === 'male' ? '/avatars/defaultM.png' : '/avatars/defaultFM.png'
    setFormData({
      ...formData,
      gender: gender,
      avatar: defaultAvatar
    })
    setAvatarPreview(defaultAvatar)
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

      const returnValue = validatePassword(formData.password)
      if (returnValue) {
        throw new Error(returnValue)
      }

      if (formData.nickname && formData.nickname.length > 16) {
        throw new Error('Nickname is too long')
      }

      if (formData.aboutMe.length > 128) {
        throw new Error('Your bio is too long')
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
                Create your account and start connecting with amazing people.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-white/70 text-sm">Personalized avatars</span>
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

        {/* Right Side - Register Form */}
        <div className="flex-1 flex items-center justify-center px-8 lg:px-16 xl:px-24">
          {/* Enhanced Professional Form Container */}
          <div className="w-full max-w-7xl">
            <div className="relative group h-[90vh] rounded-3xl">
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

              {/* Scrollable Content */}
              <div className="relative h-[calc(100%-9.5rem)] overflow-y-auto px-6 pb-1 custom-scrollbar">
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4 mb-6">
                      <p className="text-red-300 text-sm text-center">{error}</p>
                    </div>
                  )}

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
                            placeholder="Enter first name"
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
                            placeholder="Enter last name"
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
                          <Lock className="h-4 w-4 text-emerald-400/70 group-focus-within:text-emerald-400 transition-colors" />
                        </div>
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          required
                          className="w-full pl-11 pr-12 py-3.5 bg-white/10 border border-white/20 rounded-xl placeholder-white/40 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 focus:bg-white/15 transition-all duration-300 backdrop-blur-sm hover:border-white/30"
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
                              <Camera className="w-12 h-12 text-white/50" />
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
                          <Edit3 className="h-4 w-4 text-emerald-400/70 group-focus-within:text-emerald-400 transition-colors" />
                        </div>
                        <input
                          id="nickname"
                          name="nickname"
                          type="text"
                          className="w-full pl-11 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl placeholder-white/40 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 focus:bg-white/15 transition-all duration-300 backdrop-blur-sm hover:border-white/30"
                          placeholder="Choose a nickname"
                          value={formData.nickname}
                          onChange={handleInputChange}
                        />
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
                  {showAvatarPopup && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                      <div className="bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-2xl rounded-3xl border border-white/30 shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300">
                        {/* Enhanced Header */}
                        <div className="relative p-8 pb-6 border-b border-white/20">
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 rounded-t-3xl"></div>
                          <div className="relative flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 flex items-center justify-center shadow-lg">
                                <Sparkles className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h3 className="text-2xl font-bold text-white">Customize Your Avatar</h3>
                                <p className="text-white/70 text-sm">Choose or upload your perfect avatar</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setShowAvatarPopup(false)}
                              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
                            >
                              <span className="text-white text-xl font-light">×</span>
                            </button>
                          </div>
                        </div>

                        {/* Enhanced Content */}
                        <div className="p-8 max-h-[70vh] overflow-y-auto space-y-8">
                          {/* Gender Selection */}
                          <div>
                            <div className="flex items-center justify-center space-x-3 mb-6">
                              <div className="h-px w-12 bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"></div>
                              <div className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-6 py-3 rounded-full border border-emerald-400/30">
                                <User className="w-5 h-5 text-emerald-400" />
                                <h4 className="text-xl font-semibold text-white">Choose Gender</h4>
                              </div>
                              <div className="h-px w-12 bg-gradient-to-l from-transparent via-teal-400/50 to-transparent"></div>
                            </div>
                            <div className="flex space-x-8 justify-center">
                              <button
                                type="button"
                                onClick={() => handleGenderSelect('male')}
                                className={`group relative px-10 py-5 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 ${formData.gender === 'male'
                                    ? 'border-blue-400 bg-gradient-to-br from-blue-500/25 to-blue-600/15 text-blue-200 shadow-xl shadow-blue-500/30 ring-2 ring-blue-400/20'
                                    : 'border-white/30 text-white/70 hover:border-blue-400/70 hover:text-white hover:shadow-lg hover:shadow-blue-500/20 bg-gradient-to-br from-white/5 to-white/10'
                                  }`}
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/15 to-blue-600/15 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative flex flex-col items-center space-y-2">
                                  <div className="w-8 h-8 rounded-full bg-blue-400/25 flex items-center justify-center">
                                    <span className="text-blue-300 font-bold text-lg">♂</span>
                                  </div>
                                  <span className="font-semibold">Male</span>
                                </div>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleGenderSelect('female')}
                                className={`group relative px-10 py-5 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 ${formData.gender === 'female'
                                    ? 'border-pink-400 bg-gradient-to-br from-pink-500/25 to-pink-600/15 text-pink-200 shadow-xl shadow-pink-500/30 ring-2 ring-pink-400/20'
                                    : 'border-white/30 text-white/70 hover:border-pink-400/70 hover:text-white hover:shadow-lg hover:shadow-pink-500/20 bg-gradient-to-br from-white/5 to-white/10'
                                  }`}
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/15 to-pink-600/15 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative flex flex-col items-center space-y-2">
                                  <div className="w-8 h-8 rounded-full bg-pink-400/25 flex items-center justify-center">
                                    <span className="text-pink-300 font-bold text-lg">♀</span>
                                  </div>
                                  <span className="font-semibold">Female</span>
                                </div>
                              </button>
                            </div>
                          </div>

                          {/* Avatar Selection */}
                          {formData.gender && (
                            <div className="space-y-10">
                              {/* Current Avatar Preview */}
                              <div className="text-center space-y-6">
                                <div className="flex justify-center">
                                  <div className="relative group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-full blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
                                    <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-white/15 via-white/10 to-white/5 border-4 border-emerald-400/60 shadow-2xl shadow-emerald-400/25 flex items-center justify-center overflow-hidden backdrop-blur-sm ring-4 ring-white/10">
                                      {avatarPreview ? (
                                        avatarPreview.startsWith('/') || avatarPreview.startsWith('data:') ? (
                                          <Image src={avatarPreview} alt="Selected Avatar" width={128} height={128} className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                          // Show gradient for selected avatar ID
                                          (() => {
                                            const selectedAvatar = getAvatarOptions(formData.gender as 'male' | 'female').find(avatar => avatar.id === avatarPreview);
                                            return selectedAvatar ? (
                                              <div className={`w-full h-full rounded-full bg-gradient-to-r ${selectedAvatar.gradient} flex items-center justify-center`}>
                                                <span className="text-white font-bold text-3xl drop-shadow-lg">
                                                  {selectedAvatar.label}
                                                </span>
                                              </div>
                                            ) : (
                                              <Camera className="w-12 h-12 text-white/50" />
                                            );
                                          })()
                                        )
                                      ) : (
                                        <Camera className="w-12 h-12 text-white/50" />
                                      )}
                                    </div>
                                    <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white/20 animate-pulse">
                                      <div className="w-3 h-3 bg-white rounded-full"></div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex justify-center">
                                  <div className="inline-flex items-center space-x-3">
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                                    <h4 className="text-xl font-semibold text-white">Your Avatar</h4>
                                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse delay-300"></div>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-white/60 text-sm">This is how others will see you</p>
                                  {formData.avatar.startsWith('data:') && (
                                    <p className="text-emerald-400 text-xs mt-1 font-medium">✓ Custom image uploaded</p>
                                  )}
                                </div>
                              </div>

                              {/* Pre-made Avatars */}
                              <div className="space-y-8">
                                <div className="flex items-center justify-center space-x-4">
                                  <div className="h-px w-16 bg-gradient-to-r from-transparent via-teal-400/50 to-transparent"></div>
                                  <div className="flex items-center space-x-3 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 px-6 py-3 rounded-full border border-teal-400/30">
                                    <Sparkles className="w-5 h-5 text-teal-400" />
                                    <h5 className="text-xl font-semibold text-white">Avatar Gallery</h5>
                                  </div>
                                  <div className="h-px w-16 bg-gradient-to-l from-transparent via-cyan-400/50 to-transparent"></div>
                                </div>
                                <div className="flex justify-center">
                                  <div className="grid grid-cols-3 gap-6 max-w-md">
                                    {getAvatarOptions(formData.gender as 'male' | 'female').map((avatar) => (
                                      <div
                                        key={avatar.id}
                                        onClick={() => handleAvatarSelect(avatar.id)}
                                        className={`relative w-20 h-20 rounded-full border-3 cursor-pointer hover:scale-110 transition-all duration-300 flex items-center justify-center backdrop-blur-sm overflow-hidden group shadow-xl transform hover:-translate-y-1 ${formData.avatar === avatar.imageUrl
                                            ? 'border-emerald-400 shadow-emerald-400/50 ring-4 ring-emerald-400/25 bg-emerald-400/15 scale-105'
                                            : 'border-white/30 hover:border-emerald-400/70 hover:shadow-emerald-400/30 bg-gradient-to-br from-white/8 to-white/5'
                                          }`}
                                      >
                                        {/* Image layer */}
                                        <Image
                                          src={avatar.imageUrl}
                                          alt={`Avatar option ${avatar.label}`}
                                          width={80}
                                          height={80}
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
                                        {formData.avatar === avatar.imageUrl && (
                                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white/30 animate-pulse">
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                          </div>
                                        )}

                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 rounded-full bg-emerald-400/0 group-hover:bg-emerald-400/20 transition-all duration-200 z-20"></div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="text-center">
                                  <p className="text-white/60 text-sm">Click to select a pre-made avatar</p>
                                </div>
                              </div>

                              {/* Upload Custom Avatar */}
                              <div className="relative">
                                <div className="flex items-center justify-center space-x-4 mb-6">
                                  <div className="h-px w-16 bg-gradient-to-r from-transparent via-purple-400/50 to-transparent"></div>
                                  <div className="flex items-center space-x-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-6 py-3 rounded-full border border-purple-400/30">
                                    <Camera className="w-5 h-5 text-purple-400" />
                                    <h5 className="text-xl font-semibold text-white">Custom Avatar</h5>
                                  </div>
                                  <div className="h-px w-16 bg-gradient-to-l from-transparent via-pink-400/50 to-transparent"></div>
                                </div>

                                <div className="bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-indigo-500/10 rounded-3xl p-8 border border-purple-400/30 shadow-xl shadow-purple-500/20">
                                  <div className="text-center space-y-6">
                                    <label className="inline-block cursor-pointer group">
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                      />
                                      <div className="relative p-8 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:via-pink-500/30 hover:to-indigo-500/30 border-3 border-dashed border-purple-400/50 hover:border-purple-400/70 rounded-2xl transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-purple-500/30">
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="relative flex flex-col items-center space-y-4">
                                          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-400/30 to-pink-400/30 group-hover:from-purple-400/50 group-hover:to-pink-400/50 flex items-center justify-center transition-all duration-200 shadow-lg">
                                            <Camera className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                                          </div>
                                          <div className="text-center">
                                            <span className="text-white group-hover:text-white font-semibold text-lg block">Upload Your Photo</span>
                                            <p className="text-white/60 group-hover:text-white/80 text-sm mt-2">Choose a photo that represents you</p>
                                            <p className="text-white/40 group-hover:text-white/60 text-xs mt-2">PNG, JPG up to 5MB • Will replace any selected avatar</p>
                                          </div>
                                        </div>
                                      </div>
                                    </label>

                                    <div className="flex items-center justify-center space-x-6 text-sm text-white/50">
                                      <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                        <span>High Quality</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-150"></div>
                                        <span>Secure</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-300"></div>
                                        <span>Personalized</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Enhanced Footer */}
                        <div className="p-8 pt-6 border-t border-white/20 bg-gradient-to-t from-white/10 to-transparent">
                          <button
                            onClick={() => setShowAvatarPopup(false)}
                            className="group relative w-full flex justify-center items-center py-4 px-8 text-lg font-semibold rounded-2xl text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-teal-400/50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-teal-500/25"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                            <span className="relative flex items-center">
                              <Sparkles className="w-5 h-5 mr-2" />
                              Done
                              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

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
                  <button className="text-emerald-300 hover:text-emerald-200 hover:underline transition-colors">
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button className="text-emerald-300 hover:text-emerald-200 hover:underline transition-colors">
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
          <button className="hover:text-white/60 transition-colors">Terms</button>
          <button className="hover:text-white/60 transition-colors">Privacy</button>
          <button className="hover:text-white/60 transition-colors">© 2025 Gigabit</button>
        </div>
      </div>
    </div>
  )
}

export default dynamic(() => Promise.resolve(RegisterPage), { ssr: false })
