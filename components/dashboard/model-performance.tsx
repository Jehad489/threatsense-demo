'use client';

import { BarChart3, Target, Percent, Activity, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { modelMetrics, confusionMatrix, prCurveData, scenarioRecall } from '@/lib/mock-data';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';

function MetricCard({
  label,
  value,
  icon: Icon,
  format = 'percent',
  highlight = false,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  format?: 'percent' | 'decimal';
  highlight?: boolean;
}) {
  const displayValue = format === 'percent'
    ? `${(value * 100).toFixed(2)}%`
    : value.toFixed(4);

  return (
    <div className={cn(
      'bg-card rounded-lg border p-4 transition-all',
      highlight ? 'border-[#3B82F6]/50 bg-[#3B82F6]/5' : 'border-border'
    )}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-[#3B82F6]" />
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="font-mono text-2xl font-bold text-foreground">{displayValue}</p>
    </div>
  );
}

function ConfusionMatrixTile() {
  const total = confusionMatrix.tp + confusionMatrix.fp + confusionMatrix.fn + confusionMatrix.tn;
  const malicious = confusionMatrix.tp + confusionMatrix.fn;
  const normal = confusionMatrix.fp + confusionMatrix.tn;
  const ratio = Math.round(normal / malicious);

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-4 w-4 text-[#F59E0B]" />
        <h3 className="text-sm font-semibold">Confusion Matrix</h3>
      </div>

      <div className="grid grid-cols-3 gap-1 mb-4">
        {/* Header row */}
        <div />
        <div className="text-center text-xs text-muted-foreground font-mono py-1">Pred +</div>
        <div className="text-center text-xs text-muted-foreground font-mono py-1">Pred -</div>
        
        {/* Actual Positive row */}
        <div className="text-xs text-muted-foreground font-mono py-2 text-right pr-2">Actual +</div>
        <div className="bg-[#10B981]/20 border border-[#10B981]/30 rounded p-2 text-center">
          <span className="text-xs text-muted-foreground">TP</span>
          <p className="font-mono font-bold text-[#10B981]">{confusionMatrix.tp}</p>
        </div>
        <div className="bg-[#DC2626]/20 border border-[#DC2626]/30 rounded p-2 text-center">
          <span className="text-xs text-muted-foreground">FN</span>
          <p className="font-mono font-bold text-[#DC2626]">{confusionMatrix.fn}</p>
        </div>
        
        {/* Actual Negative row */}
        <div className="text-xs text-muted-foreground font-mono py-2 text-right pr-2">Actual -</div>
        <div className="bg-[#F59E0B]/20 border border-[#F59E0B]/30 rounded p-2 text-center">
          <span className="text-xs text-muted-foreground">FP</span>
          <p className="font-mono font-bold text-[#F59E0B]">{confusionMatrix.fp}</p>
        </div>
        <div className="bg-[#3B82F6]/20 border border-[#3B82F6]/30 rounded p-2 text-center">
          <span className="text-xs text-muted-foreground">TN</span>
          <p className="font-mono font-bold text-[#3B82F6]">{confusionMatrix.tn.toLocaleString()}</p>
        </div>
      </div>

      {/* Imbalance Callout */}
      <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-[#F59E0B] mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-[#F59E0B]">Extreme Class Imbalance</p>
            <p className="text-xs text-muted-foreground mt-1">
              1 malicious : {ratio.toLocaleString()} normal events
            </p>
            <p className="text-[10px] text-muted-foreground mt-1 font-mono">
              {`"Needle in a haystack" detection challenge`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PRCurveChart() {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-4 w-4 text-[#3B82F6]" />
        <h3 className="text-sm font-semibold">Precision-Recall Curve</h3>
        <span className="ml-auto text-xs font-mono text-muted-foreground">
          AUPRC: {modelMetrics.auprc.toFixed(4)}
        </span>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={prCurveData}>
            <defs>
              <linearGradient id="prGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="recall"
              tick={{ fontSize: 10, fill: '#8B949E' }}
              tickLine={false}
              axisLine={{ stroke: '#30363D' }}
              label={{ value: 'Recall', position: 'bottom', fontSize: 11, fill: '#8B949E' }}
              domain={[0, 1]}
              tickFormatter={(v) => v.toFixed(1)}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#8B949E' }}
              tickLine={false}
              axisLine={{ stroke: '#30363D' }}
              label={{ value: 'Precision', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#8B949E' }}
              domain={[0.8, 1]}
              tickFormatter={(v) => v.toFixed(1)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#161B22',
                border: '1px solid #30363D',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: '#8B949E' }}
              formatter={(value: number, name: string) => [
                `${(value * 100).toFixed(2)}%`,
                name.charAt(0).toUpperCase() + name.slice(1)
              ]}
              labelFormatter={(value) => `Recall: ${(value * 100).toFixed(1)}%`}
            />
            <ReferenceLine
              x={modelMetrics.recall}
              stroke="#10B981"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
            <ReferenceLine
              y={modelMetrics.precision}
              stroke="#10B981"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
            <Area
              type="monotone"
              dataKey="precision"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#prGradient)"
            />
            {/* Operating point marker */}
            <Line
              data={[{ recall: modelMetrics.recall, precision: modelMetrics.precision }]}
              type="monotone"
              dataKey="precision"
              stroke="none"
              dot={{ r: 6, fill: '#10B981', stroke: '#0D1117', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#10B981]" />
          <span>Operating Point</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-0.5 bg-[#3B82F6]" />
          <span>PR Curve</span>
        </div>
      </div>
    </div>
  );
}

function ScenarioRecallGauge({ scenario, recall }: { scenario: string; recall: number }) {
  const needsImprovement = recall === 0;

  return (
    <div className={cn(
      'bg-card rounded-lg border p-4',
      needsImprovement ? 'border-[#F59E0B]/30' : 'border-border'
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-secondary">
            {scenario}
          </span>
          <span className="text-xs text-muted-foreground">
            {scenario === 'S1' && 'WikiLeaks Exfil'}
            {scenario === 'S2' && 'USB Theft'}
            {scenario === 'S3' && 'Email Sabotage'}
          </span>
        </div>
        {needsImprovement && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30">
            Needs Improvement
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-secondary rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            recall > 0.5 ? 'bg-[#10B981]' : recall > 0 ? 'bg-[#F59E0B]' : 'bg-[#DC2626]'
          )}
          style={{ width: `${recall * 100}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="font-mono text-lg font-bold" style={{
          color: recall > 0.5 ? '#10B981' : recall > 0 ? '#F59E0B' : '#DC2626'
        }}>
          {(recall * 100).toFixed(2)}%
        </span>
        <span className="text-xs text-muted-foreground">Recall</span>
      </div>
    </div>
  );
}

export function ModelPerformance() {
  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Metric Cards */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-[#3B82F6]" />
          <h2 className="text-lg font-semibold">Model Performance Metrics</h2>
          <span className="text-xs text-muted-foreground ml-2 font-mono">TGN + BiLSTM</span>
        </div>
        <div className="grid grid-cols-5 gap-4">
          <MetricCard label="AUPRC" value={modelMetrics.auprc} icon={BarChart3} format="decimal" highlight />
          <MetricCard label="F1-Score" value={modelMetrics.f1Score} icon={Target} format="decimal" />
          <MetricCard label="Precision" value={modelMetrics.precision} icon={Percent} />
          <MetricCard label="Recall" value={modelMetrics.recall} icon={CheckCircle2} />
          <MetricCard label="Accuracy" value={modelMetrics.accuracy} icon={Activity} />
        </div>
      </div>

      {/* PR Curve and Confusion Matrix */}
      <div className="grid grid-cols-2 gap-6">
        <PRCurveChart />
        <ConfusionMatrixTile />
      </div>

      {/* Per-Scenario Recall */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-[#F59E0B]" />
          <h2 className="text-lg font-semibold">Per-Scenario Recall</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <ScenarioRecallGauge scenario="S1" recall={scenarioRecall.S1} />
          <ScenarioRecallGauge scenario="S2" recall={scenarioRecall.S2} />
          <ScenarioRecallGauge scenario="S3" recall={scenarioRecall.S3} />
        </div>
      </div>

      {/* Model Info */}
      <div className="bg-card rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold mb-3">Model Architecture</h3>
        <div className="grid grid-cols-4 gap-4 text-xs">
          <div>
            <p className="text-muted-foreground">Base Model</p>
            <p className="font-mono font-semibold">Temporal Graph Network</p>
          </div>
          <div>
            <p className="text-muted-foreground">Sequence Encoder</p>
            <p className="font-mono font-semibold">BiLSTM (128 units)</p>
          </div>
          <div>
            <p className="text-muted-foreground">Training Dataset</p>
            <p className="font-mono font-semibold">CERT v4.2</p>
          </div>
          <div>
            <p className="text-muted-foreground">Threshold</p>
            <p className="font-mono font-semibold">0.8833</p>
          </div>
        </div>
      </div>
    </div>
  );
}
