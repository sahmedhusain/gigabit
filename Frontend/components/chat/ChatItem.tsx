import { ChatItem as ChatItemType } from '@/types/chat';
import { Users, Clock, Trash2, Check, Clock3, XCircle, ShieldCheck, Lock, MoreHorizontal, Eye, EyeOff, Info, LogOut, Settings, User as UserIcon, Crown, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useState, useRef, useEffect, type MouseEvent as ReactMouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { User } from '@/lib/api';
import { getAvatarUrl } from '@/utils/avatarUtils';

interface ChatItemProps {
  item: ChatItemType;
  onClick: () => void;
  onDelete?: (conversationId: number) => void;
  getUserStatus: (userId: number) => string;
  typingUsers?: string[];
  currentUser?: User | null;
  onMarkAsRead?: (conversationId: number) => void;
  onMarkAsUnread?: (conversationId: number) => void;
  onShowInfo?: (conversationId: number, type: 'private' | 'group') => void;
  onLeaveGroup?: (groupId: number) => void;
  onShowSettings?: (conversationId: number, type: 'private' | 'group') => void;
}

export default function ChatItem({ item, onClick, onDelete, getUserStatus, typingUsers = [], currentUser, onMarkAsRead, onMarkAsUnread, onShowInfo, onLeaveGroup, onShowSettings }: ChatItemProps) {
  const router = useRouter();
  const isGroup = item.type === 'group';
  const participantId = item.participantId;
  const [imageError, setImageError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [nextAdmin, setNextAdmin] = useState<string>('');
  const [hasExistingAdmins, setHasExistingAdmins] = useState(false);
  const [hasOtherAdmins, setHasOtherAdmins] = useState(false);
  const [isMenuOpeningUpward, setIsMenuOpeningUpward] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const lastMessageTimestamp = item.lastMessageTime || item.updated_at;
  const resolvedGroupStatus = isGroup
    ? (item.groupStatus ?? item.group?.member_status ?? (item.group?.is_member ? 'member' : undefined))
    : undefined;
  const resolvedGroupRole = isGroup ? (item.groupRole ?? item.group?.role ?? undefined) : undefined;
  const resolvedGroupPrivacy = isGroup ? (item.groupPrivacy ?? item.group?.privacy ?? undefined) : undefined;

  // Helper function to calculate smart dropdown position
  const calculateMenuPosition = (buttonElement: HTMLElement) => {
    const rect = buttonElement.getBoundingClientRect();
    const menuWidth = 224; // w-56 = 14rem = 224px
    const menuHeight = 200; // Approximate menu height
    const gap = 4;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate optimal left position
    let left = rect.right - menuWidth;
    if (left < 8) {
      // Too far left, align to button left edge
      left = rect.left;
    }
    if (left + menuWidth > viewportWidth - 8) {
      // Too far right, align to right edge with padding
      left = viewportWidth - menuWidth - 8;
    }
    
    // Calculate optimal top position and direction
    let top = rect.bottom + gap;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    let openingUpward = false;
    
    // If not enough space below and more space above, show above
    if (spaceBelow < menuHeight + gap && spaceAbove > spaceBelow) {
      top = rect.top - menuHeight - gap;
      openingUpward = true;
    }
    
    // Ensure menu doesn't go beyond viewport boundaries
    if (top < 8) {
      top = 8;
      openingUpward = false;
    }
    if (top + menuHeight > viewportHeight - 8) {
      top = viewportHeight - menuHeight - 8;
    }
    
    // Update the opening direction state
    setIsMenuOpeningUpward(openingUpward);
    
    return { top, left };
  };

  // Only show the 'Admin' badge for group chats, and only if the current user is an admin of this group
  const showAdminBadge = isGroup && resolvedGroupRole === 'admin' && (
    // If group object has members, check if currentUser is admin in group members
    (item.group?.role === 'admin' || resolvedGroupRole === 'admin') &&
    (currentUser ? (
      (item.group?.creator_id && item.group?.creator_id === currentUser.id) ||
      resolvedGroupRole === 'admin'
    ) : true)
  );

  const resolvedLastMessage = (() => {
    if (!isGroup) {
      return item.lastMessage || 'No messages yet'
    }

    if (resolvedGroupStatus === 'sent') {
      return 'Waiting for approval to join'
    }

    if (resolvedGroupStatus === 'rejected') {
      return 'Join request declined'
    }

    return item.lastMessage || 'Joined the group'
  })();

  // Clamp overly long preview (including emoji runs)
  const clampedPreview = (text: string, max = 120) => {
    if (!text) return text
    if (text.length <= max) return text
    return text.slice(0, max - 1) + '…'
  }

  const highlightStatus = isGroup && resolvedGroupStatus && resolvedGroupStatus !== 'member';

  // Robust timestamp parser: handles ISO strings, milliseconds, or seconds
  const parseDate = (value: string | number | undefined | null): Date => {
    if (!value && value !== 0) return new Date(0)
    const raw = typeof value === 'number' ? value : String(value).trim()

    if (/^\d+$/.test(String(raw))) {
      const n = Number(raw)
      if (n > 0 && n < 1e11) {
        // looks like seconds
        return new Date(n * 1000)
      }
      return new Date(n)
    }

    const d = new Date(String(raw))
    if (isNaN(d.getTime())) return new Date(0)
    return d
  }

  const formatTime = (value: string | number | undefined | null) => {
    const d = parseDate(value)
    if (d.getTime() === 0) return 'No messages'
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  const formatRelativeTime = (value: string | number | undefined | null) => {
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

  const gradient = isGroup
    ? 'from-blue-400 via-indigo-500 to-purple-600'
    : 'from-emerald-400 via-teal-500 to-cyan-600';

  const hasTypingUsers = typingUsers && typingUsers.length > 0;
  const resolvedUnread = (item.unreadCount ?? item.unread_count ?? 0) || 0;
  const hasManualUnread = item.has_unread || false; // manually marked as unread
  const hasUnread = resolvedUnread > 0 || hasManualUnread;

  // Normalize avatar to a usable URL if it's an ID or relative token
  const normalizedAvatar = item.avatar && !imageError ? getAvatarUrl(item.avatar) || undefined : undefined;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleDelete = async () => {
    if (onDelete && item.conversationId) {
      onDelete(item.conversationId);
    }
    setShowDeleteConfirm(false);
    setShowLeaveConfirm(false);
    setShowMenu(false);
  };

  const handleMarkAsRead = async () => {
    if (item.conversationId) {
      try {
        const conversationType = isGroup ? 'group' : 'private';
        // For groups, use the group ID or fall back to conversation ID
        // For private chats, use the conversation ID
        const conversationId = isGroup ? (item.group?.id || item.id) : item.conversationId;
        
        await api.markConversationAsRead(conversationId, conversationType);
        
        // Callback to update UI
        onMarkAsRead?.(item.conversationId);
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
    setShowMenu(false);
  };

  const handleMarkAsUnread = async () => {
    if (item.conversationId) {
      try {
        const conversationType = isGroup ? 'group' : 'private';
        // For groups, use the group ID or fall back to conversation ID
        // For private chats, use the conversation ID
        const conversationId = isGroup ? (item.group?.id || item.id) : item.conversationId;
        
        await api.markConversationAsUnread(conversationId, conversationType);
        
        // Callback to update UI
        onMarkAsUnread?.(item.conversationId);
      } catch (error) {
        console.error('Failed to mark as unread:', error);
      }
    }
    setShowMenu(false);
  };

  const handleShowProfile = () => {
    if (participantId) {
      router.push(`/profile/${participantId}`);
    }
    setShowMenu(false);
  };

  const handleShowInfo = () => {
    if (isGroup && item.conversationId) {
      // Open chat window in info tab
      onClick();
      onShowInfo?.(item.conversationId, 'group');
    }
    setShowMenu(false);
  };

  const fetchGroupInfo = async (groupId: number) => {
    try {
      const [membersData, roleData] = await Promise.all([
        api.getGroupMembers(groupId),
        api.getUserRole(groupId)
      ]);
      
      setGroupMembers(membersData.members);
      setUserRole(roleData.role);
      
      // Fetch next admin info for creators and check other admins for admin users
      if (roleData.role === 'creator') {
        try {
          const nextAdminData = await api.getNextAdmin(groupId);
          setHasExistingAdmins(nextAdminData.has_admins);
          // Use first_member as next admin if no admins exist
          setNextAdmin(nextAdminData.has_admins ? nextAdminData.next_admin : nextAdminData.first_member);
        } catch (error) {
          console.error('Failed to fetch next admin:', error);
          setNextAdmin('No eligible members');
          setHasExistingAdmins(false);
        }
      } else if (roleData.role === 'admin') {
        try {
          const nextAdminData = await api.getNextAdmin(groupId);
          // For admins, check if there are other admins (has_admins means there are admins besides creator)
          setHasOtherAdmins(nextAdminData.has_admins);
        } catch (error) {
          console.error('Failed to check other admins:', error);
          setHasOtherAdmins(false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch group info:', error);
    }
  };

  const handleLeaveGroup = async () => {
    const groupId = item.groupId || item.group?.id;
    if (groupId && isGroup) {
      await fetchGroupInfo(groupId);
    }
    setShowLeaveConfirm(true);
    setShowMenu(false);
  };

  const confirmLeaveGroup = async () => {
    // Try to get group ID from multiple possible sources
    const groupId = item.groupId || item.group?.id;
    if (groupId && onLeaveGroup) {
      onLeaveGroup(groupId);
    }
    setShowLeaveConfirm(false);
    setUserRole('');
    setGroupMembers([]);
    setNextAdmin('');
  };

  const handleManageAdmins = () => {
    setShowLeaveConfirm(false);
    setShowMenu(false);
    // Open chat window in settings tab
    if (isGroup && item.conversationId) {
      onClick();
      onShowSettings?.(item.conversationId, 'group');
    }
  };

  const handleShowSettings = () => {
    if (isGroup && item.conversationId) {
      // Open chat window in settings tab
      onClick();
      onShowSettings?.(item.conversationId, 'group');
    }
    setShowMenu(false);
  };

  // Helper: determine if root should block navigation due to menu interactions/state
  const shouldBlockRootNavigation = (target: EventTarget | null) => {
    if (!target) return false;
    // If clicking inside the menu/button area or menu is open, block
    if (menuRef.current && menuRef.current.contains(target as Node)) return true;
    if (showMenu) return true;
    return false;
  };

  // Root click guard: if click originated from the menu area or while menu is open, don't open the chat
  const handleRootClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    // If clicking on the menu container or button, don't open chat
    if (menuRef.current && menuRef.current.contains(e.target as Node)) {
      return;
    }
    // If menu is open and clicking elsewhere, close it but don't open chat
    if (showMenu) {
      setShowMenu(false);
      return;
    }
    onClick();
  };

  return (
    <>
      <div
        onClick={handleRootClick}
        className="group relative cursor-pointer"
        role="button"
        aria-label={`Open conversation ${item.name || ''}`}
      >
      {/* Background with animated gradient */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`}
        initial={false}
        animate={{ opacity: hasUnread ? 0.15 : 0 }}
      />

      {/* Main container */}
      <motion.div 
        className={`relative flex items-center gap-4 p-3 md:p-4 bg-white/5 backdrop-blur-lg rounded-2xl transition-all duration-300 border ${hasUnread ? 'border-emerald-400/40 bg-emerald-500/5' : 'border-white/10 hover:bg-white/10 hover:border-white/20'} shadow-lg ${hasUnread ? 'hover:shadow-emerald-500/30' : 'hover:shadow-xl'} group-hover:shadow-emerald-500/10`}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        {hasUnread && (
          <div className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden">
            <div className="absolute -inset-x-20 -inset-y-10 bg-gradient-to-r from-transparent via-emerald-300/10 to-transparent animate-[shimmer_2s_infinite]" />
          </div>
        )}
        {/* Avatar with enhanced effects */}
        <div className="relative flex-shrink-0">
          {participantId ? (
            <div className={`w-14 h-14 rounded-full p-0.5 flex-shrink-0 transition-all duration-300 ${getUserStatus(participantId) === 'online' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
              getUserStatus(participantId) === 'busy' ? 'bg-gradient-to-r from-red-400 to-red-500' :
                getUserStatus(participantId) === 'away' ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                  'bg-gradient-to-r from-gray-400 to-gray-500'
              }`}>
              <motion.div
                className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-800 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg overflow-hidden"
                whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                {normalizedAvatar ? (
                  <Image
                    src={normalizedAvatar}
                    alt={item.name || 'Avatar'}
                    width={52}
                    height={52}
                    className="w-full h-full object-cover rounded-full"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  item.name?.charAt(0).toUpperCase()
                )}
              </motion.div>
            </div>
          ) : (
            <motion.div
              className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg ring-2 ring-white/10 group-hover:ring-white/20 transition-all duration-300 overflow-hidden`}
              whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              {normalizedAvatar ? (
                <Image
                  src={normalizedAvatar}
                  alt={item.name || 'Avatar'}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                item.name?.charAt(0).toUpperCase()
              )}
            </motion.div>
          )}

          {/* Online status with pulse animation */}
          {participantId && (
            <motion.div
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white border-2 border-white flex items-center justify-center"
              animate={{ scale: getUserStatus(participantId) !== 'offline' ? [1, 1.2, 1] : 1 }}
            >
              <div className={`w-3 h-3 rounded-full ${
                getUserStatus(participantId) === 'online' ? 'bg-green-500' :
                getUserStatus(participantId) === 'busy' ? 'bg-red-500' :
                getUserStatus(participantId) === 'away' ? 'bg-yellow-500' :
                'bg-gray-500'
              }`} />
            </motion.div>
          )}

          {/* Unread indicator */}
          <AnimatePresence>
            {hasUnread && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className={`absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-full shadow-lg ring-2 ring-white/20 ${
                  resolvedUnread > 0 
                    ? 'text-[10px] min-w-[20px] h-5 flex items-center justify-center px-1' 
                    : 'w-3 h-3'
                }`}
              >
                {resolvedUnread > 0 ? (resolvedUnread > 99 ? '99+' : resolvedUnread) : ''}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 relative">
          <div className="flex items-center gap-2 min-w-0 mb-0.5 md:mb-1">
            <motion.h3
              className="text-white font-semibold text-base md:text-lg truncate group-hover:text-emerald-300 transition-colors duration-300"
              layoutId={`chat-name-${item.id}`}
            >
              {item.name}
            </motion.h3>
            {/* Only show the Admin badge for group chats if current user is admin */}
            {showAdminBadge && (
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Admin
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <AnimatePresence mode="wait">
                {hasTypingUsers ? (
                  <motion.div
                    key="typing"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center space-x-2"
                  >
                    <div className="flex space-x-1">
                      <motion.div
                        className="w-2 h-2 bg-emerald-400 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-emerald-400 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-emerald-400 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                    <span className="text-emerald-400 text-sm italic">
                      {typingUsers.length === 1
                        ? `${typingUsers[0]} is typing...`
                        : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`
                      }
                    </span>
                  </motion.div>
                ) : (
                  <motion.p
                    key="message"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`text-[13px] md:text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[22ch] md:max-w-[34ch] ${highlightStatus ? 'text-amber-200' : 'text-white/70'}`}
                  >
                    {clampedPreview(resolvedLastMessage)}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              {/* Message status for private chats */}
              {!isGroup && item.lastMessage && (
                <div className="text-white/40 flex items-center">
                  {item.lastMessageStatus === 'sending' && <Clock className="w-4 h-4 text-white/40" />}
                  {item.lastMessageStatus === 'sent' && <Check className="w-4 h-4 text-white/40" />}
                  {item.lastMessageStatus === 'delivered' && <Check className="w-4 h-4 text-white/40" />}
                  {item.lastMessageStatus === 'read' && <Check className="w-4 h-4 text-blue-400" />}
                </div>
              )}
              
              {/* Timestamp centered vertically */}
              <div className="flex items-center space-x-1 text-white/50 text-[11px] md:text-xs">
                <Clock className="w-3 h-3" />
                <span className="tabular-nums">{formatRelativeTime(lastMessageTimestamp)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hover effect overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          initial={false}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />

        {/* Three-dots menu button */}
        <div 
          className="absolute top-2 right-2 z-10" 
          ref={menuRef}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <motion.button
            ref={buttonRef}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              
              if (!showMenu && buttonRef.current) {
                // Calculate smart position to avoid viewport overflow
                const position = calculateMenuPosition(buttonRef.current);
                setMenuPosition(position);
              }
              
              setShowMenu(!showMenu);
            }}
            className="p-2 text-white/40 hover:text-white hover:bg-white/20 rounded-lg opacity-60 group-hover:opacity-100 transition-all duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <MoreHorizontal className="w-4 h-4" />
          </motion.button>

        </div>

        {/* Hover effect overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          initial={false}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />

        {/* Three-dots menu button */}
        <div 
          className="absolute top-2 right-2 z-10" 
          ref={menuRef}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <motion.button
            ref={buttonRef}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              
              if (!showMenu && buttonRef.current) {
                // Calculate smart position to avoid viewport overflow
                const position = calculateMenuPosition(buttonRef.current);
                setMenuPosition(position);
              }
              
              setShowMenu(!showMenu);
            }}
            className="p-2 text-white/40 hover:text-white hover:bg-white/20 rounded-lg opacity-60 group-hover:opacity-100 transition-all duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <MoreHorizontal className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>
      </div>

      {/* Fixed dropdown menu - outside container */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ 
              opacity: 0, 
              scale: 0.95, 
              y: isMenuOpeningUpward ? 10 : -10,
              transformOrigin: isMenuOpeningUpward ? 'bottom' : 'top'
            }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0 
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.95, 
              y: isMenuOpeningUpward ? 10 : -10 
            }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed w-56 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden z-[9999]"
            style={{ 
              top: menuPosition.top,
              left: menuPosition.left,
              zIndex: 9999 
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {/* Direction arrow indicator */}
            <div 
              className={`absolute w-3 h-3 bg-slate-800 border-white/20 transform rotate-45 right-5 drop-shadow-md ${
                isMenuOpeningUpward 
                  ? 'bottom-[-6px] border-b border-r' 
                  : 'top-[-6px] border-t border-l'
              }`}
            />
            <div className="py-2">
              {/* Common options */}
              {hasUnread ? (
                <motion.button
                  onClick={handleMarkAsRead}
                  className="w-full px-4 py-3 text-left text-white/90 hover:bg-white/10 transition-colors flex items-center space-x-3"
                  whileHover={{ x: 4 }}
                >
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium">Mark as read</span>
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleMarkAsUnread}
                  className="w-full px-4 py-3 text-left text-white/90 hover:bg-white/10 transition-colors flex items-center space-x-3"
                  whileHover={{ x: 4 }}
                >
                  <EyeOff className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium">Mark as unread</span>
                </motion.button>
              )}

              {/* Private chat specific options */}
              {!isGroup && (
                <>
                  <motion.button
                    onClick={handleShowProfile}
                    className="w-full px-4 py-3 text-left text-white/90 hover:bg-white/10 transition-colors flex items-center space-x-3"
                    whileHover={{ x: 4 }}
                  >
                    <UserIcon className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium">View profile</span>
                  </motion.button>

                  <div className="h-px bg-white/10 my-2" />

                  <motion.button
                    onClick={() => {
                      setShowDeleteConfirm(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 transition-colors flex items-center space-x-3"
                    whileHover={{ x: 4 }}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Delete chat</span>
                  </motion.button>
                </>
              )}

              {/* Group chat specific options */}
              {isGroup && (
                <>
                  <motion.button
                    onClick={handleShowInfo}
                    className="w-full px-4 py-3 text-left text-white/90 hover:bg-white/10 transition-colors flex items-center space-x-3"
                    whileHover={{ x: 4 }}
                  >
                    <Info className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium">Show info</span>
                  </motion.button>

                  {/* Show settings only if user is admin */}
                  {(resolvedGroupRole === 'admin' || resolvedGroupRole === 'creator') && (
                    <motion.button
                      onClick={handleShowSettings}
                      className="w-full px-4 py-3 text-left text-white/90 hover:bg-white/10 transition-colors flex items-center space-x-3"
                      whileHover={{ x: 4 }}
                    >
                      <Settings className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium">Settings</span>
                    </motion.button>
                  )}

                  <div className="h-px bg-white/10 my-2" />

                  <motion.button
                    onClick={handleLeaveGroup}
                    className="w-full px-4 py-3 text-left text-amber-400 hover:bg-amber-500/10 transition-colors flex items-center space-x-3"
                    whileHover={{ x: 4 }}
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Leave group</span>
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onMouseDown={(e) => {
              e.stopPropagation();
              (e as any).nativeEvent?.stopImmediatePropagation?.();
            }}
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(false);
              (e as any).nativeEvent?.stopImmediatePropagation?.();
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 max-w-sm mx-4"
              onMouseDown={(e) => {
                e.stopPropagation();
                (e as any).nativeEvent?.stopImmediatePropagation?.();
              }}
              onClick={(e) => {
                e.stopPropagation();
                (e as any).nativeEvent?.stopImmediatePropagation?.();
              }}
            >
              <h3 className="text-white text-lg font-semibold mb-4">Delete Conversation</h3>
              <p className="text-white/70 mb-6">
                Are you sure you want to delete this conversation? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <motion.button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleDelete}
                  className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leave group confirmation dialog */}
      <AnimatePresence>
        {showLeaveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onMouseDown={(e) => {
              e.stopPropagation();
              (e as any).nativeEvent?.stopImmediatePropagation?.();
            }}
            onClick={(e) => {
              e.stopPropagation();
              setShowLeaveConfirm(false);
              (e as any).nativeEvent?.stopImmediatePropagation?.();
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 max-w-sm mx-4"
              onMouseDown={(e) => {
                e.stopPropagation();
                (e as any).nativeEvent?.stopImmediatePropagation?.();
              }}
              onClick={(e) => {
                e.stopPropagation();
                (e as any).nativeEvent?.stopImmediatePropagation?.();
              }}
            >
              <h3 className="text-white text-lg font-semibold mb-4 flex items-center">
                {userRole === 'creator' ? <Crown className="w-4 h-4 text-yellow-400 mr-2" /> :
                 userRole === 'admin' ? <Shield className="w-4 h-4 text-blue-400 mr-2" /> : null}
                Leave Group
              </h3>
              
              {/* Different messages based on user role */}
              {userRole === 'creator' && (
                <div className="mb-6">
                  {hasExistingAdmins ? (
                    <p className="text-white/70 mb-3">
                      As the group creator, leaving will transfer ownership to the next admin.
                    </p>
                  ) : (
                    <p className="text-white/70 mb-3">
                      As the group creator, since there are no admins, ownership will be transferred to the first added member (like WhatsApp).
                    </p>
                  )}
                  
                  {nextAdmin && nextAdmin !== 'No eligible members' ? (
                    <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-3 mb-4">
                      <p className="text-yellow-200 text-sm font-medium flex items-center">
                        <Crown className="w-4 h-4 mr-2" />
                        {hasExistingAdmins ? 'Next Admin Owner:' : 'Next Owner (First Member):'} {nextAdmin}
                      </p>
                    </div>
                  ) : nextAdmin === 'No eligible members' ? (
                    <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-3 mb-4">
                      <p className="text-red-200 text-sm font-medium">
                        No eligible members to transfer ownership to.
                      </p>
                    </div>
                  ) : null}
                  
                  {!hasExistingAdmins && nextAdmin && nextAdmin !== 'No eligible members' ? (
                    <p className="text-white/60 text-sm">
                      You can select an admin before leaving, or proceed to transfer ownership to the first member.
                    </p>
                  ) : hasExistingAdmins ? (
                    <p className="text-white/60 text-sm">
                      You can manage admins before leaving, or proceed to leave the group.
                    </p>
                  ) : (
                    <p className="text-white/60 text-sm">
                      Add some admins first, or the group will be transferred to the first member.
                    </p>
                  )}
                </div>
              )}
              
              {userRole === 'admin' && (
                <div className="mb-6">
                  <p className="text-white/70 mb-3">
                    Are you sure you want to leave "{item.name}"? As an admin, you will lose your administrative privileges.
                  </p>
                  {hasOtherAdmins ? (
                    <p className="text-white/60 text-sm">
                      Since there are other admins in the group, you can leave normally. You will need to be re-invited to rejoin.
                    </p>
                  ) : (
                    <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-3">
                      <p className="text-yellow-200 text-sm font-medium flex items-center">
                        <Shield className="w-4 h-4 mr-2" />
                        You are the only admin. Consider promoting someone before leaving.
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {userRole === 'member' && (
                <p className="text-white/70 mb-6">
                  Are you sure you want to leave "{item.name}"? You will no longer receive messages from this group and will need to be re-invited to rejoin.
                </p>
              )}

              {/* Buttons based on user role and conditions */}
              {userRole === 'creator' ? (
                nextAdmin && nextAdmin !== 'No eligible members' ? (
                  <div className="space-y-3">
                    <div className="flex space-x-3">
                      <motion.button
                        onClick={() => setShowLeaveConfirm(false)}
                        className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        onClick={handleManageAdmins}
                        className="flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Settings className="w-4 h-4" />
                        <span>{hasExistingAdmins ? 'Manage Admins' : 'Add Admin'}</span>
                      </motion.button>
                    </div>
                    <motion.button
                      onClick={confirmLeaveGroup}
                      className="w-full py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {hasExistingAdmins ? 'Leave Group' : 'Leave & Transfer to First Member'}
                    </motion.button>
                  </div>
                ) : (
                  /* No eligible members case */
                  <div className="flex space-x-3">
                    <motion.button
                      onClick={() => setShowLeaveConfirm(false)}
                      className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={handleManageAdmins}
                      className="flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Add Members</span>
                    </motion.button>
                  </div>
                )
              ) : userRole === 'admin' ? (
                /* Admin buttons - show manage admins only if they're the only admin */
                !hasOtherAdmins ? (
                  <div className="space-y-3">
                    <div className="flex space-x-3">
                      <motion.button
                        onClick={() => setShowLeaveConfirm(false)}
                        className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        onClick={handleManageAdmins}
                        className="flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Add Admin</span>
                      </motion.button>
                    </div>
                    <motion.button
                      onClick={confirmLeaveGroup}
                      className="w-full py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Leave Anyway
                    </motion.button>
                  </div>
                ) : (
                  /* Normal admin leave when other admins exist */
                  <div className="flex space-x-3">
                    <motion.button
                      onClick={() => setShowLeaveConfirm(false)}
                      className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={confirmLeaveGroup}
                      className="flex-1 py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Leave Group
                    </motion.button>
                  </div>
                )
              ) : (
                /* Member buttons - simple leave */
                <div className="flex space-x-3">
                  <motion.button
                    onClick={() => setShowLeaveConfirm(false)}
                    className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={confirmLeaveGroup}
                    className="flex-1 py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Leave Group
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
