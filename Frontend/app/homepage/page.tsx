'use client'
import Link from 'next/link'
import { 
  ArrowRight, 
  Sparkles, 
  Users, 
  MessageCircle, 
  Heart, 
  Share, 
  Globe, 
  Shield, 
  Zap,
  Star,
  Smartphone,
  Camera
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl animate-pulse delay-3000"></div>
      </div>
      
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          >
            <Sparkles className="w-2 h-2 text-white/20" />
          </div>
        ))}
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center p-6 lg:px-8">
        <div className="flex items-center">
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-white via-emerald-100 to-teal-200 bg-clip-text text-transparent">
            SocialConnect
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="px-6 py-2 text-white/80 hover:text-white transition-colors font-medium"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all duration-200 backdrop-blur-sm font-medium"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Hero Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold bg-gradient-to-r from-white via-emerald-100 to-teal-200 bg-clip-text text-transparent mb-6 tracking-tight">
            Connect Beyond
            <br />
            <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
              Boundaries
            </span>
          </h1>

          {/* Hero Subtitle */}
          <p className="text-xl sm:text-2xl text-white/80 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
            Join millions of users in the next generation social platform. Share moments, build communities, and create lasting connections.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link
              href="/register"
              className="group relative flex justify-center items-center py-4 px-8 border-0 text-lg font-semibold rounded-2xl text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-teal-400/50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-teal-500/25 w-full sm:w-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <span className="relative flex items-center">
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            
            <Link
              href="/login"
              className="flex justify-center items-center py-4 px-8 border border-white/30 rounded-2xl text-lg font-semibold text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300 backdrop-blur-sm hover:border-white/50 w-full sm:w-auto"
            >
              I Have An Account
            </Link>
          </div>

          {/* Social Proof */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-white/60 text-sm">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              <span>2M+ Active Users</span>
            </div>
            <div className="flex items-center">
              <MessageCircle className="w-4 h-4 mr-2" />
              <span>50M+ Messages Daily</span>
            </div>
            <div className="flex items-center">
              <Globe className="w-4 h-4 mr-2" />
              <span>190+ Countries</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent mb-4">
              Why Choose SocialConnect?
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Experience social networking like never before with our cutting-edge features and user-centric design.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            {[
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Privacy First",
                description: "Your data is encrypted and protected with military-grade security protocols."
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: "Lightning Fast",
                description: "Real-time messaging and instant updates across all your devices."
              },
              {
                icon: <Camera className="w-8 h-8" />,
                title: "Rich Media",
                description: "Share photos, videos, and stories with advanced editing tools."
              },
              {
                icon: <Heart className="w-8 h-8" />,
                title: "Smart Feed",
                description: "AI-powered algorithm shows you content that matters most to you."
              },
              {
                icon: <Smartphone className="w-8 h-8" />,
                title: "Cross Platform",
                description: "Seamless experience across mobile, desktop, and web platforms."
              },
              {
                icon: <Star className="w-8 h-8" />,
                title: "Premium Quality",
                description: "Ad-free experience with premium features for enhanced connectivity."
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative"
              >
                {/* Glassmorphism Card */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-3xl"></div>
                
                <div className="relative p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl border border-white/20 group-hover:border-emerald-400/30 transition-all duration-300">
                    <div className="text-emerald-300 group-hover:text-emerald-200 transition-colors">
                      {feature.icon}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white mb-4">
                    {feature.title}
                  </h3>
                  
                  <p className="text-white/70 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative group">
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-3xl"></div>
            
            <div className="relative p-12">
              <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent mb-6">
                Ready to Get Started?
              </h2>
              
              <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
                Join millions of users who have already discovered the future of social networking. Your community is waiting for you.
              </p>
              
              <Link
                href="/register"
                className="group relative inline-flex justify-center items-center py-4 px-8 border-0 text-lg font-semibold rounded-2xl text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-teal-400/50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-teal-500/25"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <span className="relative flex items-center">
                  Create Your Account
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-white via-emerald-100 to-teal-200 bg-clip-text text-transparent">
                SocialConnect
              </h3>
              <p className="text-white/60 mt-2">Step into tomorrow's social experience</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8">
              <div className="flex space-x-6 text-sm text-white/60">
                <button className="hover:text-white/80 transition-colors">Terms</button>
                <button className="hover:text-white/80 transition-colors">Privacy</button>
                <button className="hover:text-white/80 transition-colors">Support</button>
                <button className="hover:text-white/80 transition-colors">About</button>
              </div>
              
              <div className="text-sm text-white/40">
                SocialConnect © 2025 • Crafted with ✨
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
