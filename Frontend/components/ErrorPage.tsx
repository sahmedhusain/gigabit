'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ErrorPageProps {
  errorCode: number;
  title?: string;
  message?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
}

const ERROR_DETAILS = {
  400: {
    title: "Bad Request",
    message: "The request could not be understood by the server due to malformed syntax.",
    icon: "⚠️"
  },
  401: {
    title: "Unauthorized",
    message: "You need to log in to access this page.",
    icon: "🔒"
  },
  403: {
    title: "Forbidden",
    message: "You don't have permission to access this resource.",
    icon: "🚫"
  },
  404: {
    title: "Page Not Found",
    message: "The page you're looking for doesn't exist.",
    icon: "🔍"
  },
  500: {
    title: "Internal Server Error",
    message: "Something went wrong on our end. Please try again later.",
    icon: "🛠️"
  },
  502: {
    title: "Bad Gateway",
    message: "The server received an invalid response from an upstream server.",
    icon: "🌐"
  },
  503: {
    title: "Service Unavailable",
    message: "The service is temporarily unavailable. Please try again later.",
    icon: "⏰"
  }
};

export default function ErrorPage({
  errorCode,
  title,
  message,
  showBackButton = true,
  showHomeButton = true
}: ErrorPageProps) {
  const router = useRouter();
  const errorInfo = ERROR_DETAILS[errorCode as keyof typeof ERROR_DETAILS] || ERROR_DETAILS[500];

  const displayTitle = title || errorInfo.title;
  const displayMessage = message || errorInfo.message;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="text-6xl mb-4">{errorInfo.icon}</div>
          <h1 className="text-6xl font-bold text-gray-900 mb-4">{errorCode}</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">{displayTitle}</h2>
          <p className="text-gray-600 mb-8">{displayMessage}</p>
        </div>
        
        <div className="space-y-4">
          {showBackButton && (
            <button
              onClick={() => router.back()}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
            >
              Go Back
            </button>
          )}
          
          {showHomeButton && (
            <Link
              href="/"
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
            >
              Go to Homepage
            </Link>
          )}
          
          {errorCode === 401 && (
            <Link
              href="/login"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out"
            >
              Log In
            </Link>
          )}
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>If this problem persists, please contact support.</p>
        </div>
      </div>
    </div>
  );
}
