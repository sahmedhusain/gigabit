'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import ProfileSettings from '@/components/ProfileSettings';
import AccountSettings from '@/components/AccountSettings';
import PrivacySettings from '@/components/PrivacySettings';
import NotificationSettings from '@/components/NotificationSettings';
import { Settings, User, Shield, Lock, Bell } from 'lucide-react';

function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      description: 'Update your personal information',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      id: 'account',
      label: 'Account',
      icon: Shield,
      description: 'Manage your account security',
      color: 'from-red-500 to-pink-600'
    },
    {
      id: 'privacy',
      label: 'Privacy',
      icon: Lock,
      description: 'Control your privacy settings',
      color: 'from-purple-500 to-violet-600'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      description: 'Customize notifications',
      color: 'from-amber-500 to-orange-600'
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings />;
      case 'account':
        return <AccountSettings />;
      case 'privacy':
        return <PrivacySettings />;
      case 'notifications':
        return <NotificationSettings />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <AppLayout activeTab="settings">
      <div className="max-w-7xl mx-auto h-full">
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-xl overflow-hidden h-full flex flex-col">
          {/* Header Section */}
          <div className="p-6 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Settings</h1>
                <p className="text-white/70">Manage your account preferences and privacy</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 flex-1 min-h-0">
            {/* Left Sidebar Navigation */}
            <div className="lg:col-span-1 border-r border-white/10 lg:border-r overflow-y-auto">
              <div className="p-4">
                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`group w-full relative overflow-hidden rounded-xl transition-all duration-300 p-4 text-left ${
                          isActive
                            ? 'bg-white/15 backdrop-blur-xl shadow-lg scale-[1.02] border border-white/30'
                            : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg transition-all duration-300 flex-shrink-0 ${
                            isActive
                              ? 'bg-white/20'
                              : 'bg-white/10 group-hover:bg-white/15'
                          }`}>
                            <Icon className={`w-5 h-5 transition-colors ${
                              isActive ? 'text-white' : 'text-white/80 group-hover:text-white'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-semibold text-sm transition-colors ${
                              isActive ? 'text-white' : 'text-white/90 group-hover:text-white'
                            }`}>
                              {tab.label}
                            </h3>
                            <p className={`text-xs mt-1 transition-colors ${
                              isActive ? 'text-white/80' : 'text-white/60 group-hover:text-white/70'
                            }`}>
                              {tab.description}
                            </p>
                          </div>
                        </div>

                        {/* Active indicator */}
                        {isActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-cyan-600 rounded-r-xl"></div>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Content Section */}
            <div className="lg:col-span-3 overflow-y-auto">
              <div className="p-6">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// Wrap the entire component with ProtectedRoute
export default function ProtectedSettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsPage />
    </ProtectedRoute>
  );
}