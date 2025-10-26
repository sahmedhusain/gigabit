'use client';

'use client';

import { useState, useEffect, useRef } from 'react';
import { User as UserIcon, Edit3, Save, X, Check, Camera, Mail, User, Calendar, Sparkles, Shield, Heart } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { api, API_BASE_URL } from '@/lib/api';

// Validation functions from registration form
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

  // Uniqueness checking functions
  const checkEmailUniqueness = async (email: string): Promise<{ available: boolean; message?: string }> => {
    try {
      return await api.checkEmailUniqueness(email);
    } catch (error) {
      console.error('Error checking email uniqueness:', error);
      return { available: false, message: 'This email is already used' };
    }
  };

  const checkNicknameUniqueness = async (nickname: string): Promise<{ available: boolean; message?: string }> => {
    try {
      return await api.checkNicknameUniqueness(nickname);
    } catch (error) {
      console.error('Error checking nickname uniqueness:', error);
      return { available: false, message: 'This nickname is already used' };
    }
  };

export default function ProfileSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [checkingUniqueness, setCheckingUniqueness] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    nickname: '',
    date_of_birth: '',
    about_me: '',
    avatar: '',
    gender: '',
  });

  const [originalData, setOriginalData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    nickname: '',
    date_of_birth: '',
    about_me: '',
    avatar: '',
    gender: '',
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const userData = await api.getMe();
      console.log('Fetched user data:', userData);
      const initialData = {
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        nickname: userData.nickname || '',
        date_of_birth: userData.date_of_birth || '',
        about_me: userData.about_me || '',
        avatar: userData.avatar || '',
        gender: userData.gender || '',
      };
      console.log('Setting form data:', initialData);
      setFormData(initialData);
      setOriginalData(initialData);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setMessage('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setMessage('');
    setFieldErrors({});
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditing(false);
    setMessage('');
    setFieldErrors({});
  };

  const handleSaveClick = async () => {
    // Validate all fields before showing confirmation modal
    const errors = await validateAllFields();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setMessage('Please fix the errors below before saving');
      return;
    }
    setShowConfirmModal(true);
  };

  const hasChanges = () => {
    return (
      formData.first_name !== originalData.first_name ||
      formData.last_name !== originalData.last_name ||
      formData.email !== originalData.email ||
      formData.nickname !== originalData.nickname ||
      formData.date_of_birth !== originalData.date_of_birth ||
      formData.about_me !== originalData.about_me ||
      formData.avatar !== originalData.avatar ||
      formData.gender !== originalData.gender
    );
  };

  const handleConfirmSave = () => {
    setShowConfirmModal(false);
    handleSubmit();
  };

  const validateAllFields = async () => {
    const errors: Record<string, string> = {};

    // Required fields validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else {
      // Email format validation
      const emailRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~]+(\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      } else if (formData.email !== originalData.email) {
        // Check email uniqueness only if it has changed
        setCheckingUniqueness(prev => ({ ...prev, email: true }));
        const emailCheck = await checkEmailUniqueness(formData.email);
        setCheckingUniqueness(prev => ({ ...prev, email: false }));
        if (!emailCheck.available) {
          errors.email = emailCheck.message || 'This email is already in use';
        }
      }
    }

    if (!formData.first_name) {
      errors.first_name = 'First name is required';
    } else if (formData.first_name.length < 3) {
      errors.first_name = 'First name must be at least 3 characters long';
    } else if (formData.first_name.length > 16) {
      errors.first_name = 'First name is too long';
    }

    if (!formData.last_name) {
      errors.last_name = 'Last name is required';
    } else if (formData.last_name.length < 3) {
      errors.last_name = 'Last name must be at least 3 characters long';
    } else if (formData.last_name.length > 16) {
      errors.last_name = 'Last name is too long';
    }

    if (!formData.date_of_birth) {
      errors.date_of_birth = 'Date of birth is required';
    } else {
      // Validate date of birth
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      // Adjust age if birthday hasn't occurred this year
      const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
        ? age - 1 
        : age;
      
      if (adjustedAge < 13) {
        errors.date_of_birth = 'You must be at least 13 years old';
      } else if (adjustedAge > 150) {
        errors.date_of_birth = 'Date of birth is too far in the past';
      } else if (birthDate > today) {
        errors.date_of_birth = 'Date of birth must be less than today';
      }
    }

    // Nickname validation (optional but if provided, must be valid)
    if (formData.nickname) {
      if (formData.nickname.length > 16) {
        errors.nickname = 'Nickname is too long';
      } else {
        const nicknameValidation = validateNickname(formData.nickname);
        if (nicknameValidation) {
          errors.nickname = nicknameValidation;
        } else if (formData.nickname !== originalData.nickname) {
          // Check nickname uniqueness only if it has changed
          setCheckingUniqueness(prev => ({ ...prev, nickname: true }));
          const nicknameCheck = await checkNicknameUniqueness(formData.nickname);
          setCheckingUniqueness(prev => ({ ...prev, nickname: false }));
          if (!nicknameCheck.available) {
            errors.nickname = nicknameCheck.message || 'This nickname is already in use';
          }
        }
      }
    }

    // About me validation
    if (formData.about_me.length > 128) {
      errors.about_me = 'Your bio is too long';
    }

    return errors;
  };

  const handleSubmit = async () => {
    setSaving(true);
    setMessage('');

    try {
      // Prepare data for API - only send changed fields
      const updateData: { first_name?: string; last_name?: string; email?: string; nickname?: string; date_of_birth?: string; bio?: string; avatar_url?: string; gender?: string } = {};
      if (formData.first_name !== originalData.first_name) updateData.first_name = formData.first_name;
      if (formData.last_name !== originalData.last_name) updateData.last_name = formData.last_name;
      if (formData.email !== originalData.email) updateData.email = formData.email;
      if (formData.nickname !== originalData.nickname) updateData.nickname = formData.nickname;
      if (formData.date_of_birth !== originalData.date_of_birth) updateData.date_of_birth = formData.date_of_birth;
      if (formData.about_me !== originalData.about_me) updateData.bio = formData.about_me;
      if (formData.avatar !== originalData.avatar) updateData.avatar_url = formData.avatar;
      if (formData.gender !== originalData.gender) updateData.gender = formData.gender;

      console.log('Sending update data:', updateData);

      const updatedUser = await api.updateProfile(updateData);
      console.log('Updated user:', updatedUser);
      const newData = {
        first_name: updatedUser.first_name || '',
        last_name: updatedUser.last_name || '',
        email: updatedUser.email || '',
        nickname: updatedUser.nickname || '',
        date_of_birth: updatedUser.date_of_birth || '',
        about_me: updatedUser.about_me || '',
        avatar: updatedUser.avatar || '',
        gender: updatedUser.gender || '',
      };
      setFormData(newData);
      setOriginalData(newData);
      setIsEditing(false);
      setMessage('Profile updated successfully!');
      setFieldErrors({});
    } catch (error) {
      console.error('Failed to update profile:', error);
      setMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage('Please select a valid image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image size must be less than 5MB');
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append('avatar', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/upload/avatar`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formDataUpload,
      });

      if (response.ok) {
        const result = await response.json();
        setFormData(prev => ({ ...prev, avatar: result.avatar_url }));
        setMessage('Avatar uploaded successfully!');
      } else {
        const error = await response.json();
        setMessage(error.message || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      setMessage('Failed to upload avatar');
    }
  };

  const handleRemoveAvatar = () => {
    setFormData(prev => ({ ...prev, avatar: '' }));
    setMessage('Avatar removed successfully. Changes will be saved when you confirm.');
  };

  const getInitials = () => {
    const first = formData.first_name?.charAt(0)?.toUpperCase() || '';
    const last = formData.last_name?.charAt(0)?.toUpperCase() || '';
    return first + last || 'U';
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    try {
      // Ensure the date is in YYYY-MM-DD format for HTML date input
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const handleGenderChange = (gender: string) => {
    setFormData(prev => ({ ...prev, gender }));
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFieldFocus = (field: string) => {
    // Clear field error when user focuses on the field
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleFieldBlur = async (field: string) => {
    const value = formData[field as keyof typeof formData] as string;

    // Validate nickname on blur
    if (field === 'nickname') {
      const validation = validateNickname(value);
      if (validation) {
        setFieldErrors(prev => ({
          ...prev,
          nickname: validation
        }));
      } else if (value && value !== originalData.nickname) {
        // Check uniqueness for changed nickname
        setCheckingUniqueness(prev => ({ ...prev, nickname: true }));
        try {
          const uniquenessCheck = await checkNicknameUniqueness(value);
          setCheckingUniqueness(prev => ({ ...prev, nickname: false }));
          setFieldErrors(prev => ({
            ...prev,
            nickname: uniquenessCheck.available ? '' : (uniquenessCheck.message || 'This nickname is already in use')
          }));
        } catch (error) {
          console.error('Error checking nickname uniqueness:', error);
          setCheckingUniqueness(prev => ({ ...prev, nickname: false }));
          setFieldErrors(prev => ({
            ...prev,
            nickname: 'Unable to verify nickname availability'
          }));
        }
      } else {
        setFieldErrors(prev => ({
          ...prev,
          nickname: ''
        }));
      }
    }

    // Validate email on blur
    if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        setFieldErrors(prev => ({
          ...prev,
          email: 'Please enter a valid email address'
        }));
      } else if (value !== originalData.email) {
        // Check uniqueness for changed email
        setCheckingUniqueness(prev => ({ ...prev, email: true }));
        try {
          const uniquenessCheck = await checkEmailUniqueness(value);
          setCheckingUniqueness(prev => ({ ...prev, email: false }));
          setFieldErrors(prev => ({
            ...prev,
            email: uniquenessCheck.available ? '' : (uniquenessCheck.message || 'This email is already in use')
          }));
        } catch (error) {
          console.error('Error checking email uniqueness:', error);
          setCheckingUniqueness(prev => ({ ...prev, email: false }));
          setFieldErrors(prev => ({
            ...prev,
            email: 'Unable to verify email availability'
          }));
        }
      } else {
        setFieldErrors(prev => ({
          ...prev,
          email: ''
        }));
      }
    }

    // Validate date of birth on blur
    if (field === 'date_of_birth' && value) {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      // Adjust age if birthday hasn't occurred this year
      const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
        ? age - 1 
        : age;
      
      let dateError = '';
      if (adjustedAge < 13) {
        dateError = 'You must be at least 13 years old';
      } else if (adjustedAge > 150) {
        dateError = 'Date of birth is too far in the past';
      } else if (birthDate > today) {
        dateError = 'Date of birth must be less than today';
      }
      
      setFieldErrors(prev => ({
        ...prev,
        date_of_birth: dateError
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="p-3 bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-teal-500/20 backdrop-blur-xl rounded-2xl border border-emerald-400/30 shadow-xl"
          >
            <UserIcon className="w-6 h-6 text-emerald-400" />
          </motion.div>
          <div>
            <motion.h2
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent"
            >
              Profile Settings
            </motion.h2>
            <motion.p
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-emerald-200/70"
            >
              Customize your personal information and appearance
            </motion.p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!isEditing ? (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={handleEdit}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:via-green-500/30 hover:to-teal-500/30 text-white rounded-2xl transition-all duration-500 backdrop-blur-xl border-2 border-emerald-400/20 shadow-xl hover:shadow-emerald-500/10 hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              <span>Edit Profile</span>
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex space-x-3"
            >
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCancel}
                className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-slate-600/50 to-slate-700/50 hover:from-slate-500/50 hover:to-slate-600/50 text-white rounded-2xl transition-all duration-500 backdrop-blur-xl border-2 border-slate-400/30 hover:border-slate-300/40 shadow-lg hover:shadow-slate-500/20 font-semibold"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveClick}
                disabled={saving || !hasChanges()}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-400 hover:via-green-400 hover:to-teal-400 text-white font-bold rounded-2xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-emerald-500/30 focus:outline-none focus:ring-4 focus:ring-emerald-400/30 focus:ring-offset-2 focus:ring-offset-transparent"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`p-4 rounded-2xl backdrop-blur-xl border transition-all duration-300 ${
              message.includes('success')
                ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-100'
                : 'bg-red-500/20 border-red-400/30 text-red-100'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${
                message.includes('success')
                  ? 'bg-emerald-500/20'
                  : 'bg-red-500/20'
              }`}>
                {message.includes('success') ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <X className="w-4 h-4 text-red-400" />
                )}
              </div>
              <span className="font-medium">{message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {/* Profile Picture and Personal Information Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Picture Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-teal-500/20 rounded-3xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
            <div className="relative p-8 bg-gradient-to-br from-slate-800/40 via-slate-900/40 to-slate-800/40 backdrop-blur-2xl border-2 border-emerald-400/20 rounded-3xl shadow-2xl overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-500/10 to-transparent rounded-full translate-y-6 -translate-x-6"></div>

              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-xl">
                    <Camera className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Avatar</h3>
                </div>

                <div className="flex-1 flex flex-col justify-center items-center">
                  <div className="relative group">
                    <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                      {formData.avatar ? (
                        <Image
                          src={formData.avatar}
                          alt="Profile avatar"
                          width={112}
                          height={112}
                          unoptimized={true}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold text-xl">
                          {getInitials()}
                        </span>
                      )}
                    </div>
                    {isEditing && (
                      <div className="absolute -bottom-2 -right-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-xl transition-all duration-300 shadow-lg hover:scale-110"
                          aria-label="Upload new profile picture"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="text-center mt-4">
                    <p className="text-white/70 text-sm mb-3">
                      {isEditing
                        ? "Click the camera to upload a new picture"
                        : "Your current profile picture"
                      }
                    </p>
                    {isEditing && (
                      <>
                        <label htmlFor="avatar-upload" className="sr-only">
                          Upload profile picture
                        </label>
                        <input
                          ref={fileInputRef}
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                        {formData.avatar && (
                          <div className="flex justify-center">
                            <button
                              onClick={handleRemoveAvatar}
                              disabled={!formData.avatar}
                              className="flex items-center space-x-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 disabled:bg-gray-500/20 disabled:cursor-not-allowed text-red-300 hover:text-red-200 rounded-xl transition-all duration-300 backdrop-blur-sm border border-red-400/20 disabled:border-gray-400/20"
                            >
                              <X className="w-3 h-3" />
                              <span className="text-xs">Remove</span>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-teal-500/20 rounded-3xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
            <div className="relative p-8 bg-gradient-to-br from-slate-800/40 via-slate-900/40 to-slate-800/40 backdrop-blur-2xl border-2 border-emerald-400/20 rounded-3xl shadow-2xl overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-500/10 to-transparent rounded-full translate-y-6 -translate-x-6"></div>

              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-xl">
                    <User className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Personal Information</h3>
                </div>

                <div className="space-y-4">
                  {/* First Name and Last Name - Inline */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* First Name */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-white/90 uppercase tracking-wide">
                        First Name
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                          <User className={`h-4 w-4 transition-colors ${
                            fieldErrors.first_name ? 'text-red-400' : 'text-emerald-400/70 group-focus-within:text-emerald-400'
                          }`} />
                        </div>
                        <input
                          type="text"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleChange}
                          onFocus={() => handleFieldFocus('first_name')}
                          readOnly={!isEditing}
                          className={`w-full pl-11 pr-4 py-3.5 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent backdrop-blur-xl transition-all duration-300 ${
                            isEditing
                              ? `bg-white/10 border ${fieldErrors.first_name ? 'border-red-400/50' : 'border-white/20'}`
                              : 'bg-white/5 border border-white/10 cursor-not-allowed'
                          }`}
                          placeholder={isEditing ? "Enter your first name" : (formData.first_name ? "" : "Not set")}
                          required={isEditing}
                        />
                      </div>
                      {fieldErrors.first_name && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start space-x-2 bg-red-500/10 backdrop-blur-sm rounded-xl p-3 border border-red-400/20"
                        >
                          <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                          <p className="text-red-300/90 text-xs leading-relaxed">{fieldErrors.first_name}</p>
                        </motion.div>
                      )}
                    </div>

                    {/* Last Name */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-white/90 uppercase tracking-wide">
                        Last Name
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                          <User className={`h-4 w-4 transition-colors ${
                            fieldErrors.last_name ? 'text-red-400' : 'text-emerald-400/70 group-focus-within:text-emerald-400'
                          }`} />
                        </div>
                        <input
                          type="text"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleChange}
                          onFocus={() => handleFieldFocus('last_name')}
                          readOnly={!isEditing}
                          className={`w-full pl-11 pr-4 py-3.5 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent backdrop-blur-xl transition-all duration-300 ${
                            isEditing
                              ? `bg-white/10 border ${fieldErrors.last_name ? 'border-red-400/50' : 'border-white/20'}`
                              : 'bg-white/5 border border-white/10 cursor-not-allowed'
                          }`}
                          placeholder={isEditing ? "Enter your last name" : (formData.last_name ? "" : "Not set")}
                          required={isEditing}
                        />
                      </div>
                      {fieldErrors.last_name && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start space-x-2 bg-red-500/10 backdrop-blur-sm rounded-xl p-3 border border-red-400/20"
                        >
                          <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                          <p className="text-red-300/90 text-xs leading-relaxed">{fieldErrors.last_name}</p>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-white/90 uppercase tracking-wide">
                      Email Address
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                        {checkingUniqueness.email ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <Mail className={`h-4 w-4 transition-colors ${
                            fieldErrors.email ? 'text-red-400' : 'text-emerald-400/70 group-focus-within:text-emerald-400'
                          }`} />
                        )}
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onFocus={() => handleFieldFocus('email')}
                        onBlur={() => handleFieldBlur('email')}
                        readOnly={!isEditing}
                        className={`w-full pl-11 pr-4 py-3.5 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent backdrop-blur-xl transition-all duration-300 ${
                          isEditing
                            ? `bg-white/10 border ${fieldErrors.email ? 'border-red-400/50' : 'border-white/20'}`
                            : 'bg-white/5 border border-white/10 cursor-not-allowed'
                        }`}
                        placeholder={isEditing ? "Enter your email address" : (formData.email ? "" : "Not set")}
                        required={isEditing}
                      />
                    </div>
                    {fieldErrors.email && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start space-x-2 bg-red-500/10 backdrop-blur-sm rounded-xl p-3 border border-red-400/20"
                      >
                        <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-300/90 text-xs leading-relaxed">{fieldErrors.email}</p>
                      </motion.div>
                    )}
                    {!fieldErrors.email && formData.email && isEditing && formData.email !== originalData.email && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start space-x-2 bg-emerald-500/10 backdrop-blur-sm rounded-xl p-3 border border-emerald-400/20"
                      >
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <p className="text-emerald-300/90 text-xs leading-relaxed">Email is available</p>
                      </motion.div>
                    )}
                  </div>

                  {/* Nickname */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-white/90 uppercase tracking-wide">
                      Nickname <span className="text-white/40 text-[10px] normal-case">(Optional)</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                        {checkingUniqueness.nickname ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <Edit3 className={`h-4 w-4 transition-colors ${
                            fieldErrors.nickname ? 'text-red-400' : 'text-emerald-400/70 group-focus-within:text-emerald-400'
                          }`} />
                        )}
                      </div>
                      <input
                        type="text"
                        name="nickname"
                        value={formData.nickname}
                        onChange={handleChange}
                        onFocus={() => handleFieldFocus('nickname')}
                        onBlur={() => handleFieldBlur('nickname')}
                        readOnly={!isEditing}
                        className={`w-full pl-11 pr-4 py-3.5 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent backdrop-blur-xl transition-all duration-300 ${
                          isEditing
                            ? `bg-white/10 border ${fieldErrors.nickname ? 'border-red-400/50' : 'border-white/20'}`
                            : 'bg-white/5 border border-white/10 cursor-not-allowed'
                        }`}
                        placeholder={isEditing ? "Choose a unique nickname" : (formData.nickname ? "" : "Not set")}
                      />
                    </div>
                    {fieldErrors.nickname && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start space-x-2 bg-red-500/10 backdrop-blur-sm rounded-xl p-3 border border-red-400/20"
                      >
                        <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-300/90 text-xs leading-relaxed">{fieldErrors.nickname}</p>
                      </motion.div>
                    )}
                    {!fieldErrors.nickname && formData.nickname && isEditing && formData.nickname !== originalData.nickname && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start space-x-2 bg-emerald-500/10 backdrop-blur-sm rounded-xl p-3 border border-emerald-400/20"
                      >
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <p className="text-emerald-300/90 text-xs leading-relaxed">Nickname is available</p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Additional Information - Full Width Below */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative group"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-teal-500/20 rounded-3xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
          <div className="relative p-8 bg-gradient-to-br from-slate-800/40 via-slate-900/40 to-slate-800/40 backdrop-blur-2xl border-2 border-blue-400/20 rounded-3xl shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-cyan-500/10 to-transparent rounded-full translate-y-6 -translate-x-6"></div>

            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Additional Information</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Date of Birth */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-white/90 uppercase tracking-wide">
                    Date of Birth
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                      <Calendar className={`h-4 w-4 transition-colors ${
                        fieldErrors.date_of_birth ? 'text-red-400' : 'text-blue-400/70 group-focus-within:text-blue-400'
                      }`} />
                    </div>
                    {isEditing ? (
                      <input
                        type="date"
                        name="date_of_birth"
                        value={formatDateForInput(formData.date_of_birth)}
                        onChange={handleChange}
                        onFocus={() => handleFieldFocus('date_of_birth')}
                        onBlur={() => handleFieldBlur('date_of_birth')}
                        className={`w-full pl-11 pr-4 py-3.5 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-xl transition-all duration-300 bg-white/10 border ${fieldErrors.date_of_birth ? 'border-red-400/50' : 'border-white/20'} [color-scheme:dark]`}
                        title="Select your date of birth"
                        required
                      />
                    ) : (
                      <div className="w-full pl-11 pr-4 py-3.5 rounded-xl text-white/70 bg-white/5 border border-white/10 cursor-not-allowed backdrop-blur-xl">
                        {formData.date_of_birth ? new Date(formData.date_of_birth).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Not set'}
                      </div>
                    )}
                  </div>
                  {fieldErrors.date_of_birth && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start space-x-2 bg-red-500/10 backdrop-blur-sm rounded-xl p-3 border border-red-400/20"
                    >
                      <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-red-300/90 text-xs leading-relaxed">{fieldErrors.date_of_birth}</p>
                    </motion.div>
                  )}
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-white/90 uppercase tracking-wide">
                    Gender
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                      <User className={`h-4 w-4 transition-colors ${
                        fieldErrors.gender ? 'text-red-400' : 'text-blue-400/70 group-focus-within:text-blue-400'
                      }`} />
                    </div>
                    {isEditing ? (
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={(e) => handleGenderChange(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-xl transition-all duration-300 bg-white/10 border border-white/20 appearance-none cursor-pointer"
                        aria-label="Select your gender"
                        title="Select your gender"
                      >
                        <option value="" className="bg-slate-800 text-white">Select gender</option>
                        <option value="male" className="bg-slate-800 text-white">Male</option>
                        <option value="female" className="bg-slate-800 text-white">Female</option>
                        <option value="prefer_not_to_say" className="bg-slate-800 text-white">Prefer not to say</option>
                      </select>
                    ) : (
                      <div className="w-full pl-11 pr-4 py-3.5 rounded-xl text-white/70 bg-white/5 border border-white/10 cursor-not-allowed backdrop-blur-xl">
                        {formData.gender ? (
                          formData.gender === 'male' ? 'Male' :
                          formData.gender === 'female' ? 'Female' :
                          'Prefer not to say'
                        ) : 'Not set'}
                      </div>
                    )}
                    {isEditing && (
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none z-10">
                        <svg className="h-4 w-4 text-blue-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* About Me */}
              <div className="space-y-2 mt-4">
                <label className="block text-xs font-semibold text-white/90 uppercase tracking-wide">
                  About Me <span className="text-white/40 text-[10px] normal-case">(Optional)</span>
                </label>
                <div className="relative group">
                  <div className="absolute top-0 left-0 pl-3.5 flex items-start pointer-events-none z-10 pt-3.5">
                    <Heart className={`h-4 w-4 transition-colors ${
                      fieldErrors.about_me ? 'text-red-400' : 'text-blue-400/70 group-focus-within:text-blue-400'
                    } mt-3.5`} />
                  </div>
                  <textarea
                    name="about_me"
                    value={formData.about_me}
                    onChange={handleChange}
                    onFocus={() => handleFieldFocus('about_me')}
                    rows={4}
                    readOnly={!isEditing}
                    className={`w-full pl-11 pr-4 py-3.5 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-xl transition-all duration-300 resize-none ${
                      isEditing
                        ? `bg-white/10 border ${fieldErrors.about_me ? 'border-red-400/50' : 'border-white/20'}`
                        : 'bg-white/5 border border-white/10 cursor-not-allowed'
                    }`}
                    placeholder={isEditing ? "Tell us about yourself..." : (formData.about_me ? "" : "Not set")}
                  />
                </div>
                {fieldErrors.about_me && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start space-x-2 bg-red-500/10 backdrop-blur-sm rounded-xl p-3 border border-red-400/20"
                  >
                    <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300/90 text-xs leading-relaxed">{fieldErrors.about_me}</p>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-green-500/20 backdrop-blur-xl rounded-2xl border border-emerald-400/30">
                  <Check className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Confirm Changes</h3>
              </div>

              <p className="text-white/80 mb-6">
                Are you sure you want to save these changes to your profile? This action cannot be undone.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300 backdrop-blur-xl border border-white/20"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSave}
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-400 hover:via-green-400 hover:to-teal-400 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {saving ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    'Confirm Save'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}