'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Homepage from '@/components/Homepage';

export default function RootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/feed/all');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto"></div>
          <p className="mt-4 text-white/80">Loading...</p>
        </div>
      </div>
    );
  }

  // Show homepage for non-authenticated users
  if (!user) {
    return <Homepage />;
  }

  // This should not be reached due to the useEffect redirect, but just in case
  return null;
}