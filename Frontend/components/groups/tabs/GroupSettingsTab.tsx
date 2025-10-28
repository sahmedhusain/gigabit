'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { Crown, Shield, User } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { useConnectionStatus, useUpload } from '@/hooks'
import { api, Member, User as UserType, GroupResponse } from '@/lib/api'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { GroupSettingsTabProps } from '@/types/groups'
import GroupMembersTab from '../settings/GroupMembersTab'
import GroupPrivacyTab from '../settings/GroupPrivacyTab'
import GroupRequestsTab from '../settings/GroupRequestsTab'
import GroupDangerTab from '../settings/GroupDangerTab'
import GroupEditModal from '../settings/GroupEditModal'
import GroupSettingsHeader from '../settings/GroupSettingsHeader'
import GroupSettingsTabs from '../settings/GroupSettingsTabs'
import GroupInviteModal from '../settings/GroupInviteModal'
import GroupRoleModal from '../settings/GroupRoleModal'
import GroupRemoveModal from '../settings/GroupRemoveModal'

const GroupSettingsTab: React.FC<GroupSettingsTabProps> = ({ groupId }) => {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [activeTab, setActiveTab] = useState<'members' | 'privacy' | 'requests' | 'danger'>('members')
  const [groupInfo, setGroupInfo] = useState<GroupResponse | null>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sentRequests, setSentRequests] = useState<Member[]>([])
  const [receivedRequests, setReceivedRequests] = useState<Member[]>([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const { user } = useAuth()
  const { success, error: toastError } = useToast()
  useConnectionStatus()
  useUpload()

  // Confirmation modals
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<{
    type: 'promote' | 'demote' | 'remove'
    memberId: number
    memberName: string
  } | null>(null)

  
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setIsLoading(true)
        const [membersResponse, groupResponse, roleResponse] = await Promise.all([
          api.getGroupMembers(groupId),
          api.getGroup(groupId),
          api.getUserRole(groupId)
        ])
        setMembers(membersResponse.members)
        setGroupInfo(groupResponse)
        setUserRole(roleResponse.role)
      } catch (error) {
        console.error('Failed to fetch group data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchGroupData()
  }, [groupId])

  
  const handleUpdatePrivacy = async (privacy: 'public' | 'private') => {
    try {
      await api.updateGroupPrivacy(groupId, privacy)
      setGroupInfo((prev: GroupResponse | null) => prev ? { ...prev, privacy } : null)
      success('Group privacy updated!')
    } catch (error) {
      console.error('Failed to update group privacy:', error)
      toastError('Failed to update group privacy')
    }
  }

  
  const handleUpdatePermissions = async (permissions: { create_posts: 'all_members' | 'admins_only'; create_polls: 'all_members' | 'admins_only'; create_events: 'all_members' | 'admins_only'; send_messages: 'all_members' | 'admins_only' }) => {
    try {
      await api.updateGroupPermissions(groupId, permissions)
      setGroupInfo((prev: GroupResponse | null) => prev ? { ...prev, ...permissions } : null)
      success('Group permissions updated!')
    } catch (error) {
      console.error('Failed to update group permissions:', error)
      toastError('Failed to update group permissions')
    }
  }

  
  const handleDeleteGroup = async () => {
    setIsDeleting(true)
    try {
      await api.deleteGroup(groupId)
      success('Group deleted!')
      window.location.href = '/groups'
    } catch (error) {
      console.error('Failed to delete group:', error)
      toastError('Failed to delete group')
      setIsDeleting(false)
    }
  }

  
  const handleKickMember = async (userId: number) => {
    try {
      await api.kickMember(groupId, userId)
      setMembers(members.filter(member => member.user.id !== userId))
      success('Member removed!')
    } catch (error) {
      console.error('Failed to kick member:', error)
      toastError('Failed to remove member')
    }
  }

  
  const handleRespondToRequest = async (userId: number, action: 'accept' | 'decline') => {
    try {
      await api.respondToJoinRequest(groupId, userId, action)
      success(`Join request ${action}ed!`)
      fetchJoinRequests()
    } catch (error) {
      console.error('Failed to respond to request:', error)
      toastError(`Failed to ${action} join request`)
    }
  }

  const isAdmin = userRole === 'admin' || userRole === 'creator'

  
  const fetchJoinRequests = useCallback(async () => {
    try {
      const [sentResponse, receivedResponse] = await Promise.all([
        api.getSentJoinRequests(groupId),
        api.getReceivedJoinRequests(groupId)
      ])
      setSentRequests(sentResponse.requests || [])
      setReceivedRequests(receivedResponse.requests || [])
    } catch (error) {
      console.error('Failed to fetch join requests:', error)
      
      setSentRequests([])
      setReceivedRequests([])
    }
  }, [groupId])

  
  useEffect(() => {
    if (activeTab === 'requests' && isAdmin) {
      fetchJoinRequests()
    }
  }, [activeTab, isAdmin, fetchJoinRequests])

  
  const formatJoinDate = (dateString?: string) => {
    if (!dateString) return 'Recently joined'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }  
  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'creator':
        return <Crown className="w-4 h-4 text-yellow-400" />
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-400" />
      default:
        return <User className="w-4 h-4 text-gray-400" />
    }
  }

  
  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'creator':
        return 'Creator'
      case 'admin':
        return 'Admin'
      default:
        return 'Member'
    }
  }

  
  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'creator':
        return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30'
      case 'admin':
        return 'text-blue-400 bg-blue-400/20 border-blue-400/30'
      default:
        return 'text-gray-400 bg-gray-400/20 border-gray-400/30'
    }
  }

  
  const handleUpdateRole = async (memberId: number, newRole: string) => {
    try {
      await api.updateMemberRole(groupId, memberId, newRole as 'admin' | 'member')
      setMembers(members.map(member => 
        member.user.id === memberId ? { ...member, role: newRole } : member
      ))
      success(`Member role updated to ${newRole}!`)
    } catch (error) {
      console.error('Failed to update member role:', error)
      toastError('Failed to update member role')
    }
  }


  
  const canManageMember = (member: Member) => {
    if (member.user.id === user?.id) return false 
    if (member.role === 'creator') return false 
    return true
  }

  
  const handleCancelInvitation = async (invitationId: number) => {
    try {
      await api.cancelInvitation(groupId, invitationId)
      success('Invitation cancelled!')
      
      fetchJoinRequests()
    } catch (error) {
      console.error('Failed to cancel invitation:', error)
      toastError('Failed to cancel invitation. Please try again.')
    }
  }

  const fetchInvitableUsers = useCallback(async (search: string = '') => {
    try {
      setIsLoadingUsers(true)
      const response = await api.getInvitableUsers(groupId, search)
      const users = response.users || []
      setFilteredUsers(users)
      return users
    } catch (error) {
      console.error('Failed to fetch invitable users:', error)
      toastError('Failed to load users. Please try again.')
      setFilteredUsers([])
      return []
    } finally {
      setIsLoadingUsers(false)
    }
  }, [groupId, toastError])

  
  const handleSearchUsers = useCallback(async (term: string) => {
    setSearchTerm(term)
    await fetchInvitableUsers(term)
  }, [fetchInvitableUsers])

  // Handle user selection
  const handleUserSelect = (userId: number) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId)
      } else {
        return [...prev, userId]
      }
    })
  }

  // Handle invite multiple users
  const handleInviteMultipleUsers = async () => {
    if (selectedUsers.length === 0) {
      toastError('Please select at least one user to invite')
      return
    }

    try {
      setIsInviting(true)
      await api.inviteUsersToGroup(groupId, selectedUsers)
      
      success(`Invitations sent to ${selectedUsers.length} ${selectedUsers.length === 1 ? 'user' : 'users'}!`)
      
      
      setSelectedUsers([])
      setShowInviteModal(false)
      
      
      fetchJoinRequests()
    } catch (error) {
      console.error('Failed to invite users:', error)
      toastError('Failed to send invitations. Please try again.')
    } finally {
      setIsInviting(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <GroupSettingsHeader
        isAdmin={isAdmin}
        onEditClick={() => setShowEditModal(true)}
      />

      {/* Tabs */}
      <GroupSettingsTabs
        activeTab={activeTab}
        isAdmin={isAdmin}
        receivedRequestsCount={receivedRequests.length}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Members Tab */}
          {activeTab === 'members' && (
            <GroupMembersTab
              members={members}
              isLoading={isLoading}
              isAdmin={isAdmin}
              user={user}
              onInviteClick={async () => {
                setShowInviteModal(true)
                await fetchInvitableUsers()
              }}
              onPromoteMember={(memberId, memberName) => {
                setPendingAction({
                  type: 'promote',
                  memberId,
                  memberName
                })
                setShowRoleModal(true)
              }}
              onDemoteMember={(memberId, memberName) => {
                setPendingAction({
                  type: 'demote',
                  memberId,
                  memberName
                })
                setShowRoleModal(true)
              }}
              onRemoveMember={(memberId, memberName) => {
                setPendingAction({
                  type: 'remove',
                  memberId,
                  memberName
                })
                setShowRemoveModal(true)
              }}
              formatJoinDate={formatJoinDate}
              getRoleIcon={getRoleIcon}
              getRoleLabel={getRoleLabel}
              getRoleColor={getRoleColor}
              canManageMember={canManageMember}
            />
          )}

          {/* Privacy & Permissions Tab */}
          {activeTab === 'privacy' && isAdmin && (
            <GroupPrivacyTab
              groupInfo={groupInfo}
              isAdmin={isAdmin}
              onUpdatePrivacy={handleUpdatePrivacy}
              onUpdatePermissions={handleUpdatePermissions}
            />
          )}

          {/* Join Requests Tab */}
          {activeTab === 'requests' && isAdmin && (
            <GroupRequestsTab
              isAdmin={isAdmin}
              receivedRequests={receivedRequests}
              sentRequests={sentRequests}
              onRespondToRequest={handleRespondToRequest}
              onCancelInvitation={handleCancelInvitation}
              formatJoinDate={formatJoinDate}
            />
          )}

          {/* Danger Zone Tab */}
          {activeTab === 'danger' && userRole === 'creator' && (
            <GroupDangerTab
              userRole={userRole}
              groupTitle={groupInfo?.title || ''}
              memberCount={members.length}
              onDeleteGroup={handleDeleteGroup}
              isDeleting={isDeleting}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Invite Modal */}
      <GroupInviteModal
        show={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        groupTitle={groupInfo?.title || ''}
        allUsers={filteredUsers}
        filteredUsers={filteredUsers}
        searchTerm={searchTerm}
        selectedUsers={selectedUsers}
        isInviting={isInviting}
        isLoading={isLoadingUsers}
        onSearchUsers={handleSearchUsers}
        onUserSelect={handleUserSelect}
        onInviteUsers={handleInviteMultipleUsers}
      />

      {/* Edit Group Info Modal */}
      <GroupEditModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        group={groupInfo ? {
          id: groupInfo.id,
          title: groupInfo.title,
          description: groupInfo.description || '',
          is_private: groupInfo.privacy === 'private',
          avatar: groupInfo.avatar,
          member_count: groupInfo.member_count
        } : null}
        onUpdateSuccess={() => {
          
          const fetchUpdatedGroup = async () => {
            try {
              const groupResponse = await api.getGroup(groupId)
              setGroupInfo(groupResponse)
            } catch (error) {
              console.error('Failed to refresh group data:', error)
              toastError('Group updated but failed to refresh data. Please refresh the page.')
            }
          }
          fetchUpdatedGroup()
        }}
      />

      {/* Role Change Confirmation Modal */}
      <GroupRoleModal
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false)
          setPendingAction(null)
        }}
        pendingAction={pendingAction && (pendingAction.type === 'promote' || pendingAction.type === 'demote') ? {
          type: pendingAction.type,
          memberName: pendingAction.memberName
        } : null}
        onConfirm={() => {
          if (pendingAction) {
            handleUpdateRole(pendingAction.memberId, pendingAction.type === 'promote' ? 'admin' : 'member')
            setShowRoleModal(false)
            setPendingAction(null)
          }
        }}
      />

      {/* Remove Member Confirmation Modal */}
      <GroupRemoveModal
        isOpen={showRemoveModal}
        onClose={() => {
          setShowRemoveModal(false)
          setPendingAction(null)
        }}
        pendingAction={pendingAction && pendingAction.type === 'remove' ? {
          type: pendingAction.type,
          memberName: pendingAction.memberName
        } : null}
        onConfirm={() => {
          if (pendingAction) {
            handleKickMember(pendingAction.memberId)
            setShowRemoveModal(false)
            setPendingAction(null)
          }
        }}
      />
    </div>
  )
}

export default GroupSettingsTab