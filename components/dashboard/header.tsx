'use client';

import { Shield, Activity, Bell, Wifi, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { systemStats } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { ThemeToggle } from '@/components/theme-toggle';

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [eventCount, setEventCount] = useState(systemStats.totalEventsProcessed);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setEventCount(prev => prev + Math.floor(Math.random() * 50) + 10);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-[#DC2626]" />
          <span className="text-lg font-semibold text-foreground hidden sm:inline-block">ThreatSense</span>
          <span className="text-muted-foreground hidden sm:inline-block">|</span>
          <span className="text-sm text-muted-foreground hidden sm:inline-block">Insider Threat Detection</span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-6">
        <ThemeToggle />

        {/* Active Alerts */}
        <div className="flex items-center gap-2 mr-2 md:mr-0">
          <div className="relative">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center threat-pulse">
              {systemStats.activeAlerts}
            </span>
          </div>
        </div>

      
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={isSigningOut}
          className="dark:bg-input/30 dark:border-input dark:hover:bg-input/50"
        >
          {isSigningOut ? 'Logging Out...' : 'Logout'}
        </Button>
      </div>
    </header>
  );
}
