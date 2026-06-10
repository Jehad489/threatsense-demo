'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, User, Monitor, Clock, Shield, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockEvents, flaggedUsers, type ThreatEvent, type FlaggedUser } from '@/lib/mock-data';

type ScenarioFilter = 'ALL' | 'S1' | 'S2' | 'S3';

function RiskBadge({ score, isThreat }: { score: number; isThreat: boolean }) {
  const getColor = () => {
    if (isThreat) return 'bg-[#DC2626]/20 text-[#DC2626] border-[#DC2626]/30';
    if (score > 0.5) return 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/30';
    if (score > 0.2) return 'bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/30';
    return 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30';
  };

  return (
    <span className={cn(
      'font-mono text-xs px-2 py-0.5 rounded border',
      getColor(),
      isThreat && 'threat-pulse'
    )}>
      {score.toFixed(2)}
    </span>
  );
}

function EventTypeBadge({ type }: { type: ThreatEvent['eventType'] }) {
  const colors: Record<ThreatEvent['eventType'], string> = {
    HTTP: 'text-[#10B981]',
    USB: 'text-[#F59E0B]',
    EMAIL: 'text-[#3B82F6]',
    FILE: 'text-[#EAB308]',
    LOGON: 'text-[#8B5CF6]',
    LOGOFF: 'text-[#6B7280]',
  };

  return (
    <span className={cn('font-mono text-xs font-medium', colors[type])}>
      {type}
    </span>
  );
}

function RiskGauge({ score, size = 'lg' }: { score: number; size?: 'sm' | 'lg' }) {
  const radius = size === 'lg' ? 45 : 30;
  const stroke = size === 'lg' ? 8 : 5;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score * circumference);

  const getColor = () => {
    if (score >= 0.8) return '#DC2626';
    if (score >= 0.5) return '#F59E0B';
    return '#10B981';
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90"
      >
        <circle
          stroke="#21262D"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={getColor()}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-500"
        />
      </svg>
      <span className={cn(
        'absolute font-mono font-bold',
        size === 'lg' ? 'text-lg' : 'text-xs'
      )} style={{ color: getColor() }}>
        {Math.round(score * 100)}%
      </span>
    </div>
  );
}

function EventRow({ event }: { event: ThreatEvent }) {
  const [clientTimestamp, setClientTimestamp] = useState<string | null>(null);

  useEffect(() => {
    setClientTimestamp(event.timestamp);
  }, [event.timestamp]);

  return (
    <div className={cn(
      'flex items-center gap-4 px-4 py-2.5 border-b border-border/50 hover:bg-secondary/50 transition-colors',
      event.isThreat && 'bg-[#DC2626]/5 threat-glow'
    )}>
      <span className="font-mono text-xs text-muted-foreground w-36 shrink-0">
        {clientTimestamp ?? '--:--:--'}
      </span>
      <div className="flex items-center gap-2 w-24 shrink-0">
        <User className="h-3.5 w-3.5 text-muted-foreground" />
        <span className={cn(
          'font-mono text-xs font-medium',
          event.isThreat ? 'text-[#DC2626]' : 'text-foreground'
        )}>
          {event.userId}
        </span>
      </div>
      <div className="w-16 shrink-0">
        <EventTypeBadge type={event.eventType} />
      </div>
      <div className="flex items-center gap-2 w-24 shrink-0">
        <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-mono text-xs text-muted-foreground">{event.pc}</span>
      </div>
      <div className="flex-1 flex items-center justify-between">
        <RiskBadge score={event.riskScore} isThreat={event.isThreat} />
        {event.scenario && (
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#DC2626]/20 text-[#DC2626] border border-[#DC2626]/30">
            {event.scenario}
          </span>
        )}
      </div>
    </div>
  );
}

function FlaggedUserCard({ user, isSelected, onClick }: { user: FlaggedUser; isSelected: boolean; onClick: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-4 rounded-lg border transition-all duration-200 text-left',
        isSelected
          ? 'bg-[#DC2626]/10 border-[#DC2626]/50'
          : 'bg-card border-border hover:border-[#DC2626]/30'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              'font-mono text-sm font-bold',
              user.riskScore >= 0.8 ? 'text-[#DC2626]' : 'text-[#F59E0B]'
            )}>
              {user.userId}
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#DC2626]/20 text-[#DC2626] border border-[#DC2626]/30">
              {user.scenario}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{user.department}</p>
        </div>
        <RiskGauge score={user.riskScore} size="sm" />
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          <span>{user.eventCount} events</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span className="font-mono">{user.lastActivity.split(' ')[1]}</span>
        </div>
      </div>
    </button>
  );
}

function UserEventStreamBox({ userId, role }: { userId: string, role: string }) {
  const [events, setEvents] = useState<{ time: string; type: string; pc: string }[]>([]);

  useEffect(() => {
    const pc = `PC-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')}`;
    const interval = setInterval(() => {
      setEvents(prev => {
        const newEvent = {
          time: new Date().toISOString().replace('T', ' ').slice(0, 19),
          type: (['HTTP', 'USB', 'EMAIL', 'FILE', 'LOGON', 'LOGOFF'] as const)[Math.floor(Math.random() * 6)],
          pc: pc
        };
        return [newEvent, ...prev].slice(0, 50); // Keep last 50 events to prevent memory leak
      });
    }, 2000 + Math.random() * 3000); // Random interval per user

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col bg-card rounded-lg border border-border overflow-hidden h-full shadow-lg">
      <div className="flex justify-between items-center px-4 py-2 bg-secondary/30 border-b border-border">
        <div className="flex flex-col">
          <span className="font-mono text-sm font-bold text-foreground">{userId}</span>
          <span className="text-xs text-muted-foreground font-medium">{role}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Live</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 bg-accent/30 font-mono text-[11px] leading-tight">
        {events.length === 0 && <div className="text-muted-foreground animate-pulse text-xs">Waiting for activity intercept...</div>}
        {events.map((evt, idx) => (
          <div key={idx} className="mb-4">
            <div className="text-muted-foreground">{evt.time}</div>
            <div className="text-foreground font-bold">{userId}</div>
            <div className="text-[#10B981] font-semibold">{evt.type}</div>
            <div className="text-muted-foreground">{evt.pc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LiveThreatFeed() {
  const targetUsers = [
    { id: 'KLH0596', role: 'ProductionLineWorker' },
    { id: 'WDD0366', role: 'ITAdmin' },
    { id: 'PPF0435', role: 'TestEngineer' },
    { id: 'JRG0207', role: 'SecurityGuard' },
  ];

  return (
    <div className="h-full w-full grid grid-cols-1 md:grid-cols-2 grid-rows-none md:grid-rows-2 gap-4 pb-4">
      {targetUsers.map(user => (
        <UserEventStreamBox key={user.id} userId={user.id} role={user.role} />
      ))}
    </div>
  );
}
