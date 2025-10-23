// Utility function to convert avatar IDs to image URLs
export function getAvatarUrl(avatar: string | null | undefined): string | null {
  if (!avatar) return null;
  
  // If it's already a full URL or data URL, return as is
  if (avatar.startsWith('data:') || avatar.startsWith('http') || avatar.startsWith('/')) {
    return avatar;
  }
  
  // Convert avatar IDs to image paths
  const avatarMap: Record<string, string> = {
    'male1': '/avatars/M1.png',
    'male2': '/avatars/M2.png', 
    'male3': '/avatars/M3.png',
    'female1': '/avatars/FM1.png',
    'female2': '/avatars/FM2.png',
    'female3': '/avatars/FM3.png',
  };
  
  // Return mapped path or null if not found
  return avatarMap[avatar] || null;
}

// Get user initials for avatar placeholders (first + last name first letters)
export function getUserInitials(user: { first_name?: string; last_name?: string; nickname?: string; email?: string }): string {
  const firstName = user.first_name?.trim();
  const lastName = user.last_name?.trim();
  
  // Try first and last name first
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  
  // Try first name only
  if (firstName) {
    return firstName.slice(0, 2).toUpperCase();
  }
  
  // Try nickname
  if (user.nickname) {
    return user.nickname.slice(0, 2).toUpperCase();
  }
  
  // Fallback to email
  if (user.email) {
    return user.email.slice(0, 2).toUpperCase();
  }
  
  // Ultimate fallback
  return 'U';
}

// Get group initials for avatar placeholders (first two letters of first word)
export function getGroupInitials(groupName: string): string {
  if (!groupName || !groupName.trim()) {
    return 'G';
  }
  
  const trimmedName = groupName.trim();
  const firstWord = trimmedName.split(/\s+/)[0];
  
  if (firstWord.length >= 2) {
    return firstWord.slice(0, 2).toUpperCase();
  } else if (firstWord.length === 1) {
    return firstWord.charAt(0).toUpperCase() + firstWord.charAt(0).toUpperCase();
  }
  
  return 'G';
}

// Get avatar options for registration page
export function getAvatarOptions(gender?: 'male' | 'female') {
  const allAvatars = [
    // Male avatars (have M in their name)
    { 
      id: 'male1', 
      label: 'M1', 
      gradient: 'from-blue-400 to-blue-600',
      imageUrl: '/avatars/M1.png',
      gender: 'male' as const
    },
    { 
      id: 'male2', 
      label: 'M2', 
      gradient: 'from-indigo-400 to-indigo-600',
      imageUrl: '/avatars/M2.png',
      gender: 'male' as const
    },
    { 
      id: 'male3', 
      label: 'M3', 
      gradient: 'from-cyan-400 to-cyan-600',
      imageUrl: '/avatars/M3.png',
      gender: 'male' as const
    },
    // Female avatars (have FM in their name)
    { 
      id: 'female1', 
      label: 'FM1', 
      gradient: 'from-pink-400 to-pink-600',
      imageUrl: '/avatars/FM1.png',
      gender: 'female' as const
    },
    { 
      id: 'female2', 
      label: 'FM2', 
      gradient: 'from-purple-400 to-purple-600',
      imageUrl: '/avatars/FM2.png',
      gender: 'female' as const
    },
    { 
      id: 'female3', 
      label: 'FM3', 
      gradient: 'from-rose-400 to-rose-600',
      imageUrl: '/avatars/FM3.png',
      gender: 'female' as const
    },
  ];

  if (gender) {
    return allAvatars.filter(avatar => avatar.gender === gender);
  }
  
  return allAvatars;
}
