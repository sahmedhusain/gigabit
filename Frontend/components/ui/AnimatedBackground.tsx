import { useState, useEffect } from 'react';
import { Wifi, Zap, MessageCircle, Users, Share2, Heart, Activity, Radio } from 'lucide-react';

export default function AnimatedBackground() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [themeLoaded, setThemeLoaded] = useState(false);
  
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('backgroundTheme') || 'system';
    
    if (savedTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setTheme(systemTheme);
    } else {
      setTheme(savedTheme as 'light' | 'dark');
    }
    
    setThemeLoaded(true);

    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const savedTheme = localStorage.getItem('backgroundTheme') || 'system';
      if (savedTheme === 'system') {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  
  const [particles] = useState(() => {
    const icons = [Wifi, Zap, MessageCircle, Users, Share2, Heart, Activity, Radio];
    const colors = [
      'text-blue-400/60',
      'text-cyan-400/60',
      'text-emerald-400/60',
      'text-teal-400/60',
      'text-indigo-400/60',
      'text-sky-400/60',
      'text-blue-300/60',
      'text-cyan-300/60'
    ];

    return [...Array(60)].map((_, i) => {
      const IconComponent = icons[Math.floor(Math.random() * icons.length)];
      return {
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 8,
        duration: 4 + Math.random() * 4,
        icon: IconComponent,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() > 0.7 ? 'w-4 h-4' : 'w-3 h-3', 
        animation: Math.random() > 0.5 ? 'animate-bounce' : 'animate-pulse' 
      };
    });
  });

  const isDark = theme === 'dark';

  return (
    <>
      {}
      <div className="absolute inset-0">
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse ${
          isDark ? 'bg-emerald-700/20' : 'bg-emerald-400/15'
        }`}></div>
        <div className={`absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl animate-pulse delay-1000 ${
          isDark ? 'bg-teal-800/20' : 'bg-teal-400/15'
        }`}></div>
        <div className={`absolute top-3/4 left-1/2 w-64 h-64 rounded-full blur-3xl animate-pulse delay-2000 ${
          isDark ? 'bg-blue-700/20' : 'bg-blue-400/15'
        }`}></div>
        <div className={`absolute top-1/2 left-1/3 w-72 h-72 rounded-full blur-3xl animate-pulse delay-3000 ${
          isDark ? 'bg-cyan-900/10' : 'bg-cyan-400/10'
        }`}></div>
      </div>

      {}
      {themeLoaded && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((particle) => {
            const IconComponent = particle.icon;
            return (
              <div
                key={particle.id}
                className={`absolute ${particle.animation} opacity-60`}
                style={{
                  left: `${particle.left}%`,
                  top: `${particle.top}%`,
                  animationDelay: `${particle.delay}s`,
                  animationDuration: `${particle.duration}s`
                }}
                suppressHydrationWarning
              >
                <IconComponent className={`${particle.size} ${particle.color} drop-shadow-sm`} />
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}