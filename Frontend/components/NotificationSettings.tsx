'use client';

import { Bell } from 'lucide-react';

export default function NotificationSettings() {
  return (
    <div>
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
          <Bell className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">Notification Settings</h2>
      </div>

      <div className="text-center py-12">
        <div className="p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl inline-block mb-6">
          <Bell className="mx-auto h-12 w-12 text-white/60" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-3">Coming Soon</h3>
        <p className="text-white/70 max-w-md mx-auto">
          Notification settings will be available in a future update. You&apos;ll be able to customize how and when you receive notifications about posts, comments, follows, and more.
        </p>
      </div>
    </div>
  );
}