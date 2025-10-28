'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Users, MessageCircle, Calendar, Star, Zap, Sparkles } from 'lucide-react';
import TermsPopup from '../ui/TermsPopup';
import PrivacyPopup from '../ui/PrivacyPopup';
import CookiesPopup from '../ui/CookiesPopup';
import SupportPopup from '../ui/SupportPopup';
import { FloatingElementProps } from '@/types/homepage';

const FloatingElement: React.FC<FloatingElementProps> = ({ 
  children, 
  delay = 0, 
  duration = 3, 
  className = '', 
  left = '0%', 
  top = '0%' 
}) => (
  <div
    className={`animate-bounce absolute ${className}`}
    style={{
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
      left,
      top,
    }}
  >
    {children}
  </div>
);

const FeatureCard = ({ icon: Icon, title, description, gradient }: {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
}) => (
  <div className="group relative">
    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg transform group-hover:scale-105 transition-all duration-300"></div>
    <div className="relative p-8 text-center">
      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${gradient} mb-6 shadow-lg shadow-emerald-500/25`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-white/70 leading-relaxed">{description}</p>
    </div>
  </div>
);

export default function Homepage() {
  const [isVisible, setIsVisible] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showCookies, setShowCookies] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-3000"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => {
          const left = `${(i * 23 + 17) % 100}%`;
          const top = `${(i * 31 + 41) % 100}%`;
          const delay = (i * 0.3) % 3;
          const duration = 3 + (i * 0.2) % 2;
          
          return (
            <FloatingElement
              key={i}
              delay={delay}
              duration={duration}
              left={left}
              top={top}
            >
              <Sparkles className="w-2 h-2 text-white/20" />
            </FloatingElement>
          );
        })}
      </div>

      {/* Navigation */}
      <nav className="relative z-50 px-4 sm:px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <div className="relative h-14 w-32 sm:w-40">
              <Image
                src="/logo.png"
                alt="Gigabit Logo"
                fill
                sizes="160px"
                className="object-contain drop-shadow-lg hover:drop-shadow-xl transition-all duration-300"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link
              href="/login"
              className="px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-xl border border-white/30 text-white hover:bg-white/10 transition-all duration-300 backdrop-blur-sm font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg shadow-emerald-500/25 font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-40 px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 mb-8">
              <Zap className="w-4 h-4 mr-2 text-yellow-400" />
              <span className="text-sm font-medium">Powered by Next-Generation Technology</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-white via-emerald-100 to-teal-200 bg-clip-text text-transparent mb-8 leading-tight">
              Connect Beyond
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Boundaries
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-4xl mx-auto leading-relaxed">
              Experience the future of social networking with Gigabit. Connect with friends, share moments, 
              and build communities in ways you never imagined possible.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-12 sm:mb-16">
              <Link
                href="/register"
                className="group relative w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl text-white font-semibold text-base sm:text-lg shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transform hover:scale-105 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <span className="relative flex items-center justify-center">
                  Start Your Journey
                  <ArrowRight className="ml-2 w-4 sm:w-5 h-4 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-30 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 mb-8">
              <Star className="w-4 h-4 mr-2 text-yellow-400" />
              <span className="text-sm font-medium">Powerful Features</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent mb-6">
              Everything You Need
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Discover powerful features designed to enhance your social experience and bring people closer together.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={MessageCircle}
              title="Real-time Chat"
              description="Instant messaging with friends and groups. Share files, images, and stay connected 24/7."
              gradient="from-blue-500 to-cyan-500"
            />
            <FeatureCard
              icon={Users}
              title="Smart Communities"
              description="Join interest-based communities and connect with like-minded people from around the world."
              gradient="from-emerald-500 to-teal-500"
            />
            <FeatureCard
              icon={Calendar}
              title="Event Planning"
              description="Create and manage events effortlessly. Invite friends and coordinate activities seamlessly."
              gradient="from-orange-500 to-red-500"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl"></div>
            <div className="relative p-12">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent mb-6">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
                Join millions of users who have already discovered the future of social networking.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/register"
                  className="group relative px-8 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl text-white font-semibold text-lg shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transform hover:scale-105 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <span className="relative flex items-center">
                    Create Account
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 rounded-2xl border border-white/30 text-white hover:bg-white/10 transition-all duration-300 backdrop-blur-sm font-semibold text-lg"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-4 sm:px-6 py-8 sm:py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="relative h-14 w-32">
                <Image
                  src="/logo.png"
                  alt="Gigabit Logo"
                  fill
                  sizes="128px"
                  className="object-contain drop-shadow-lg"
                />
              </div>
            </div>
            
            <div className="flex items-center flex-wrap justify-center gap-4 sm:gap-8 text-white/60 text-sm">
              <button onClick={() => setShowTerms(true)} className="hover:text-white transition-colors">Terms</button>
              <button onClick={() => setShowPrivacy(true)} className="hover:text-white transition-colors">Privacy</button>
              <button onClick={() => setShowCookies(true)} className="hover:text-white transition-colors">Cookies</button>
              <button onClick={() => setShowSupport(true)} className="hover:text-white transition-colors">Support</button>
            </div>
          </div>
          
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-white/10 text-center text-white/40 text-xs sm:text-sm">
            <p>© 2025 Gigabit. All rights reserved. Made with ❤️ for connecting people worldwide.</p>
          </div>
        </div>
      </footer>

      {/* Floating CTA for Mobile */}
      <div className="fixed bottom-6 right-6 sm:hidden z-50">
        <Link
          href="/register"
          className="group relative w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transform hover:scale-110 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-600 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
          <ArrowRight className="relative w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Scroll indicator - Hidden on mobile */}
      <div className="hidden sm:block fixed bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-40">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>

      {/* Popups */}
      <TermsPopup isOpen={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyPopup isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
      <CookiesPopup isOpen={showCookies} onClose={() => setShowCookies(false)} />
      <SupportPopup isOpen={showSupport} onClose={() => setShowSupport(false)} />
    </div>
  );
}