'use client';

import { Shield, Activity, Bell, Wifi, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { systemStats } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header({ onMenuClick, onSectionChange }: { onMenuClick?: () => void, onSectionChange?: (section: string) => void }) {
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="relative cursor-pointer hover:bg-secondary/50 p-2 rounded-full transition-colors">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center threat-pulse">
                  1
                </span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer flex flex-col items-start gap-1 p-3"
                onClick={() => onSectionChange && onSectionChange('explainability')}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                  <span className="font-semibold text-sm">Alert Detected</span>
                </div>
                <span className="text-xs text-muted-foreground">High-risk anomalous activity identified for user WDD0366. Click to view attack report.</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
