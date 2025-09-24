'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useWebSocket } from '@/context/WebSocketContext';
import { useToast } from '@/context/ToastContext';
import { useNotifications } from '@/hooks';
import { api, User, Post } from '@/lib/api';

// Import dashboard components
import TopBar from '@/components/dashboard/TopBar';
import Sidebar from '@/components/dashboard/Sidebar';
import RightSidebar from '@/components/dashboard/RightSidebar';
import ProfileSection from '@/components/dashboard/ProfileSection';

export default function ProfilePage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { isConnected, onlineUsers } = useWebSocket();
  const { error } = useToast();
  const { items: liveNotifications, unread: liveUnreadCount } = useNotifications();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Profile data state
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Current User Processing for sidebars
  const currentUserData = currentUser ? {
    id: currentUser.id,
    name: `${currentUser.first_name} ${currentUser.last_name}`,
    username: currentUser.nickname || currentUser.email.split('@')[0],
    avatar: currentUser.avatar,
    isPrivate: currentUser.is_private,
    email: currentUser.email,
    firstName: currentUser.first_name,
    lastName: currentUser.last_name,
    dateOfBirth: currentUser.date_of_birth,
    nickname: currentUser.nickname,
    aboutMe: currentUser.about_me,
    memberSince: currentUser.created_at,
    followers: 0,
    following: 0
  } : null;

  // Trending topics
  const trendingTopics = [
    '#SocialNetwork', '#TechNews', '#WebDev', '#AI', '#Startups',
    '#React', '#TypeScript', '#NodeJS', '#Python', '#DevOps'
  ];

  // Fetch profile data when component loads
  useEffect(() => {
    if (currentUser) {
      fetchUserProfile(currentUser.id);
    }
  }, [currentUser]);

  const fetchUserProfile = async (userId: number) => {
    try {
      setIsLoading(true);
      console.log('Fetching profile for current user:', userId);

      // Get basic profile info
      const profileData = await api.getProfile(userId);
      setProfileUser(profileData);

      // Get additional data
      const [postsResponse, followersResponse, followingResponse] = await Promise.allSettled([
        api.getUserPosts(userId),
        api.getFollowers(userId),
        api.getFollowing(userId)
      ]);

      if (postsResponse.status === 'fulfilled') {
        const postsArr = Array.isArray(postsResponse.value) ? postsResponse.value : [];
        const mappedPosts = postsArr.map((post: any) => ({
          id: post.id,
          user: {
            name: `${post.user.first_name} ${post.user.last_name}`,
            username: post.user.nickname || post.user.email.split('@')[0],
            avatar: post.user.avatar
          },
          content: post.content,
          image: post.image_url ?
            (post.image_url.startsWith('http') ?
              post.image_url :
              `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${post.image_url}`
            ) : undefined,
          likes: post.like_count,
          comments: post.comment_count,
          shares: 0,
          timeAgo: formatTimeAgo(post.created_at),
          privacy: post.privacy,
          isLiked: post.is_liked
        }));
        setUserPosts(mappedPosts);
      }

      if (followersResponse.status === 'fulfilled') {
        setFollowers(Array.isArray(followersResponse.value?.followers) ? followersResponse.value.followers : []);
      }

      if (followingResponse.status === 'fulfilled') {
        setFollowing(Array.isArray(followingResponse.value?.following) ? followingResponse.value.following : []);
      }

    } catch (err) {
      console.error('Error fetching profile:', err);
      error('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  };

  const handleTabChange = (newTab: string) => {
    router.push(`/${newTab}`);
  };

  const handleNotificationsToggle = () => {
    router.push('/notifications');
  };

  const handleSearchToggle = () => {
    router.push('/search');
  };

  const handleDiscoverToggle = () => {
    router.push('/discover');
  };

  if (!currentUser) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800 flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        <Sidebar
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          activeTab="profile"
          setActiveTab={handleTabChange}
          feedSubTab="all"
          setFeedSubTab={() => {}}
          activitySubTab="liked"
          setActivitySubTab={() => {}}
          chatSubTab="all"
          setChatSubTab={() => {}}
          chatUnreadAll={0}
          chatUnreadDirect={0}
          chatUnreadGroups={0}
          fetchEvents={() => {}}
          currentUser={currentUserData}
          logout={() => router.push('/login')}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />

        <TopBar
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          activeTab="profile"
          setActiveTab={handleTabChange}
          onNotificationsClick={handleNotificationsToggle}
          unreadCount={liveUnreadCount || 0}
          onSearchClick={handleSearchToggle}
          onDiscoverClick={handleDiscoverToggle}
        />

        {/* Main Content */}
        <div className={`main-content-layout p-2 lg:p-4 relative z-10 has-fixed-sidebar ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <div className="max-w-7xl mx-auto h-full">
            <div className="flex flex-col lg:flex-row gap-6 h-full">
              {/* Main Content Area */}
              <div className="flex-1 min-w-0 h-full">
                <ProfileSection
                  currentUser={profileUser ? {
                    id: profileUser.id,
                    name: `${profileUser.first_name} ${profileUser.last_name}`,
                    username: profileUser.nickname || profileUser.email.split('@')[0],
                    avatar: profileUser.avatar,
                    isPrivate: profileUser.is_private,
                    email: profileUser.email,
                    firstName: profileUser.first_name,
                    lastName: profileUser.last_name,
                    dateOfBirth: profileUser.date_of_birth,
                    nickname: profileUser.nickname,
                    aboutMe: profileUser.about_me,
                    memberSince: profileUser.created_at
                  } : null}
                  followers={followers}
                  following={following}
                  posts={userPosts}
                  isLoadingFollowers={isLoading}
                  isOwnProfile={true}
                  showPrivacyOverlay={false}
                  isFollowing={false}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Right Sidebar */}
        <RightSidebar
          onlineUsers={onlineUsers}
          followingUsers={following}
          followersUsers={followers}
          trendingTopics={trendingTopics}
          onUserClick={(user) => {
            router.push(`/profile/${user.id}`);
          }}
          currentUser={currentUserData}
          setActiveTab={handleTabChange}
          logout={() => router.push('/login')}
        />
      </div>
    </ProtectedRoute>
  );
}