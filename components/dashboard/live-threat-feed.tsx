'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, User, Monitor, Clock, Shield } from 'lucide-react';
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
  return (
    <div className={cn(
      'flex items-center gap-4 px-4 py-2.5 border-b border-border/50 hover:bg-secondary/50 transition-colors',
      event.isThreat && 'bg-[#DC2626]/5 threat-glow'
    )}>
      <span className="font-mono text-xs text-muted-foreground w-36 shrink-0">
        {event.timestamp}
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

export function LiveThreatFeed() {
  const [events, setEvents] = useState<ThreatEvent[]>(mockEvents);
  const [selectedUser, setSelectedUser] = useState<FlaggedUser | null>(flaggedUsers[0]);
  const [scenarioFilter, setScenarioFilter] = useState<ScenarioFilter>('ALL');

  // Simulate real-time events
  useEffect(() => {
    const interval = setInterval(() => {
      setEvents(prev => {
        const newEvent: ThreatEvent = {
          id: `EVT${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          userId: ['ACM2278', 'BTR1893', 'CWS0045', 'MBG2190', 'PLR7821'][Math.floor(Math.random() * 5)],
          eventType: (['HTTP', 'USB', 'EMAIL', 'FILE', 'LOGON', 'LOGOFF'] as const)[Math.floor(Math.random() * 6)],
          pc: `PC-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')}`,
          riskScore: Math.random() * 0.4,
          isThreat: false,
        };
        return [newEvent, ...prev.slice(0, 19)];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const filteredUsers = scenarioFilter === 'ALL'
    ? flaggedUsers
    : flaggedUsers.filter(u => u.scenario === scenarioFilter);

  return (
    <div className="flex h-full gap-6">
      {/* Event Log */}
      <div className="flex-1 flex flex-col bg-card rounded-lg border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
            <h2 className="text-sm font-semibold">Real-Time Event Stream</h2>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {events.length} events
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {events.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </div>
      </div>

      {/* Flagged Users Panel */}
      <div className="w-80 flex flex-col bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#DC2626]" />
              <h2 className="text-sm font-semibold">Flagged Users</h2>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#DC2626]/20 text-[#DC2626]">
              {flaggedUsers.length} active
            </span>
          </div>
          
          {/* Scenario Tabs */}
          <div className="flex gap-1">
            {(['ALL', 'S1', 'S2', 'S3'] as const).map((scenario) => (
              <button
                key={scenario}
                onClick={() => setScenarioFilter(scenario)}
                className={cn(
                  'px-3 py-1 text-xs font-mono rounded transition-colors',
                  scenarioFilter === scenario
                    ? 'bg-[#3B82F6] text-white'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                )}
              >
                {scenario}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredUsers.map((user) => (
            <FlaggedUserCard
              key={user.userId}
              user={user}
              isSelected={selectedUser?.userId === user.userId}
              onClick={() => setSelectedUser(user)}
            />
          ))}
        </div>

        {/* Selected User Detail */}
        {selectedUser && (
          <div className="p-4 border-t border-border bg-secondary/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground">Selected User</p>
                <p className="font-mono font-bold text-[#DC2626]">{selectedUser.userId}</p>
              </div>
              <RiskGauge score={selectedUser.riskScore} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-background rounded p-2">
                <p className="text-muted-foreground">Scenario</p>
                <p className="font-mono font-semibold text-[#DC2626]">{selectedUser.scenario}</p>
              </div>
              <div className="bg-background rounded p-2">
                <p className="text-muted-foreground">Events</p>
                <p className="font-mono font-semibold">{selectedUser.eventCount}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
