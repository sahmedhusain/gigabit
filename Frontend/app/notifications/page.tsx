'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useWebSocket } from '@/context/WebSocketContext';
import { useToast } from '@/context/ToastContext';
import { useNotifications } from '@/hooks';
import {
  api,
  NetworkError
} from '@/lib/api';

// Import AppLayout instead of individual components
import AppLayout from '@/components/AppLayout';

// Import dashboard components
import NotificationsPage from '@/components/dashboard/NotificationsPage';

function NotificationsPageComponent() {
  const router = useRouter();
  const { user } = useAuth();
  const { isConnected, onlineUsers } = useWebSocket();
  const { success, error } = useToast();
  const { items: liveNotifications, unread: liveUnreadCount } = useNotifications();

  // Fetch data when component loads
  useEffect(() => {
    // Notifications are handled by the useNotifications hook
  }, [user]);

  const handleTabChange = (newTab: string) => {
    router.push(`/${newTab}`);
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <AppLayout activeTab="notifications">
      <NotificationsPage />
    </AppLayout>
  );
}

// Wrap the entire component with ProtectedRoute
function ProtectedNotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsPageComponent />
    </ProtectedRoute>
  );
}

export default ProtectedNotificationsPage;
