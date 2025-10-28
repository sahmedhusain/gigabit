import { ChatItem as ChatItemType } from '@/types/chat';
import { useState, useRef, useEffect, type MouseEvent as ReactMouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { User } from '@/lib/api';
import { getAvatarUrl } from '@/utils/avatarUtils';
import { calculateMenuPosition, formatRelativeTime } from './item/ChatItemUtils';
import ChatItemDisplay from './item/ChatItemDisplay';
import ChatItemMenu from './menus/ChatItemMenu';
import DeleteChatDialog from './dialogs/DeleteChatDialog';
import LeaveGroupDialog from './dialogs/LeaveGroupDialog';

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
  mutedConversations?: number[];
  onToggleMute?: (conversationId: number) => void;
  newPostsCount?: number;
  unrespondedPollsCount?: number;
  unrespondedEventsCount?: number;
  pendingRequestsCount?: number;
}

export default function ChatItem({ item, onClick, onDelete, getUserStatus, typingUsers = [], currentUser, onMarkAsRead, onMarkAsUnread, onShowInfo, onLeaveGroup, onShowSettings, mutedConversations = [], onToggleMute, newPostsCount = 0, unrespondedPollsCount = 0, unrespondedEventsCount = 0, pendingRequestsCount = 0 }: ChatItemProps) {
  const router = useRouter();
  const isGroup = item.type === 'group';
  const participantId = item.participantId;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [userRole, setUserRole] = useState<string>('');
  const [nextAdmin, setNextAdmin] = useState<string>('');
  const [hasExistingAdmins, setHasExistingAdmins] = useState(false);
  const [hasOtherAdmins, setHasOtherAdmins] = useState(false);
  const [isMenuOpeningUpward, setIsMenuOpeningUpward] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const lastMessageTimestamp = item.lastMessageTime || item.timestamp;
  const resolvedGroupStatus = isGroup
    ? (item.groupStatus ?? item.group?.member_status ?? (item.group?.is_member ? 'member' : undefined))
    : undefined;
  const resolvedGroupRole = isGroup ? (item.groupRole ?? item.group?.role ?? undefined) : undefined;

  
  const showAdminBadge = isGroup && resolvedGroupRole === 'admin' && (
    
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

    
    if (!item.lastMessage && item.joinedAt) {
      return `Joined ${formatRelativeTime(item.joinedAt)}`
    }

    return item.lastMessage || 'Joined the group'
  })();

  const highlightStatus = isGroup && resolvedGroupStatus && resolvedGroupStatus !== 'member';

  
  const isMuted = mutedConversations.includes(item.conversationId || item.id);

  
  const hasUnreadTabContent = isGroup && (
    (newPostsCount ?? 0) > 0 ||
    (unrespondedPollsCount ?? 0) > 0 ||
    (unrespondedEventsCount ?? 0) > 0 ||
    (pendingRequestsCount ?? 0) > 0
  );

  
  const normalizedAvatar = getAvatarUrl(item.avatar);

  
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

  const handleShowProfile = () => {
    if (participantId) {
      router.push(`/profile/${participantId}`);
    }
    setShowMenu(false);
  };

  const handleShowInfo = () => {
    if (isGroup && item.conversationId) {
      
      onClick();
      onShowInfo?.(item.conversationId, 'group');
    }
    setShowMenu(false);
  };

  const fetchGroupInfo = async (groupId: number) => {
    try {
      const [, roleData] = await Promise.all([
        api.getGroupMembers(groupId),
        api.getUserRole(groupId)
      ]);

      setUserRole(roleData.role);

      
      if (roleData.role === 'creator') {
        try {
          const nextAdminData = await api.getNextAdmin(groupId);
          setHasExistingAdmins(nextAdminData.has_admins);
          
          setNextAdmin(nextAdminData.has_admins ? nextAdminData.next_admin : nextAdminData.first_member);
        } catch {
          setNextAdmin('No eligible members');
          setHasExistingAdmins(false);
        }
      } else if (roleData.role === 'admin') {
        try {
          const nextAdminData = await api.getNextAdmin(groupId);
          
          setHasOtherAdmins(nextAdminData.has_admins);
        } catch {
          setHasOtherAdmins(false);
        }
      }
    } catch {
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
    
    const groupId = item.groupId || item.group?.id;
    if (groupId && onLeaveGroup) {
      onLeaveGroup(groupId);
    }
    setUserRole('');
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
      
      onClick();
      onShowSettings?.(item.conversationId, 'group');
    }
    setShowMenu(false);
  };

  
  const handleRootClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    
    if (menuRef.current && menuRef.current.contains(e.target as Node)) {
      return;
    }
    
    if (showMenu) {
      setShowMenu(false);
      return;
    }
    onClick();
  };

  const handleMenuButtonClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!showMenu && buttonRef.current) {
      
      const position = calculateMenuPosition(buttonRef.current);
      setMenuPosition(position);
      setIsMenuOpeningUpward(position.openingUpward);
    }

    setShowMenu(!showMenu);
  };

  const resolvedUnread = (item.unreadCount ?? item.unread_count ?? 0) || 0;
  const hasManualUnread = item.has_unread || false; 
  const hasUnread = resolvedUnread > 0 || hasManualUnread;
  const hasTypingUsers = typingUsers && typingUsers.length > 0;
  const gradient = isGroup
    ? 'from-emerald-400 via-teal-500 to-cyan-600'
    : 'from-emerald-400 via-teal-500 to-cyan-600';

  return (
    <>
      <ChatItemDisplay
        item={item}
        onClick={() => handleRootClick({} as ReactMouseEvent<HTMLDivElement>)}
        getUserStatus={getUserStatus}
        typingUsers={typingUsers}
        isMuted={isMuted}
        hasUnread={hasUnread}
        hasUnreadTabContent={hasUnreadTabContent}
        resolvedLastMessage={resolvedLastMessage}
        highlightStatus={!!highlightStatus}
        lastMessageTimestamp={lastMessageTimestamp}
        showAdminBadge={showAdminBadge}
        normalizedAvatar={normalizedAvatar}
        resolvedUnread={resolvedUnread}
        isGroup={isGroup}
        participantId={participantId}
        gradient={gradient}
        hasTypingUsers={hasTypingUsers}
        onMenuButtonClick={handleMenuButtonClick}
        menuRef={menuRef as React.RefObject<HTMLDivElement>}
        buttonRef={buttonRef as React.RefObject<HTMLButtonElement>}
      />

      <ChatItemMenu
        isOpen={showMenu}
        position={menuPosition}
        openingUpward={isMenuOpeningUpward}
        hasUnread={hasUnread}
        isMuted={isMuted}
        isGroup={isGroup}
        showAdminSettings={resolvedGroupRole === 'admin' || resolvedGroupRole === 'creator'}
        onMarkAsRead={() => {
          if (onMarkAsRead && item.conversationId) {
            onMarkAsRead(item.conversationId);
          }
          setShowMenu(false);
        }}
        onMarkAsUnread={() => {
          if (onMarkAsUnread && item.conversationId) {
            onMarkAsUnread(item.conversationId);
          }
          setShowMenu(false);
        }}
        onToggleMute={() => {
          if (onToggleMute) {
            onToggleMute(item.conversationId || item.id);
          }
          setShowMenu(false);
        }}
        onShowProfile={handleShowProfile}
        onShowInfo={handleShowInfo}
        onShowSettings={handleShowSettings}
        onLeaveGroup={handleLeaveGroup}
        onDeleteChat={() => {
          setShowDeleteConfirm(true);
          setShowMenu(false);
        }}
      />

      <DeleteChatDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
      />

      <LeaveGroupDialog
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        userRole={userRole}
        nextAdmin={nextAdmin}
        hasExistingAdmins={hasExistingAdmins}
        hasOtherAdmins={hasOtherAdmins}
        groupName={item.name || ''}
        onConfirmLeave={confirmLeaveGroup}
        onManageAdmins={handleManageAdmins}
      />
    </>
  );
}
