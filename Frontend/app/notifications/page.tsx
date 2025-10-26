'use client';

import { useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useWebSocket } from '@/context/WebSocketContext';
import { useToast } from '@/context/ToastContext';
import { useNotifications } from '@/hooks';

// Import AppLayout instead of individual components
import AppLayout from '@/components/layout/AppLayout';

// Import dashboard components
import NotificationsPage from '@/components/notifications/NotificationsPage';

function NotificationsPageComponent() {
  const { user } = useAuth();
  const { } = useWebSocket();
  const { } = useToast();
  const { } = useNotifications();

  // Fetch data when component loads
  useEffect(() => {
    // Notifications are handled by the useNotifications hook
  }, [user]);

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
