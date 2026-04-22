'use client';

import { Shield, Activity, Bell, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';
import { systemStats } from '@/lib/mock-data';

export function Header() {
  const [eventCount, setEventCount] = useState(systemStats.totalEventsProcessed);

  useEffect(() => {
    const interval = setInterval(() => {
      setEventCount(prev => prev + Math.floor(Math.random() * 50) + 10);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-[#DC2626]" />
          <span className="text-lg font-semibold text-foreground">ThreatSense</span>
          <span className="text-muted-foreground">|</span>
          <span className="text-sm text-muted-foreground">Insider Threat Detection</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Event Counter */}
        <div className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4 text-[#3B82F6]" />
          <span className="font-mono text-muted-foreground">
            <span className="text-foreground font-semibold">{eventCount.toLocaleString()}</span> events processed
          </span>
        </div>

        {/* Active Alerts */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#DC2626] text-[10px] font-bold text-white flex items-center justify-center threat-pulse">
              {systemStats.activeAlerts}
            </span>
          </div>
        </div>

        {/* System Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#10B981]/10 border border-[#10B981]/30">
          <Wifi className="h-4 w-4 text-[#10B981]" />
          <span className="text-xs font-semibold text-[#10B981]">LIVE</span>
        </div>
      </div>
    </header>
  );
}
