"use client";
import { ConversationResponse, Group, GroupResponse, User } from "@/lib/api";
import { ChatItem } from "@/types/chat";

export interface UnifiedChatItem {
  id: string | number;
  type: "private" | "group";
  name: string;
  avatar?: string | null;
  lastMessage?: string;
  lastMessageType?: string;
  lastMessageTime?: string;
  timestamp?: string;
  unread?: number;
  isGroup?: boolean;
  participantId?: number;
  lastMessageSenderId?: number;
  groupStatus?: Group["memberStatus"] | GroupResponse["member_status"];
  groupPrivacy?: Group["privacy"] | GroupResponse["privacy"];
  groupRole?: Group["role"] | GroupResponse["role"];
  groupId?: number;
  joinedAt?: string;
}

export function normalizeConversation(conv: any, currentUserId?: number): UnifiedChatItem {
  const isGroup = conv.type === "group";
  const name = isGroup
    ? conv.group?.title || conv.group?.Title || "Group"
    : `${conv.participant?.first_name || conv.participant?.FirstName || ""} ${
        conv.participant?.last_name || conv.participant?.LastName || ""
      }`.trim() || "Unknown";
  const avatar = isGroup
    ? conv.group?.avatar || conv.group?.Avatar || null
    : conv.participant?.avatar || conv.participant?.Avatar || null;
  const lastMsg = conv.last_message?.content || conv.LastMessage || "";
  const lastMessageType = conv.last_message_type || conv.LastMessageType || "";
  const lastMessageTime =
    conv.last_message?.created_at || conv.LastMessageTime || "";
  const unread = conv.unread_count ?? conv.UnreadCount ?? 0;
  const participantId = conv.participant?.id || conv.participant?.ID;
  const lastMessageSenderId =
    conv.last_message?.sender_id ||
    conv.last_message?.sender?.id ||
    conv.LastMessageSender?.ID;
  const groupStatus = conv.group?.member_status || conv.group?.MemberStatus;
  const groupPrivacy = conv.group?.privacy || conv.group?.Privacy;
  const groupRole = conv.group?.role || conv.group?.Role;

  // Find current user's join time for groups
  let joinedAt: string | undefined;
  if (isGroup && currentUserId && conv.group?.members) {
    const currentUserMember = conv.group.members.find((member: any) => member.user?.id === currentUserId || member.user?.ID === currentUserId);
    if (currentUserMember) {
      joinedAt = currentUserMember.joined_at || currentUserMember.JoinedAt;
    }
  }

  return {
    id: conv.id || conv.ID,
    type: conv.type || conv.Type,
    name,
    avatar,
    lastMessage: lastMsg,
    lastMessageType,
    lastMessageTime,
    timestamp: conv.updated_at || conv.LastMessageTime || conv.UpdatedAt,
    unread,
    isGroup,
    participantId,
    lastMessageSenderId: lastMessageSenderId ?? undefined,
    groupStatus,
    groupPrivacy,
    groupRole,
    groupId: conv.group?.id || conv.group?.ID,
    joinedAt,
  };
}

const getDisplayName = (user?: User | null): string => {
  if (!user) return "";
  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
  if (fullName) return fullName;
  if (user.nickname) return user.nickname;
  if (user.email) return user.email.split("@")[0] || "";
  return "";
};

export function formatConversationPreview(
  conv: ConversationResponse,
  currentUserId?: number
): string {
  return conv.last_message?.content?.trim() || "";
}

export function normalizeGroupAsChatItem(group: Group): UnifiedChatItem {
  return {
    id: `group-fallback-${group.id}`,
    type: "group",
    name: group.name ?? `Group ${group.id}`,
    avatar: undefined,
    lastMessage: undefined,
    lastMessageTime: group.timestamp ?? group.lastActivity ?? undefined,
    timestamp: group.timestamp ?? group.lastActivity ?? undefined,
    unread: 0,
    isGroup: true,
    participantId: undefined,
    groupStatus: group.memberStatus,
    groupPrivacy: group.privacy,
    groupRole: group.role,
    groupId: group.id,
  };
}

export function mergeAndSortChats(
  chats: UnifiedChatItem[],
  groupsFallback: UnifiedChatItem[]
): UnifiedChatItem[] {
  const combined = [...chats];

  groupsFallback.forEach((g) => {
    const exists = combined.some(
      (c) => c.isGroup && (String(c.id) === String(g.id) || c.name === g.name)
    );
    if (!exists) combined.push(g);
  });

  combined.sort((a, b) => {
    const aTime = a.lastMessageTime ?? a.timestamp ?? "";
    const bTime = b.lastMessageTime ?? b.timestamp ?? "";

    const aT = aTime ? new Date(aTime).getTime() : 0;
    const bT = bTime ? new Date(bTime).getTime() : 0;

    if (aT !== bT) return bT - aT;
    return a.name.localeCompare(b.name);
  });

  return combined;
}



export const parseTimestamp = (timestamp: string | number | undefined | null): number => {
  if (!timestamp) return 0;
  if (typeof timestamp === 'number') {
    
    if (timestamp > 1e11) return timestamp; 
    return timestamp * 1000; 
  }
  
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? 0 : date.getTime();
};

export const sortChatsByLastMessage = (chats: UnifiedChatItem[]): UnifiedChatItem[] => {
  return chats.sort((a, b) => {
    
    const aLastMessageTime = parseTimestamp(a.lastMessageTime || a.timestamp);
    const bLastMessageTime = parseTimestamp(b.lastMessageTime || b.timestamp);

    
    if (aLastMessageTime > 0 && bLastMessageTime > 0) {
      return bLastMessageTime - aLastMessageTime;
    }

    
    if (aLastMessageTime > 0 && bLastMessageTime === 0) return -1;
    if (bLastMessageTime > 0 && aLastMessageTime === 0) return 1;

    
    return bLastMessageTime - aLastMessageTime;
  });
};

export const filterUniqueChats = (chats: UnifiedChatItem[]): UnifiedChatItem[] => {
  return chats.filter((chat, index, self) =>
    self.findIndex(c => c.id === chat.id) === index
  );
};

export const calculateChatStats = (
  chats: UnifiedChatItem[],
  searchResultsLength: number,
  searchQuery: string,
  getUserStatus: (userId: number) => string
) => {
  if (searchQuery.trim() && searchResultsLength > 0) {
    return {
      online: 0, 
      total: searchResultsLength,
      unread: 0 
    };
  }

  const uniqueChats = filterUniqueChats(chats);
  return {
    online: uniqueChats.filter(chat => chat.type === 'private' && chat.participantId && getUserStatus(chat.participantId) !== 'offline').length,
    total: uniqueChats.length,
    unread: uniqueChats.filter(chat => (chat.unread || 0) > 0).length
  };
};

export const getChatIdNumber = (chat: ChatItem | UnifiedChatItem): number => {
  const id = chat.id;
  if (typeof id === 'string') {
    return parseInt(id.replace(/\D/g, '')) || 0;
  }
  return id || 0;
};

export const findChatById = (chats: (ChatItem | UnifiedChatItem)[], conversationId: number): ChatItem | UnifiedChatItem | undefined => {
  return chats.find(c => {
    const chatIdNum = getChatIdNumber(c);
    return chatIdNum === conversationId;
  });
};

export const getTypingKey = (chat: ChatItem, currentUserId?: number): string | null => {
  // For groups, look up by group key
  if (chat.groupId) {
    return `group_${chat.groupId}`;
  }
  // For private chats, calculate the key
  if (chat.participantId && currentUserId) {
    return String(Math.min(chat.participantId, currentUserId) * 1000000 + Math.max(chat.participantId, currentUserId));
  }
  return null;
};

// Chat utility functions

// Parse various timestamp formats robustly: ISO strings, milliseconds, or seconds
export const parseDate = (value: string | number | undefined | null): Date => {
  if (!value && value !== 0) return new Date(0)
  const raw = typeof value === 'number' ? value : String(value).trim()

  if (/^\d+$/.test(String(raw))) {
    const n = Number(raw)
    
    const asMs = new Date(n)
    if (asMs.getFullYear() >= 2000) return asMs

    
    const asSeconds = new Date(n * 1000)
    if (asSeconds.getFullYear() >= 2000) return asSeconds

    
    const asMicros = new Date(Math.floor(n / 1000))
    if (asMicros.getFullYear() >= 2000) return asMicros

    
    if (asSeconds.getTime() !== 0) return asSeconds
    
    console.warn('parseDate: suspicious numeric date value', value, '->', asMs)
    return asMs
  }

  
  const d = new Date(String(raw))
  if (isNaN(d.getTime())) {
    
    console.warn('parseDate: failed to parse date', value)
    return new Date(0)
  }
  return d
}

export const formatLastOnlineTime = (lastStatusChange: string | number | undefined | null): string => {
  const date = parseDate(lastStatusChange)
  const now = new Date()

  
  const dateDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayDate = new Date(todayDate)
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)

  let timeString = ''
  if (dateDate.getTime() === todayDate.getTime()) {
    timeString = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  } else if (dateDate.getTime() === yesterdayDate.getTime()) {
    timeString = `yesterday ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}`
  } else {
    timeString = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return `last seen ${timeString}`
};

/**
 * Parse a conversation ID which may be prefixed (e.g., "private_123", "group_456")
 * Returns the numeric ID and the type
 */
export const parseConversationId = (id: string | number): { numericId: number; type: 'private' | 'group' | null } => {
  if (typeof id === 'number') {
    return { numericId: id, type: null };
  }
  
  const str = String(id);
  
  // Check if it's prefixed with "private_" or "group_"
  if (str.startsWith('private_')) {
    const numericId = parseInt(str.replace('private_', ''));
    return { numericId: isNaN(numericId) ? 0 : numericId, type: 'private' };
  }
  
  if (str.startsWith('group_')) {
    const numericId = parseInt(str.replace('group_', ''));
    return { numericId: isNaN(numericId) ? 0 : numericId, type: 'group' };
  }
  
  // If no prefix, try to parse as number
  const numericId = parseInt(str.replace(/\D/g, ''));
  return { numericId: isNaN(numericId) ? 0 : numericId, type: null };
};

/**
 * Find a chat by conversation ID, properly handling prefixed IDs
 * This handles the case where backend returns "private_1", "group_1" but
 * we might be searching with just numeric IDs
 */
export const findChatByConversationId = (
  chats: (ChatItem | UnifiedChatItem)[],
  conversationId: string | number,
  type?: 'private' | 'group'
): ChatItem | UnifiedChatItem | undefined => {
  const parsed = parseConversationId(conversationId);
  
  return chats.find(chat => {
    const chatParsed = parseConversationId(chat.id);
    
    // Match by numeric ID and type if available
    const idsMatch = chatParsed.numericId === parsed.numericId;
    
    // If type is specified or can be inferred, check it
    if (type) {
      return idsMatch && chat.type === type;
    }
    
    if (parsed.type) {
      return idsMatch && chat.type === parsed.type;
    }
    
    // If no type specified, just match by numeric ID (could be ambiguous!)
    return idsMatch;
  });
};

/**
 * Get the numeric conversation ID from a chat object
 * Handles both prefixed string IDs and numeric IDs
 */
export const getConversationNumericId = (chat: ChatItem | UnifiedChatItem): number => {
  const parsed = parseConversationId(chat.id);
  return parsed.numericId;
};
