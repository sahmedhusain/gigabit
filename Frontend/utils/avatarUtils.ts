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
    'defaultM': '/avatars/defaultM.png',
    'defaultFM': '/avatars/defaultFM.png'
  };
  
  // Return mapped path or fallback to default
  return avatarMap[avatar] || '/avatars/defaultM.png';
}

// Get avatar options for registration page
export function getAvatarOptions() {
  return [
    { 
      id: 'male1', 
      label: 'M1', 
      gradient: 'from-blue-400 to-blue-600',
      imageUrl: '/avatars/M1.png'
    },
    { 
      id: 'male2', 
      label: 'M2', 
      gradient: 'from-indigo-400 to-indigo-600',
      imageUrl: '/avatars/M2.png'
    },
    { 
      id: 'male3', 
      label: 'M3', 
      gradient: 'from-cyan-400 to-cyan-600',
      imageUrl: '/avatars/M3.png'
    }
  ];
}
