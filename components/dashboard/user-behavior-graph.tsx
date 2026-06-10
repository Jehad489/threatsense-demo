'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import Papa from 'papaparse';
import { ArrowLeft, Search, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { connections } from '@/lib/mock-data';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

import baselineStatsRaw from '@/lib/baseline_stats.json';
import oceanScoresRaw from '@/lib/ocean_scores.json';

const baselineStats = baselineStatsRaw as Record<string, any>;
const oceanScores = oceanScoresRaw as Record<string, any>;

type Level = 'overview' | 'department';
type EventType = 'HTTP' | 'USB' | 'EMAIL' | 'FILE' | 'LOGON' | 'LOGOFF';

interface LdapRow {
  employee_name: string;
  user_id: string;
  email: string;
  role: string;
  functional_unit: string;
  department: string;
  supervisor: string;
}

interface LdapUser {
  name: string;
  userId: string;
  email: string;
  role: string;
  functionalUnit: string;
  department: string;
  supervisorName: string;
}

interface DepartmentGroup {
  name: string;
  users: LdapUser[];
}

interface SceneBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface UserNode extends d3.SimulationNodeDatum {
  id: string;
  kind: 'user' | 'pc';
  user?: LdapUser;
  radius: number;
  isThreat?: boolean;
}

interface UserLink extends d3.SimulationLinkDatum<UserNode> {
  source: string | UserNode;
  target: string | UserNode;
  eventType: EventType;
}

const THREAT_IDS = new Set(['ACM2278', 'TFB0185', 'MSD0939']);

const EDGE_COLORS: Record<EventType, string> = {
  HTTP: '#10B981',
  USB: '#F59E0B',
  EMAIL: '#3B82F6',
  FILE: '#EAB308',
  LOGON: '#8B5CF6',
  LOGOFF: '#6B7280',
};

const EVENT_SHORT: Record<EventType, string> = {
  HTTP: 'HT',
  USB: 'US',
  EMAIL: 'EM',
  FILE: 'FI',
  LOGON: 'LO',
  LOGOFF: 'LF',
};

const EVENT_TYPES: EventType[] = ['HTTP', 'USB', 'EMAIL', 'FILE', 'LOGON', 'LOGOFF'];

function hashString(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = Math.imul(31, h) + value.charCodeAt(i);
  }
  return Math.abs(h);
}

function cleanLabel(value: string): string {
  return value.replace(/^\s*\d+\s*-\s*/, '').replace(/([a-z])([A-Z])/g, '$1 $2').trim();
}

function parseUsers(rows: LdapRow[]): LdapUser[] {
  return rows
    .filter((row) => Boolean(row.user_id?.trim()) && Boolean(row.department?.trim()) && Boolean(row.functional_unit?.trim()))
    .map((row) => ({
      name: (row.employee_name ?? '').trim() || row.user_id.trim(),
      userId: row.user_id.trim(),
      email: (row.email ?? '').trim(),
      role: (row.role ?? '').trim() || 'Employee',
      functionalUnit: cleanLabel(row.functional_unit),
      department: cleanLabel(row.department),
      supervisorName: (row.supervisor ?? '').trim(),
    }));
}

function userRiskScore(userId: string): number {
  if (THREAT_IDS.has(userId)) return 0.9 + (hashString(`${userId}:risk`) % 10) / 100;
  return 0.12 + (hashString(`${userId}:risk`) % 55) / 100;
}

function riskLevel(score: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (score >= 0.8) return 'HIGH';
  if (score >= 0.5) return 'MEDIUM';
  return 'LOW';
}

function userMockPc(userId: string): { pcId: string; eventType: EventType } {
  const fromMock = connections.find((c) => c.source === userId);
  if (fromMock) {
    return {
      pcId: fromMock.target,
      eventType: (EVENT_TYPES.includes(fromMock.type as EventType) ? fromMock.type : 'HTTP') as EventType,
    };
  }
  const h = hashString(userId);
  return {
    pcId: `PC-${String(100 + (h % 900))}`,
    eventType: EVENT_TYPES[h % EVENT_TYPES.length],
  };
}

function userActivityTrajectory(userId: string) {
  return Array.from({ length: 20 }, (_, i) => {
    const eventType = EVENT_TYPES[hashString(`${userId}:evt:${i}`) % EVENT_TYPES.length];
    return { idx: i, eventType };
  });
}

function userRiskTrend(userId: string) {
  const base = userRiskScore(userId);
  return Array.from({ length: 24 }, (_, i) => {
    const wave = Math.sin(i / 3) * 0.08;
    const noise = ((hashString(`${userId}:trend:${i}`) % 12) - 6) / 100;
    const score = Math.max(0.05, Math.min(0.99, base * 0.7 + wave + noise));
    return { time: `${String(i).padStart(2, '0')}:00`, score };
  });
}

function UserSidePanel({ user, onClose }: { user: LdapUser; onClose: () => void }) {
  const score = userRiskScore(user.userId);
  const risk = riskLevel(score);

  const stats = baselineStats[user.userId] || {
    total_events: 1042,
    event_distribution: { HTTP: 800, LOGON: 142, EMAIL: 100 },
    after_hours_pct: 12.4,
    top_domains: { "google.com": 150, "reference.com": 80, "github.com": 45 },
    top_emails: { "supervisor@dtaa.com": 10, "hr@dtaa.com": 5 },
    top_file_extensions: { "pdf": 5, "doc": 3, "zip": 1 },
    unique_devices: 2
  };
  
  const ocean = oceanScores[user.userId] || { O: 0.5, C: 0.5, E: 0.5, A: 0.5, N: 0.5 };
  const totalEvents = stats.total_events;

  return (
    <div className="w-full xl:w-[700px] shrink-0 bg-background border-l border-border flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold">User Details</h3>
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-secondary text-foreground">
            {user.userId}
          </span>
          <span
            className={cn(
              'inline-flex px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider',
              risk === 'HIGH' && 'bg-[#DC2626]/20 text-[#DC2626] border-[#DC2626]/40',
              risk === 'MEDIUM' && 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40',
              risk === 'LOW' && 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40'
            )}
          >
            {risk} RISK
          </span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-secondary transition-colors">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Top Header Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-cols-4 gap-4 text-sm bg-card p-4 rounded-lg border border-border">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Full Name</p>
            <p className="font-medium truncate" title={user.name}>{user.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Role</p>
            <p className="font-medium truncate" title={user.role}>{user.role}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Department</p>
            <p className="font-medium truncate" title={user.department}>{user.department}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Supervisor</p>
            <p className="font-medium truncate" title={user.supervisorName}>{user.supervisorName || '—'}</p>
          </div>
        </div>

        <h4 className="text-sm font-semibold text-foreground border-b border-border pb-2">
          Baseline Profile (Prior to first incident)
        </h4>

        {/* 4 Cards Grid from Image */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Card 1: Event Distribution */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h5 className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase flex items-center gap-2 mb-4">
              <span className="text-[#10B981]">🕒</span> Event Distribution
            </h5>
            <div className="mb-6">
              <p className="text-3xl font-bold font-mono text-foreground">
                {totalEvents.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Total Baseline Events</p>
            </div>
            
            <div className="space-y-4">
              {Object.entries(stats.event_distribution)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 5)
                .map(([type, count]) => {
                  const pct = totalEvents > 0 ? (((count as number) / totalEvents) * 100).toFixed(1) : 0;
                  const color = EDGE_COLORS[type as EventType] || '#8B949E';
                  const displayType = type === 'USB' ? 'EXTERNAL DEVICE' : type;
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="font-bold">{displayType}</span>
                        <span className="text-muted-foreground">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Card 2: Temporal Habits */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h5 className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase flex items-center gap-2 mb-4">
              <span className="text-[#F59E0B]">🕒</span> Temporal Habits
            </h5>
            <div className="mb-4">
              <p className="text-3xl font-bold font-mono text-[#F97316]">
                {stats.after_hours_pct}%
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">After-Hours Activity</p>
            </div>
          </div>

          {/* Card 3: Top HTTP Domains */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h5 className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase flex items-center gap-2 mb-4">
              <span className="text-primary">🌐</span> Top HTTP Domains
            </h5>
            <div className="space-y-2">
              {Object.entries(stats.top_domains || {}).length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No HTTP activity logged.</p>
              ) : (
                Object.entries(stats.top_domains).map(([domain, count], idx) => (
                  <div key={domain} className="flex justify-between items-center text-xs bg-card px-3 py-1.5 rounded border border-border/50">
                    <span className="font-mono text-muted-foreground truncate mr-2" title={domain}>
                      {idx + 1}. {domain}
                    </span>
                    <span className="font-mono bg-background px-2 py-0.5 rounded border border-border text-foreground">
                      {count as number}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card 4: Top Email Contacts */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h5 className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase flex items-center gap-2 mb-4">
              <span className="text-[#8B5CF6]">✉</span> Top Email Contacts
            </h5>
            <div className="space-y-2">
              {Object.entries(stats.top_emails || {}).length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No Email activity logged.</p>
              ) : (
                Object.entries(stats.top_emails).map(([email, count], idx) => (
                  <div key={email} className="flex justify-between items-center text-xs bg-card px-3 py-1.5 rounded border border-border/50">
                    <span className="truncate mr-2 text-muted-foreground" title={email}>
                      {email}
                    </span>
                    <span className="font-mono bg-background px-2 py-0.5 rounded border border-border text-foreground">
                      {count as number}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* File, Device, and OCEAN */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Files */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h5 className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-3">
              File Usage
            </h5>
            <div className="space-y-2">
              {Object.entries(stats.top_file_extensions || {}).length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No File activity.</p>
              ) : (
                Object.entries(stats.top_file_extensions).map(([ext, count]) => (
                  <div key={ext} className="flex justify-between text-xs">
                    <span className="font-mono text-muted-foreground">.{ext}</span>
                    <span className="font-mono">{count as number}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Devices */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h5 className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-3">
              Device Footprint
            </h5>
            <div className="flex flex-col items-center justify-center h-full pb-4">
              <span className="text-3xl font-mono font-bold text-foreground">{stats.unique_devices}</span>
              <span className="text-[10px] text-muted-foreground uppercase mt-1">Unique Workstations</span>
            </div>
          </div>

          {/* OCEAN Scores */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h5 className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-3">
              Psychometric (OCEAN)
            </h5>
            <div className="space-y-1.5">
              {[
                { label: 'Openness', val: ocean.O, color: '#3B82F6' },
                { label: 'Conscientiousness', val: ocean.C, color: '#10B981' },
                { label: 'Extraversion', val: ocean.E, color: '#F59E0B' },
                { label: 'Agreeableness', val: ocean.A, color: '#8B5CF6' },
                { label: 'Neuroticism', val: ocean.N, color: '#EC4899' },
              ].map(t => (
                <div key={t.label} className="flex items-center gap-2" title={t.label}>
                  <span className="text-[10px] w-4 font-bold" style={{ color: t.color }}>{t.label[0]}</span>
                  <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${t.val * 100}%`, backgroundColor: t.color }} />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground w-6 text-right">
                    {Math.round(t.val * 100)}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export function UserBehaviorGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const boundsRef = useRef<SceneBounds>({ minX: 0, minY: 0, maxX: 1000, maxY: 1000 });

  const [dimensions, setDimensions] = useState({ width: 900, height: 560 });
  const [users, setUsers] = useState<LdapUser[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [level, setLevel] = useState<Level>('overview');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<LdapUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('KLH0596');
  const [highlightUserId, setHighlightUserId] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasInitialSearchRun, setHasInitialSearchRun] = useState(false);

  useEffect(() => {
    Papa.parse<LdapRow>('/data/ldap.csv', {
      header: true,
      download: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors?.length) setLoadError(result.errors[0]?.message ?? 'Failed to parse LDAP data');
        setUsers(parseUsers(result.data as LdapRow[]));
      },
      error: (error) => setLoadError(error.message),
    });
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const panelOffset = selectedUser ? 384 : 0;
      setDimensions({
        width: Math.max(320, rect.width - panelOffset),
        height: Math.max(280, rect.height),
      });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [selectedUser]);

  const departmentGroups = useMemo<DepartmentGroup[]>(() => {
    const grouped = d3.group(users, (u) => u.department);
    return Array.from(grouped.entries())
      .map(([name, deptUsers]) => ({ name, users: deptUsers }))
      .sort((a, b) => b.users.length - a.users.length);
  }, [users]);

  const selectedDeptUsers = useMemo(() => {
    if (!selectedDepartment) return [];
    return users.filter((u) => u.department === selectedDepartment);
  }, [users, selectedDepartment]);

  const applyTransform = useCallback((transform: d3.ZoomTransform, durationMs: number) => {
    const svg = svgRef.current ? d3.select(svgRef.current) : null;
    const zoom = zoomRef.current;
    if (!svg || !zoom) return;
    if (durationMs > 0) {
      svg.transition().duration(durationMs).ease(d3.easeCubicOut).call(zoom.transform as never, transform);
    } else {
      svg.call(zoom.transform as never, transform);
    }
  }, []);

  const fitToBounds = useCallback(
    (bounds: SceneBounds, durationMs = 700) => {
      const { width, height } = dimensions;
      const padding = 56;
      const bw = Math.max(1, bounds.maxX - bounds.minX);
      const bh = Math.max(1, bounds.maxY - bounds.minY);
      const scale = Math.min((width - padding * 2) / bw, (height - padding * 2) / bh);
      const tx = width / 2 - scale * ((bounds.minX + bounds.maxX) / 2);
      const ty = height / 2 - scale * ((bounds.minY + bounds.maxY) / 2);
      applyTransform(d3.zoomIdentity.translate(tx, ty).scale(scale), durationMs);
    },
    [applyTransform, dimensions]
  );

  const handleFitToScreen = useCallback(() => {
    fitToBounds(boundsRef.current, 700);
  }, [fitToBounds]);

  const handleBack = useCallback(() => {
    setLevel('overview');
    setSelectedDepartment(null);
    setSelectedUser(null);
    setHighlightUserId(null);
  }, []);

  const runSearch = useCallback(() => {
    setSearchError(null);
    const query = searchQuery.trim().toUpperCase();
    if (!query) return;
    const found = users.find(
      (u) => u.userId.toUpperCase().includes(query) || u.name.toUpperCase().includes(query)
    );
    if (!found) {
      setSearchError('No employee found');
      return;
    }
    setHighlightUserId(found.userId);
    setSelectedDepartment(found.department);
    setLevel('department');
  }, [searchQuery, users]);

  useEffect(() => {
    if (users.length > 0 && !hasInitialSearchRun) {
      runSearch();
      setHasInitialSearchRun(true);
    }
  }, [users, hasInitialSearchRun, runSearch]);

  useEffect(() => {
    if (!svgRef.current || users.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const viewport = svg.append('g').attr('class', 'viewport');

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 8])
      .on('zoom', (event) => {
        viewport.attr('transform', event.transform.toString());
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    const defs = svg.append('defs');
    const glow = defs
      .append('filter')
      .attr('id', 'threat-glow')
      .attr('x', '-70%')
      .attr('y', '-70%')
      .attr('width', '240%')
      .attr('height', '240%');
    glow.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const merge = glow.append('feMerge');
    merge.append('feMergeNode').attr('in', 'coloredBlur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    if (level === 'overview') {
      const cols = 6;
      const cellW = 330;
      const cellH = 250;
      const margin = 80;
      const rows = Math.ceil(departmentGroups.length / cols);
      const sceneW = margin * 2 + cols * cellW;
      const sceneH = margin * 2 + rows * cellH;

      const maxCount = Math.max(...departmentGroups.map((d) => d.users.length), 1);

      const deptNodes = departmentGroups.map((dept, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const countRatio = Math.sqrt(dept.users.length / maxCount);
        const w = 170 + countRatio * 120;
        const h = 110 + countRatio * 85;
        const x = margin + col * cellW + (cellW - w) / 2;
        const y = margin + row * cellH + (cellH - h) / 2;
        return { dept, x, y, w, h };
      });

      boundsRef.current = { minX: 0, minY: 0, maxX: sceneW, maxY: sceneH };

      const g = viewport.append('g');
      const cell = g
        .selectAll('g.dept')
        .data(deptNodes)
        .join('g')
        .attr('transform', (d) => `translate(${d.x},${d.y})`)
        .style('cursor', 'pointer')
        .on('click', (_, d) => {
          setSelectedDepartment(d.dept.name);
          setLevel('department');
        });

      cell
        .append('rect')
        .attr('width', (d) => d.w)
        .attr('height', (d) => d.h)
        .attr('rx', 12)
        .attr('fill', '#1E3A5F')
        .attr('fill-opacity', 0.3)
        .attr('stroke', '#3B82F6')
        .attr('stroke-opacity', 0.45)
        .attr('stroke-width', 1.4);

      cell.append('title').text((d) => String(d.dept.users.length));

      cell
        .append('text')
        .attr('x', (d) => d.w / 2)
        .attr('y', 22)
        .attr('text-anchor', 'middle')
        .attr('fill', '#E6EDF3')
        .attr('font-size', 12)
        .attr('font-weight', 600)
        .text((d) => d.dept.name);

      cell.each(function drawDots(d) {
        const dots = d3.select(this).append('g');
        const areaW = d.w - 20;
        const areaH = d.h - 34;
        const dotCols = Math.max(8, Math.floor(areaW / 7));
        d.dept.users.forEach((user, idx) => {
          const cx = 10 + ((idx % dotCols) + 0.5) * (areaW / dotCols);
          const cy = 30 + (Math.floor(idx / dotCols) + 0.5) * 7;
          if (cy > areaH + 28) return;
          const isThreat = THREAT_IDS.has(user.userId);
          dots
            .append('circle')
            .attr('cx', cx)
            .attr('cy', cy)
            .attr('r', 2.1)
            .attr('fill', '#3B82F6')
            .attr('stroke', highlightUserId === user.userId ? '#FBBF24' : 'none')
            .attr('stroke-width', highlightUserId === user.userId ? 1.2 : 0);
        });
      });

      fitToBounds(boundsRef.current, 0);
    }

    if (level === 'department' && selectedDepartment) {
      const deptUsers = selectedDeptUsers;
      const worldW = 1700;
      const worldH = Math.max(900, deptUsers.length * 34 + 180);
      boundsRef.current = { minX: 0, minY: 0, maxX: worldW, maxY: worldH };

      const nodes: UserNode[] = deptUsers.map((user, idx) => {
        const pc = userMockPc(user.userId);
        const roleLower = user.role.toLowerCase();
        const large = roleLower.includes('manager') || roleLower.includes('director') || roleLower.includes('supervisor');
        return {
          id: user.userId,
          kind: 'user',
          user,
          radius: large ? 14 : 11,
          isThreat: THREAT_IDS.has(user.userId),
          x: 420 + (idx % 3) * 25,
          y: 90 + idx * 30,
        } as UserNode;
      });

      const pcNodesById = new Map<string, UserNode>();
      const links: UserLink[] = deptUsers.map((user) => {
        const pc = userMockPc(user.userId);
        if (!pcNodesById.has(pc.pcId)) {
          pcNodesById.set(pc.pcId, {
            id: pc.pcId,
            kind: 'pc',
            radius: 8,
            x: 1280 + (hashString(pc.pcId) % 80),
            y: 110 + (hashString(`${pc.pcId}:y`) % Math.max(100, worldH - 180)),
          } as UserNode);
        }
        return {
          source: user.userId,
          target: pc.pcId,
          eventType: pc.eventType,
        };
      });

      const allNodes = [...nodes, ...pcNodesById.values()];

      const simulation = d3
        .forceSimulation(allNodes)
        .force(
          'link',
          d3
            .forceLink<UserNode, UserLink>(links)
            .id((d) => d.id)
            .distance(220)
            .strength(0.9)
        )
        .force('charge', d3.forceManyBody<UserNode>().strength(-60))
        .force(
          'x',
          d3
            .forceX<UserNode>()
            .x((d) => (d.kind === 'user' ? 420 : 1280))
            .strength(0.8)
        )
        .force(
          'y',
          d3
            .forceY<UserNode>()
            .y((d, i) => (d.kind === 'user' ? 90 + i * 30 : 120 + i * 34))
            .strength(0.05)
        )
        .force('collision', d3.forceCollide<UserNode>().radius((d) => d.radius + 6));

      for (let i = 0; i < 300; i += 1) simulation.tick();
      simulation.stop();

      const g = viewport.append('g');

      g.selectAll('line.edge')
        .data(links)
        .join('line')
        .attr('x1', (l) => (l.source as UserNode).x ?? 0)
        .attr('y1', (l) => (l.source as UserNode).y ?? 0)
        .attr('x2', (l) => (l.target as UserNode).x ?? 0)
        .attr('y2', (l) => (l.target as UserNode).y ?? 0)
        .attr('stroke', (l) => EDGE_COLORS[l.eventType])
        .attr('stroke-opacity', 0.8)
        .attr('stroke-width', 1.8);

      const nodeG = g
        .selectAll('g.node')
        .data(allNodes)
        .join('g')
        .attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
        .style('cursor', (d) => (d.kind === 'user' ? 'pointer' : 'default'))
        .on('click', (event, d) => {
          event.stopPropagation();
          if (d.kind === 'user' && d.user) {
            setSelectedUser(d.user);
          }
        });

      nodeG
        .filter((d) => d.kind === 'user')
        .append('circle')
        .attr('r', (d) => d.radius)
        .attr('fill', '#3B82F6')
        .attr('stroke', (d) => (highlightUserId === d.id ? '#FBBF24' : '#93C5FD'))
        .attr('stroke-width', (d) => (highlightUserId === d.id ? 2.5 : 1.2));

      nodeG
        .filter((d) => d.kind === 'pc')
        .append('rect')
        .attr('x', (d) => -d.radius)
        .attr('y', (d) => -d.radius)
        .attr('width', (d) => d.radius * 2)
        .attr('height', (d) => d.radius * 2)
        .attr('rx', 2)
        .attr('fill', '#21262D')
        .attr('stroke', '#64748B')
        .attr('stroke-width', 1.2);

      nodeG
        .filter((d) => d.kind === 'user')
        .append('text')
        .attr('dy', 4)
        .attr('text-anchor', 'middle')
        .attr('fill', '#F8FAFC')
        .attr('font-size', 9)
        .text('👤');

      nodeG
        .filter((d) => d.kind === 'pc')
        .append('text')
        .attr('dy', 3)
        .attr('text-anchor', 'middle')
        .attr('fill', '#CBD5E1')
        .attr('font-size', 8)
        .text('🖥');

      nodeG
        .append('text')
        .attr('dy', (d) => (d.kind === 'user' ? 24 : 18))
        .attr('text-anchor', 'middle')
        .attr('fill', '#8B949E')
        .attr('font-size', 9)
        .attr('font-family', 'monospace')
        .text((d) => d.id);

      nodeG
        .filter((d) => d.kind === 'user')
        .append('text')
        .attr('dy', 34)
        .attr('text-anchor', 'middle')
        .attr('fill', '#3B82F6')
        .attr('font-size', 8)
        .text('Click for details');

      fitToBounds(boundsRef.current, 0);

      if (highlightUserId) {
        const target = allNodes.find((n) => n.id === highlightUserId);
        if (target?.x != null && target.y != null) {
          const scale = 1.7;
          const tx = dimensions.width / 2 - scale * target.x;
          const ty = dimensions.height / 2 - scale * target.y;
          applyTransform(d3.zoomIdentity.translate(tx, ty).scale(scale), 700);
        }
      }
    }
  }, [
    users,
    level,
    selectedDepartment,
    selectedDeptUsers,
    departmentGroups,
    dimensions,
    fitToBounds,
    applyTransform,
    highlightUserId,
  ]);

  return (
    <div className="flex flex-col xl:flex-row h-full min-h-0 bg-background overflow-y-auto xl:overflow-hidden" ref={containerRef}>
      <div className="flex-1 flex flex-col min-w-0 bg-card rounded-lg border border-border overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-border bg-secondary/30">
          <button
            type="button"
            onClick={handleFitToScreen}
            className="px-2.5 py-1 rounded-md bg-secondary border border-border text-xs text-foreground hover:bg-[#30363D]"
          >
            Fit to Screen
          </button>
          {level === 'department' && (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border bg-background text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" />
              Back
            </button>
          )}
          <h2 className="text-sm font-semibold ml-1">User-Workstation Bipartite Graph</h2>
          <div className="flex items-center gap-3 text-[10px] ml-2">
            {(Object.keys(EDGE_COLORS) as EventType[]).map((t) => (
              <div key={t} className="flex items-center gap-1">
                <span className="w-3 h-0.5 rounded" style={{ background: EDGE_COLORS[t] }} />
                <span className="text-muted-foreground">{t}</span>
              </div>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2 min-w-[220px] flex-1 max-w-md relative">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              list="user-search-options"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value.toUpperCase());
                setSearchError(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
              placeholder="SEARCH BY USER ID OR NAME..."
              className="h-8 flex-1 rounded-md bg-background border border-border px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/40 uppercase"
            />
            <datalist id="user-search-options">
              <option value="KLH0596">Kasper Lance Huffman</option>
              <option value="WDD0366">Wesley Dustin Dickerson</option>
              <option value="PPF0435">Preston Plato Fischer</option>
              <option value="JRG0207">Jada Rose Goodwin</option>
            </datalist>
            <button
              type="button"
              onClick={runSearch}
              className="h-8 px-3 rounded-md bg-primary text-white text-xs font-medium hover:bg-[#2563EB]"
            >
              Go
            </button>
            {searchError && (
              <div className="absolute top-10 right-0 bg-[#DC2626]/10 text-[#EF4444] border border-[#DC2626]/30 text-xs px-3 py-1.5 rounded font-medium shadow-sm whitespace-nowrap z-50">
                {searchError}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 relative bg-background">
          {loadError && (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-[#F87171] z-10 px-4">
              {loadError}
            </p>
          )}
          {!loadError && users.length === 0 && (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground z-10">
              Loading LDAP users...
            </p>
          )}
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="block touch-none cursor-grab active:cursor-grabbing"
          />
        </div>
      </div>

      {selectedUser && <UserSidePanel user={selectedUser} onClose={() => setSelectedUser(null)} />}
    </div>
  );
}
