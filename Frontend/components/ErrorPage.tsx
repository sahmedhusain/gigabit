'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home, RefreshCw, LogIn } from 'lucide-react';

interface ErrorPageProps {
  errorCode: number;
  title?: string;
  message?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  onRetry?: () => void;
}

const ERROR_DETAILS = {
  400: {
    title: "Bad Request",
    message: "The request could not be understood by the server due to malformed syntax.",
    icon: "⚠️",
    color: "from-yellow-500 to-orange-600"
  },
  401: {
    title: "Unauthorized",
    message: "You need to log in to access this page.",
    icon: "🔒",
    color: "from-red-500 to-pink-600"
  },
  403: {
    title: "Forbidden",
    message: "You don't have permission to access this resource.",
    icon: "🚫",
    color: "from-red-500 to-red-700"
  },
  404: {
    title: "Page Not Found",
    message: "The page you're looking for doesn't exist.",
    icon: "🔍",
    color: "from-blue-500 to-cyan-600"
  },
  500: {
    title: "Internal Server Error",
    message: "Something went wrong on our end. Please try again later.",
    icon: "🛠️",
    color: "from-gray-500 to-slate-600"
  },
  502: {
    title: "Bad Gateway",
    message: "The server received an invalid response from an upstream server.",
    icon: "🌐",
    color: "from-purple-500 to-violet-600"
  },
  503: {
    title: "Service Unavailable",
    message: "The service is temporarily unavailable. Please try again later.",
    icon: "⏰",
    color: "from-amber-500 to-orange-600"
  }
};

export default function ErrorPage({
  errorCode,
  title,
  message,
  showBackButton = true,
  showHomeButton = true,
  onRetry
}: ErrorPageProps) {
  const router = useRouter();
  const errorInfo = ERROR_DETAILS[errorCode as keyof typeof ERROR_DETAILS] || ERROR_DETAILS[500];

  const displayTitle = title || errorInfo.title;
  const displayMessage = message || errorInfo.message;

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
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br ${errorInfo.color} text-white text-4xl shadow-lg`}>
                {errorInfo.icon}
              </div>
            </div>

            {/* Error Code */}
            <div className="mb-4">
              <h1 className="text-7xl font-bold text-white mb-2">{errorCode}</h1>
              <div className={`inline-block px-4 py-2 rounded-full bg-gradient-to-r ${errorInfo.color} text-white text-sm font-semibold uppercase tracking-wider`}>
                Error Code
              </div>
            </div>

            {/* Error Title */}
            <h2 className="text-2xl font-bold text-white mb-4">{displayTitle}</h2>

            {/* Error Message */}
            <p className="text-white/80 text-lg mb-8 leading-relaxed">{displayMessage}</p>

            {/* Action Buttons */}
            <div className="space-y-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </button>
              )}

              {showBackButton && (
                <button
                  onClick={() => router.back()}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/30"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Go Back
                </button>
              )}

              {showHomeButton && (
                <Link
                  href="/feed/all"
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/30"
                >
                  <Home className="w-5 h-5" />
                  Go to Feed
                </Link>
              )}

              {errorCode === 401 && (
                <Link
                  href="/login"
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  <LogIn className="w-5 h-5" />
                  Log In
                </Link>
              )}
            </div>

            {/* Support Message */}
            <div className="mt-8 pt-6 border-t border-white/20">
              <p className="text-white/60 text-sm">
                If this problem persists, please contact our support team.
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
            className={`absolute w-1 h-1 bg-white/20 rounded-full animate-float`}
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
