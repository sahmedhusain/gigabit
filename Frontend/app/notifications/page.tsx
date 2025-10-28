'use client';

import { useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useWebSocket } from '@/context/WebSocketContext';
import { useToast } from '@/context/ToastContext';
import { useNotifications } from '@/hooks';


import AppLayout from '@/components/layout/AppLayout';


import NotificationsPage from '@/components/notifications/NotificationsPage';

function NotificationsPageComponent() {
  const { user } = useAuth();
  const { } = useWebSocket();
  const { } = useToast();
  const { } = useNotifications();

  
  useEffect(() => {
    
  }, [user]);

  return (
    <AppLayout activeTab="notifications">
      <NotificationsPage />
    </AppLayout>
  );
}


function ProtectedNotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsPageComponent />
    </ProtectedRoute>
  );
}

export default ProtectedNotificationsPage;
