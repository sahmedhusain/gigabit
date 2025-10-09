'use client'
import { ConversationResponse, Group, GroupResponse, User } from '@/lib/api'

export interface UnifiedChatItem {
  id: string | number
  type: 'private' | 'group'
  name: string
  avatar?: string | null
  lastMessage?: string
  lastMessageTime?: string
  timestamp?: string
  unread?: number
  isGroup?: boolean
  participantId?: number
  lastMessageSenderId?: number
  groupStatus?: Group['memberStatus'] | GroupResponse['member_status']
  groupPrivacy?: Group['privacy'] | GroupResponse['privacy']
  groupRole?: Group['role'] | GroupResponse['role']
  groupId?: number // Add group ID for group chats
}

/**
 * Normalize a ConversationResponse from the API into a UnifiedChatItem
 */
export function normalizeConversation(conv: ConversationResponse, currentUserId?: number): UnifiedChatItem {
  const isGroup = conv.type === 'group'
  const name = isGroup
    ? (conv.group?.title || 'Group')
    : `${conv.participant?.first_name || ''} ${conv.participant?.last_name || ''}`.trim() || 'Unknown'
  const avatar = conv.participant?.avatar ?? null
  const lastMsg = formatConversationPreview(conv, currentUserId)
  const lastMessageTime = conv.last_message?.created_at ?? conv.updated_at ?? undefined
  const unread = conv.unread_count ?? 0
  const participantId = conv.participant?.id
  const lastMessageSenderId = conv.last_message?.sender_id
  const groupStatus = conv.group?.member_status
  const groupPrivacy = conv.group?.privacy
  const groupRole = conv.group?.role

  return {
    id: conv.id,
    type: conv.type,
    name,
    avatar,
    lastMessage: lastMsg,
    lastMessageTime,
    timestamp: conv.updated_at,
    unread,
    isGroup,
    participantId,
    lastMessageSenderId: lastMessageSenderId ?? undefined,
    groupStatus,
    groupPrivacy,
    groupRole,
    groupId: conv.group?.id
  }
}

const getDisplayName = (user?: User | null): string => {
  if (!user) return ''
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim()
  if (fullName) return fullName
  if (user.nickname) return user.nickname
  if (user.email) return user.email.split('@')[0] || ''
  return ''
}

export function formatConversationPreview(conv: ConversationResponse, currentUserId?: number): string {
  const content = conv.last_message?.content?.trim()
  if (!content) return ''

  const senderId = conv.last_message?.sender_id
  const isFromCurrentUser = currentUserId && senderId === currentUserId

  // Remove any existing "You: " prefix to avoid duplication
  const cleanContent = content.replace(/^You: /, '')

  if (isFromCurrentUser) {
    return `You: ${cleanContent}`
  }

  // For private chats: show the other user's name (participant)
  if (conv.type === 'private') {
    const senderName = getDisplayName(conv.participant)
    if (senderName) return `${senderName}: ${cleanContent}`
    return `Someone: ${cleanContent}`
  }

  // For group chats: show the sender's name
  if (conv.type === 'group') {
    const senderName = getDisplayName(conv.last_message?.sender)
    if (senderName) return `${senderName}: ${cleanContent}`
    return `Someone: ${cleanContent}`
  }

  return cleanContent
}

/**
 * Normalize a Group into a UnifiedChatItem for groups that may not have conversations/messages yet.
 * Uses group's updated/created timestamps for sorting.
 */
export function normalizeGroupAsChatItem(group: Group): UnifiedChatItem {
  return {
    id: `group-fallback-${group.id}`,
    type: 'group',
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
    groupId: group.id
  }
}

/**
 * Merge chat items and groups (groups without conversation) into a single sorted array.
 * Primary sort: lastMessageTime or timestamp (newest first)
 * Secondary sort: name (alphabetical)
 */
export function mergeAndSortChats(chats: UnifiedChatItem[], groupsFallback: UnifiedChatItem[]): UnifiedChatItem[] {
  const combined = [...chats]

  // Add group fallback items only if there's no existing group conversation for the same group id/name
  groupsFallback.forEach(g => {
    const exists = combined.some(c => c.isGroup && (String(c.id) === String(g.id) || c.name === g.name))
    if (!exists) combined.push(g)
  })

  combined.sort((a, b) => {
    const aTime = a.lastMessageTime ?? a.timestamp ?? ''
    const bTime = b.lastMessageTime ?? b.timestamp ?? ''

    const aT = aTime ? new Date(aTime).getTime() : 0
    const bT = bTime ? new Date(bTime).getTime() : 0

    if (aT !== bT) return bT - aT
    return a.name.localeCompare(b.name)
  })

  return combined
}
