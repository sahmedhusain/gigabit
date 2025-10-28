import { api } from '@/lib/api'
import { ChatItem } from '@/types/chat'
import { UnifiedChatItem } from '@/utils/chatUtils'
import { mutate } from 'swr'
import { findChatById } from './chatUtils'



export const handleDeleteConversation = async (conversationId: number) => {
  try {
    await api.deleteConversation(conversationId)
    mutate('chats')
  } catch (error) {
    console.error('Failed to delete conversation:', error)
  }
}

export const handleMarkAsRead = async (
  conversationId: number,
  chats: (ChatItem | UnifiedChatItem)[]
) => {
  try {
    const chat = findChatById(chats, conversationId);
    if (!chat) return

    const conversationType = chat.type === 'group' ? 'group' : 'private';

    if (conversationId <= 0) {
      
      return;
    }

    await api.markConversationAsRead(conversationId, conversationType);

    
    mutate('chats', (current: ChatItem[] | { conversations: ChatItem[] } | undefined) => {
      if (!current) return current
      const updated = Array.isArray(current) ? current : current.conversations
      if (!Array.isArray(updated)) return current
      const next = updated.map((c: ChatItem) => {
        let cIdNum = 0;
        if (c?.id) {
          if (typeof c.id === 'string') {
            cIdNum = parseInt(String(c.id).replace(/\D/g, ''));
          } else if (typeof c.id === 'number') {
            cIdNum = c.id;
          }
        }
        return cIdNum === conversationId ? { ...c, unread_count: 0 } : c;
      });
      return Array.isArray(current) ? next : { ...current, conversations: next }
    }, false)

    
    mutate('chats')
  } catch (error) {
    console.error('Failed to mark messages as read:', error)
  }
}

export const handleMarkAsUnread = async (
  conversationId: number,
  chats: (ChatItem | UnifiedChatItem)[]
) => {
  try {
    const chat = findChatById(chats, conversationId);
    if (!chat) return

    const conversationType = chat.type === 'group' ? 'group' : 'private';

    if (conversationId <= 0) {
      
      return;
    }

    await api.markConversationAsUnread(conversationId, conversationType);

    
    mutate('chats', (current: ChatItem[] | { conversations: ChatItem[] } | undefined) => {
      if (!current) return current
      const updated = Array.isArray(current) ? current : current.conversations
      if (!Array.isArray(updated)) return current
      const next = updated.map((c: ChatItem) => {
        let cIdNum = 0;
        if (c?.id) {
          if (typeof c.id === 'string') {
            cIdNum = parseInt(String(c.id).replace(/\D/g, ''));
          } else if (typeof c.id === 'number') {
            cIdNum = c.id;
          }
        }
        return cIdNum === conversationId ? { ...c, unread_count: 1, has_unread: true } : c;
      });
      return Array.isArray(current) ? next : { ...current, conversations: next }
    }, false)

    
    setTimeout(() => mutate('chats'), 500)
  } catch (error) {
    console.error('Failed to mark messages as unread:', error)
  }
}

export const handleShowInfo = (
  conversationId: number,
  type: 'private' | 'group',
  chats: (ChatItem | UnifiedChatItem)[],
  onChatClick: (chat: { conversationId: number; type: 'private' | 'group'; name: string; participantId?: number; groupId?: number; initialTab?: string; highlightMessageId?: number }) => void
) => {
  const chat = findChatById(chats, conversationId);
  if (chat) {
    onChatClick({
      conversationId,
      type,
      name: chat.name || 'Unknown',
      participantId: chat.participantId,
      groupId: chat.groupId,
      initialTab: 'info'
    })
  }
}

export const handleLeaveGroup = async (groupId: number) => {
  try {
    await api.leaveGroup(groupId)
    mutate('chats')
  } catch (error) {
    console.error('Failed to leave group:', error)
  }
}

export const handleShowSettings = (
  conversationId: number,
  type: 'private' | 'group',
  chats: (ChatItem | UnifiedChatItem)[],
  onChatClick: (chat: { conversationId: number; type: 'private' | 'group'; name: string; participantId?: number; groupId?: number; initialTab?: string; highlightMessageId?: number }) => void
) => {
  const chat = findChatById(chats, conversationId);
  if (chat) {
    onChatClick({
      conversationId,
      type,
      name: chat.name || 'Unknown',
      participantId: chat.participantId,
      groupId: chat.groupId,
      initialTab: 'settings'
    })
  }
}

export const handleToggleMute = async (
  conversationId: number,
  chats: (ChatItem | UnifiedChatItem)[],
  mutedConversations: number[],
  setMutedConversations: (conversations: number[]) => void
) => {
  try {
    const isCurrentlyMuted = mutedConversations.includes(conversationId)
    const newMutedConversations = isCurrentlyMuted
      ? mutedConversations.filter(id => id !== conversationId)
      : [...mutedConversations, conversationId]

    
    setMutedConversations(newMutedConversations)

    
    const conversation = findChatById(chats, conversationId);

    if (!conversation) {
      
      return;
    }

    
    const apiMutedConversations = newMutedConversations.map(id => {
      const conv = findChatById(chats, id);
      return {
        id,
        type: conv?.type || 'private'
      };
    });

    
    await api.updateNotificationSettings({
      sound_enabled: true,
      sound_theme: 'classic',
      browser_push_enabled: true,
      quiet_hours_enabled: false,
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00',
      muted_conversations: apiMutedConversations
    })
  } catch (error) {
    console.error('Failed to toggle mute status:', error)
    
    setMutedConversations(mutedConversations)
  }
}