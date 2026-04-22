'use client';

import { useState } from 'react';
import { Brain, AlertTriangle, CheckCircle, XCircle, Info, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { flaggedUsers, shapFeatures } from '@/lib/mock-data';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const threshold = 0.8833;

function SHAPBarChart({ features }: { features: typeof shapFeatures }) {
  const sortedFeatures = [...features].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  
  const chartData = sortedFeatures.map(f => ({
    feature: f.feature,
    value: f.contribution,
    positive: f.positive,
  }));

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 120, bottom: 10 }}
        >
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: '#8B949E' }}
            tickLine={false}
            axisLine={{ stroke: '#30363D' }}
            domain={[-0.2, 0.5]}
            tickFormatter={(v) => v.toFixed(2)}
          />
          <YAxis
            type="category"
            dataKey="feature"
            tick={{ fontSize: 11, fill: '#E6EDF3', fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={false}
            width={110}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#161B22',
              border: '1px solid #30363D',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: '#E6EDF3', fontFamily: 'monospace' }}
            formatter={(value: number) => [
              `${value > 0 ? '+' : ''}${value.toFixed(3)}`,
              'Contribution'
            ]}
          />
          <ReferenceLine x={0} stroke="#30363D" />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.positive ? '#DC2626' : '#3B82F6'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function LIMEExplanation({ userId, scenario }: { userId: string; scenario: string }) {
  const explanations: Record<string, string> = {
    S1: `This alert was triggered because the user accessed a known exfiltration domain outside working hours and transferred an unusually large file. The HTTP activity pattern matches WikiLeaks-style data theft indicators.`,
    S2: `This alert was triggered because the user connected a USB device and transferred multiple sensitive files during non-business hours. The file access pattern indicates potential data theft via removable media.`,
    S3: `This alert was triggered because the user sent mass internal emails with unusual attachment patterns. The behavior suggests potential sabotage or data distribution to unauthorized internal recipients.`,
  };

  return (
    <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-[#F59E0B] mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-[#F59E0B] mb-2">LIME Explanation</p>
          <p className="text-sm text-foreground leading-relaxed">
            {explanations[scenario] || explanations.S1}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Risk Level:</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#DC2626]/20 text-[#DC2626] border border-[#DC2626]/30">
              CRITICAL
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserSelector({
  users,
  selectedUser,
  onSelect,
}: {
  users: typeof flaggedUsers;
  selectedUser: typeof flaggedUsers[0];
  onSelect: (user: typeof flaggedUsers[0]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-3 bg-card border border-border rounded-lg hover:border-[#3B82F6]/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#DC2626]/20 border border-[#DC2626]/30 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-[#DC2626]" />
          </div>
          <div className="text-left">
            <p className="font-mono font-bold text-[#DC2626]">{selectedUser.userId}</p>
            <p className="text-xs text-muted-foreground">{selectedUser.department} • {selectedUser.scenario}</p>
          </div>
        </div>
        <ChevronDown className={cn(
          'h-5 w-5 text-muted-foreground transition-transform',
          isOpen && 'transform rotate-180'
        )} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden">
          {users.map((user) => (
            <button
              key={user.userId}
              onClick={() => {
                onSelect(user);
                setIsOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left',
                selectedUser.userId === user.userId && 'bg-secondary'
              )}
            >
              <div className="w-8 h-8 rounded-full bg-[#DC2626]/20 border border-[#DC2626]/30 flex items-center justify-center">
                <span className="font-mono text-xs font-bold text-[#DC2626]">
                  {(user.riskScore * 100).toFixed(0)}
                </span>
              </div>
              <div>
                <p className="font-mono font-medium">{user.userId}</p>
                <p className="text-xs text-muted-foreground">{user.scenario} • {user.department}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AlertExplainability() {
  const [selectedUser, setSelectedUser] = useState(flaggedUsers[0]);
  const [actionTaken, setActionTaken] = useState<'approved' | 'dismissed' | null>(null);

  const handleApprove = () => {
    setActionTaken('approved');
    setTimeout(() => setActionTaken(null), 3000);
  };

  const handleDismiss = () => {
    setActionTaken('dismissed');
    setTimeout(() => setActionTaken(null), 3000);
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/30">
            <Brain className="h-6 w-6 text-[#8B5CF6]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Alert Explainability (XAI)</h2>
            <p className="text-sm text-muted-foreground">
              Understand why the model flagged this user as a potential insider threat
            </p>
          </div>
        </div>

        {/* User Selector */}
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
            Select Flagged User
          </label>
          <UserSelector
            users={flaggedUsers}
            selectedUser={selectedUser}
            onSelect={setSelectedUser}
          />
        </div>

        {/* Risk Score Panel */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Predicted Risk Score</p>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-4xl font-bold text-[#DC2626]">
                  {selectedUser.riskScore.toFixed(4)}
                </span>
                <span className="text-sm text-muted-foreground">/ 1.0000</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Detection Threshold</p>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-semibold text-[#F59E0B]">
                  {threshold.toFixed(4)}
                </span>
              </div>
            </div>
          </div>

          {/* Threshold comparison bar */}
          <div className="relative h-4 bg-secondary rounded-full overflow-hidden mb-2">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#10B981] via-[#F59E0B] to-[#DC2626]"
              style={{ width: '100%' }}
            />
            {/* Threshold marker */}
            <div
              className="absolute top-0 h-full w-0.5 bg-white"
              style={{ left: `${threshold * 100}%` }}
            />
            {/* Score marker */}
            <div
              className="absolute -top-1 w-4 h-6 bg-[#DC2626] rounded-sm border-2 border-white"
              style={{ left: `calc(${selectedUser.riskScore * 100}% - 8px)` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.0 (Safe)</span>
            <span>Threshold ({threshold})</span>
            <span>1.0 (Critical)</span>
          </div>

          <div className="mt-4 p-3 bg-[#DC2626]/10 border border-[#DC2626]/30 rounded-lg">
            <p className="text-sm">
              <span className="font-semibold text-[#DC2626]">Alert triggered: </span>
              <span className="text-muted-foreground">
                Risk score ({selectedUser.riskScore.toFixed(4)}) exceeds threshold ({threshold}) by{' '}
                <span className="font-mono font-semibold text-foreground">
                  +{((selectedUser.riskScore - threshold) * 100).toFixed(2)}%
                </span>
              </span>
            </p>
          </div>
        </div>

        {/* SHAP Feature Importance */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-semibold">SHAP Feature Importance</h3>
            <span className="text-xs text-muted-foreground">Top 8 contributing features</span>
          </div>

          <SHAPBarChart features={shapFeatures} />

          <div className="flex items-center justify-center gap-6 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 bg-[#DC2626] rounded" />
              <span className="text-muted-foreground">Increases Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 bg-[#3B82F6] rounded" />
              <span className="text-muted-foreground">Decreases Risk</span>
            </div>
          </div>
        </div>

        {/* LIME Explanation */}
        <LIMEExplanation userId={selectedUser.userId} scenario={selectedUser.scenario} />

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleApprove}
            disabled={actionTaken !== null}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all',
              actionTaken === 'approved'
                ? 'bg-[#10B981] text-white'
                : 'bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] hover:bg-[#10B981]/20'
            )}
          >
            <CheckCircle className="h-5 w-5" />
            {actionTaken === 'approved' ? 'Alert Approved' : 'Approve Alert'}
          </button>
          <button
            onClick={handleDismiss}
            disabled={actionTaken !== null}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all',
              actionTaken === 'dismissed'
                ? 'bg-[#6B7280] text-white'
                : 'bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/80'
            )}
          >
            <XCircle className="h-5 w-5" />
            {actionTaken === 'dismissed' ? 'Alert Dismissed' : 'Dismiss'}
          </button>
        </div>

        {/* Feature Glossary */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold mb-3">Feature Glossary</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2">
              <code className="font-mono text-[#3B82F6] bg-secondary px-1.5 py-0.5 rounded">is_exf_domain</code>
              <span className="text-muted-foreground">Accessed known exfiltration domain</span>
            </div>
            <div className="flex items-start gap-2">
              <code className="font-mono text-[#3B82F6] bg-secondary px-1.5 py-0.5 rounded">after_working_hours</code>
              <span className="text-muted-foreground">Activity outside 9-5 hours</span>
            </div>
            <div className="flex items-start gap-2">
              <code className="font-mono text-[#3B82F6] bg-secondary px-1.5 py-0.5 rounded">is_http</code>
              <span className="text-muted-foreground">HTTP/web activity type</span>
            </div>
            <div className="flex items-start gap-2">
              <code className="font-mono text-[#3B82F6] bg-secondary px-1.5 py-0.5 rounded">log_size</code>
              <span className="text-muted-foreground">Log-transformed file size</span>
            </div>
            <div className="flex items-start gap-2">
              <code className="font-mono text-[#3B82F6] bg-secondary px-1.5 py-0.5 rounded">hour_sin</code>
              <span className="text-muted-foreground">Cyclical hour encoding</span>
            </div>
            <div className="flex items-start gap-2">
              <code className="font-mono text-[#3B82F6] bg-secondary px-1.5 py-0.5 rounded">internal_emails_count</code>
              <span className="text-muted-foreground">Number of internal recipients</span>
            </div>
            <div className="flex items-start gap-2">
              <code className="font-mono text-[#3B82F6] bg-secondary px-1.5 py-0.5 rounded">is_zip</code>
              <span className="text-muted-foreground">File is compressed archive</span>
            </div>
            <div className="flex items-start gap-2">
              <code className="font-mono text-[#3B82F6] bg-secondary px-1.5 py-0.5 rounded">is_keylogger</code>
              <span className="text-muted-foreground">Keylogger activity detected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
