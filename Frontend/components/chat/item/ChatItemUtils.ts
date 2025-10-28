
export const getPrivateChatInitials = (name: string | undefined): string => {
  return (name || 'User').slice(0, 2).toUpperCase();
}


export const parseDate = (value: string | number | undefined | null): Date => {
  if (!value && value !== 0) return new Date(0)
  const raw = typeof value === 'number' ? value : String(value).trim()

  if (/^\d+$/.test(String(raw))) {
    const n = Number(raw)
    if (n > 0 && n < 1e11) {
      
      return new Date(n * 1000)
    }
    return new Date(n)
  }

  const d = new Date(String(raw))
  if (isNaN(d.getTime())) return new Date(0)
  return d
}

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

export const formatRelativeTime = (value: string | number | undefined | null) => {
  const d = parseDate(value)
  if (d.getTime() === 0) return 'No messages'
  const now = new Date()
  if (isSameDay(d, now)) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  }
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (isSameDay(d, yesterday)) return 'Yesterday'
  return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
}


export const formatLastMessagePreview = (message: string | undefined, messageType: string | undefined) => {
  if (!message) return 'No messages yet';

  if (messageType === 'image') {
    return '📷 Photo';
  }

  
  if (message === 'XdeletedbyuserX' || message === 'This message was deleted') {
    return 'Message deleted';
  }

  return message;
}


export const clampedPreview = (text: string, max = 120) => {
  if (!text) return text
  if (text.length <= max) return text
  return text.slice(0, max - 1) + '…'
}


export const calculateMenuPosition = (buttonElement: HTMLElement) => {
  const rect = buttonElement.getBoundingClientRect();
  const menuWidth = 224; 
  const menuHeight = 200; 
  const gap = 4;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  
  let left = rect.right - menuWidth;
  if (left < 8) {
    
    left = rect.left;
  }
  if (left + menuWidth > viewportWidth - 8) {
    
    left = viewportWidth - menuWidth - 8;
  }

  
  let top = rect.bottom + gap;
  const spaceBelow = viewportHeight - rect.bottom;
  const spaceAbove = rect.top;
  let openingUpward = false;

  
  if (spaceBelow < menuHeight + gap && spaceAbove > spaceBelow) {
    top = rect.top - menuHeight - gap;
    openingUpward = true;
  }

  
  if (top < 8) {
    top = 8;
    openingUpward = false;
  }
  if (top + menuHeight > viewportHeight - 8) {
    top = viewportHeight - menuHeight - 8;
  }

  return { top, left, openingUpward };
};