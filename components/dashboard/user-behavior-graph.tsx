'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { X, User, Monitor, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { users, workstations, connections, getUserActivity, flaggedUsers } from '@/lib/mock-data';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Node {
  id: string;
  type: 'user' | 'workstation';
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  isThreat?: boolean;
}

interface Link {
  source: Node | string;
  target: Node | string;
  type: string;
  isThreat: boolean;
}

const eventTypeColors: Record<string, string> = {
  HTTP: '#10B981',
  USB: '#F59E0B',
  EMAIL: '#3B82F6',
  FILE: '#EAB308',
  LOGON: '#8B5CF6',
  LOGOFF: '#6B7280',
};

function UserDetailPanel({ userId, onClose }: { userId: string; onClose: () => void }) {
  const activity = getUserActivity(userId);
  const flaggedUser = flaggedUsers.find(u => u.userId === userId);

  return (
    <div className="w-96 bg-card border-l border-border flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-[#3B82F6]" />
          <span className={cn(
            'font-mono font-bold',
            flaggedUser ? 'text-[#DC2626]' : 'text-foreground'
          )}>
            {userId}
          </span>
          {flaggedUser && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#DC2626]/20 text-[#DC2626] border border-[#DC2626]/30 font-mono">
              {flaggedUser.scenario}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-secondary transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Activity Timeline */}
      <div className="p-4 border-b border-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Activity Trajectory (Last 20 Events)
        </h3>
        <div className="flex gap-1 overflow-x-auto pb-2">
          {activity.events.map((event, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center gap-1 shrink-0"
              title={`${event.type} at ${event.timestamp}`}
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-mono font-bold',
                  event.riskContribution > 0.5
                    ? 'bg-[#DC2626]/20 text-[#DC2626] border border-[#DC2626]/30'
                    : 'bg-secondary text-muted-foreground'
                )}
                style={{ borderLeftColor: eventTypeColors[event.type], borderLeftWidth: 2 }}
              >
                {event.type.slice(0, 2)}
              </div>
              {idx < activity.events.length - 1 && (
                <div className="w-px h-2 bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Risk Score Trend */}
      <div className="flex-1 p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-[#F59E0B]" />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Risk Score Trend (24h)
          </h3>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={activity.riskTrend}>
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: '#8B949E' }}
                tickLine={false}
                axisLine={{ stroke: '#30363D' }}
                interval={5}
              />
              <YAxis
                domain={[0, 1]}
                tick={{ fontSize: 10, fill: '#8B949E' }}
                tickLine={false}
                axisLine={{ stroke: '#30363D' }}
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#161B22',
                  border: '1px solid #30363D',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#8B949E' }}
                formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Risk Score']}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke={flaggedUser ? '#DC2626' : '#3B82F6'}
                strokeWidth={2}
                dot={false}
              />
              {/* Threshold line */}
              <Line
                type="monotone"
                dataKey={() => 0.8833}
                stroke="#F59E0B"
                strokeWidth={1}
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-[#F59E0B]" style={{ borderStyle: 'dashed' }} />
            <span>Threshold (88.33%)</span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {flaggedUser && (
        <div className="p-4 border-t border-border bg-[#DC2626]/5">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-background rounded p-2">
              <p className="text-muted-foreground">Risk Score</p>
              <p className="font-mono font-bold text-[#DC2626]">
                {(flaggedUser.riskScore * 100).toFixed(2)}%
              </p>
            </div>
            <div className="bg-background rounded p-2">
              <p className="text-muted-foreground">Department</p>
              <p className="font-mono font-semibold">{flaggedUser.department}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function UserBehaviorGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const threatUserIds = flaggedUsers.map(u => u.userId);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width: width - (selectedUser ? 384 : 0), height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [selectedUser]);

  const handleNodeClick = useCallback((userId: string) => {
    setSelectedUser(prev => prev === userId ? null : userId);
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;

    // Create nodes
    const userNodes: Node[] = users.map((id, i) => ({
      id,
      type: 'user' as const,
      x: 150,
      y: (height / (users.length + 1)) * (i + 1),
      isThreat: threatUserIds.includes(id),
    }));

    const workstationNodes: Node[] = workstations.map((id, i) => ({
      id,
      type: 'workstation' as const,
      x: width - 150,
      y: (height / (workstations.length + 1)) * (i + 1),
    }));

    const nodes: Node[] = [...userNodes, ...workstationNodes];

    // Create links
    const links: Link[] = connections.map(c => ({
      source: c.source,
      target: c.target,
      type: c.type,
      isThreat: c.isThreat,
    }));

    // Create simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: unknown) => (d as Node).id).distance(300))
      .force('charge', d3.forceManyBody().strength(-100))
      .force('x', d3.forceX().x(d => (d as Node).type === 'user' ? 150 : width - 150).strength(0.8))
      .force('y', d3.forceY().y(height / 2).strength(0.05))
      .force('collision', d3.forceCollide().radius(30));

    // Add zoom
    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Draw links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', d => eventTypeColors[d.type] || '#30363D')
      .attr('stroke-opacity', d => d.isThreat ? 0.8 : 0.4)
      .attr('stroke-width', d => d.isThreat ? 2.5 : 1.5);

    // Draw nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('cursor', d => d.type === 'user' ? 'pointer' : 'default')
      .on('click', (_, d) => {
        if (d.type === 'user') {
          handleNodeClick(d.id);
        }
      });

    // Add glow filter for threat nodes
    const defs = svg.append('defs');
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // User nodes
    node.filter(d => d.type === 'user')
      .append('circle')
      .attr('r', 20)
      .attr('fill', d => d.isThreat ? '#DC2626' : '#3B82F6')
      .attr('stroke', d => d.isThreat ? '#DC2626' : '#3B82F6')
      .attr('stroke-width', d => d.isThreat ? 3 : 2)
      .attr('stroke-opacity', 0.5)
      .attr('filter', d => d.isThreat ? 'url(#glow)' : null)
      .attr('class', d => d.isThreat ? 'threat-pulse' : '');

    // Workstation nodes
    node.filter(d => d.type === 'workstation')
      .append('rect')
      .attr('width', 32)
      .attr('height', 24)
      .attr('x', -16)
      .attr('y', -12)
      .attr('rx', 4)
      .attr('fill', '#21262D')
      .attr('stroke', '#30363D')
      .attr('stroke-width', 1.5);

    // Node labels
    node.append('text')
      .attr('dy', d => d.type === 'user' ? 35 : 28)
      .attr('text-anchor', 'middle')
      .attr('fill', d => (d as Node).isThreat ? '#DC2626' : '#8B949E')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .text(d => d.id);

    // Icons in nodes
    node.filter(d => d.type === 'user')
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('fill', 'white')
      .attr('font-size', '14px')
      .text('👤');

    node.filter(d => d.type === 'workstation')
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('fill', '#8B949E')
      .attr('font-size', '12px')
      .text('💻');

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as Node).x!)
        .attr('y1', d => (d.source as Node).y!)
        .attr('x2', d => (d.target as Node).x!)
        .attr('y2', d => (d.target as Node).y!);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag behavior
    const drag = d3.drag<SVGGElement, Node>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    node.call(drag as never);

    return () => {
      simulation.stop();
    };
  }, [dimensions, handleNodeClick, threatUserIds]);

  return (
    <div className="flex h-full" ref={containerRef}>
      <div className="flex-1 flex flex-col bg-card rounded-lg border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-[#3B82F6]" />
            <h2 className="text-sm font-semibold">User-Workstation Bipartite Graph</h2>
          </div>
          <div className="flex items-center gap-4 text-xs">
            {Object.entries(eventTypeColors).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 rounded" style={{ backgroundColor: color }} />
                <span className="text-muted-foreground">{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Graph */}
        <div className="flex-1 relative">
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="bg-background"
          />
          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#3B82F6]" />
                <span className="text-muted-foreground">Normal User</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#DC2626] threat-glow" />
                <span className="text-muted-foreground">Flagged User</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-4 rounded bg-secondary border border-border" />
                <span className="text-muted-foreground">Workstation</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Detail Panel */}
      {selectedUser && (
        <UserDetailPanel
          userId={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}
