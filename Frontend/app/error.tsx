'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {

  }, [error]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          {/* Error Card */}
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-8 text-center">
            {/* Error Icon */}
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-gray-500 to-slate-600 text-white text-4xl shadow-lg">
                🛠️
              </div>
            </div>

            {/* Error Code */}
            <div className="mb-4">
              <h1 className="text-7xl font-bold text-white mb-2">500</h1>
              <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-gray-500 to-slate-600 text-white text-sm font-semibold uppercase tracking-wider">
                Error Code
              </div>
            </div>

            {/* Error Title */}
            <h2 className="text-2xl font-bold text-white mb-4">Internal Server Error</h2>

            {/* Error Message */}
            <p className="text-white/80 text-lg mb-8 leading-relaxed">Something went wrong on our end. Please try again later.</p>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={reset}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>

              <button
                onClick={() => router.back()}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/30"
              >
                <ArrowLeft className="w-5 h-5" />
                Go Back
              </button>

              <Link
                href="/feed/all"
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/30"
              >
                <Home className="w-5 h-5" />
                Go to Feed
              </Link>
            </div>

            {/* Support Message */}
            <div className="mt-8 pt-6 border-t border-white/20">
              <p className="text-white/60 text-sm">
                Error ID: {error.digest}
              </p>
              <p className="text-white/60 text-sm mt-1">
                If this problem persists, please contact our support team at support@gigabit.com.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          >
          </div>
        ))}
      </div>
    </div>
  );
}
